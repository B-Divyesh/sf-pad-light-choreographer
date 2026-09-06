import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

function installMidiMock(page: import('@playwright/test').Page): Promise<void> {
  return page.addInitScript(() => {
    const input = { id: 'input-1', name: 'Test Grid', manufacturer: 'Workshop', onmidimessage: null as null | ((event: { data: Uint8Array }) => void) };
    const sent: number[][] = [];
    const calls: unknown[] = [];
    const output = { id: 'output-1', name: 'Test Grid', manufacturer: 'Workshop', send: (data: number[]) => sent.push([...data]) };
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: async (options: unknown) => {
        calls.push(options);
        return { inputs: new Map([[input.id, input]]), outputs: new Map([[output.id, output]]), onstatechange: null };
      },
    });
    Object.assign(window, { __testMidi: { input, sent, calls } });
  });
}

test('@claim:midi-discovery requests standard MIDI access and lists connected ports', async ({ page }) => {
  await installMidiMock(page);
  await page.goto('/demo/connect');
  await page.getByRole('button', { name: 'Allow MIDI access' }).click();
  await expect(page.getByLabel('MIDI input')).toHaveValue('input-1');
  await expect(page.getByLabel('MIDI output')).toHaveValue('output-1');
  expect(await page.evaluate(() => (window as unknown as { __testMidi: { calls: unknown[] } }).__testMidi.calls)).toEqual([{ sysex: false }]);
});

test('@claim:midi-lights sends opt-in note messages on the selected channel', async ({ page }) => {
  await installMidiMock(page);
  await page.goto('/demo/connect');
  await page.getByRole('button', { name: 'Allow MIDI access' }).click();
  await page.getByLabel('Send pad lights').check();
  await expect(page.getByLabel('Channel')).toBeEnabled();
  await page.getByLabel('Channel').fill('2');
  await page.getByLabel('Channel').press('Tab');
  await page.getByRole('button', { name: 'Test all four lights' }).click();
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => (window as unknown as { __testMidi: { sent: number[][] } }).__testMidi.sent)).toEqual([
    [145, 36, 96], [129, 36, 0], [145, 37, 96], [129, 37, 0],
    [145, 38, 96], [129, 38, 0], [145, 39, 96], [129, 39, 0],
  ]);
});

test('@claim:keyboard-practice starts and plays a response with keys 1–4 and Space', async ({ page }) => {
  await page.goto('/demo');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: /next cue/i })).toContainText('Kick');
  for (const key of ['1', '2', '3', '4']) await page.keyboard.press(key);
  await expect(page.locator('.score-strip strong').nth(1)).toHaveText('4');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Start response' })).toBeVisible();
});

test('@claim:editor-bounds enforces routine length and tempo limits', async ({ page }) => {
  await page.goto('/demo/arrange');
  const remove = page.getByRole('button', { name: /Remove step/ });
  for (let index = 0; index < 11; index += 1) await remove.click();
  await expect(remove).toBeDisabled();
  const add = page.getByRole('button', { name: /Add step/ });
  for (let index = 0; index < 63; index += 1) await add.click();
  await expect(add).toBeDisabled();
  await page.getByLabel('Tempo').fill('39');
  await page.getByRole('button', { name: 'Save routine' }).click();
  await expect(page.getByRole('status')).toContainText('Tempo must be from 40–240 BPM');
  await page.getByLabel('Tempo').fill('240');
  await page.getByRole('button', { name: 'Save routine' }).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  await expect(page.locator('.heading-stamp')).toContainText('64 steps');
  await expect(page.locator('.heading-stamp')).toContainText('240 BPM');
});

test('@claim:portable-json exports a versioned routine and rejects an oversized import', async ({ page }) => {
  await page.goto('/demo/arrange');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export JSON' }).click(),
  ]);
  const stream = await download.createReadStream();
  let exported = '';
  for await (const chunk of stream!) exported += chunk.toString();
  expect(JSON.parse(exported)).toMatchObject({ format: 'pad-light-routine', version: 1 });

  await page.locator('#import-routine').setInputFiles({
    name: 'three-steps.padlight.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'pad-light-routine', version: 1, name: 'Three steps', steps: [0, 1, 3], bpm: 100 })),
  });
  await expect(page.getByRole('status')).toContainText('Imported “Three steps”');
  await page.locator('#import-routine').setInputFiles({
    name: 'large.padlight.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(100_001, 32),
  });
  await expect(page.getByRole('status')).toContainText('under 100 KB');
});

test('@claim:local-persistence saves a routine in browser storage after reload', async ({ page }) => {
  await page.goto('/demo/arrange');
  await page.getByLabel('Routine name').fill('Demo persistence check');
  await page.getByRole('button', { name: 'Save routine' }).click();
  await page.reload();
  await expect(page.getByLabel('Routine name')).toHaveValue('Demo persistence check');
});

test('@claim:offline-reload practises the sample offline after the first visit', async ({ browser, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Service worker check runs once in Chromium.');
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const baseURL = testInfo.project.use.baseURL as string;
    await page.goto(baseURL + '/demo');
    await page.waitForFunction(() => navigator.serviceWorker?.ready);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
    await page.keyboard.press('Space');
    await page.keyboard.press('1');
    await expect(page.locator('.score-strip strong').nth(1)).toHaveText('1');
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:private-free keeps the sample flow on this origin without an account or checkout', async ({ page }, testInfo) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Start response' }).click();
  await page.keyboard.press('1');
  await expect(page.getByText('Free. No account.')).toBeVisible();
  await page.getByRole('link', { name: 'Arrange' }).click();
  const origin = new URL(testInfo.project.use.baseURL as string).origin;
  expect([...new Set(requests.map((url) => new URL(url).origin))]).toEqual([origin]);
  await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
});

test('keeps demo data separate from real routines and resets the demo sample', async ({ page }) => {
  await page.goto('/arrange');
  await page.getByLabel('Routine name').fill('Real routine only');
  await page.getByRole('button', { name: 'Save routine' }).click();
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#routine-select')).not.toContainText('Real routine only');
  await page.goto('/demo/arrange');
  await page.getByLabel('Routine name').fill('Demo change only');
  await page.getByRole('button', { name: 'Save routine' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByLabel('Routine name')).toHaveValue('Sample: Pocket call and response');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#routine-select')).toContainText('Real routine only');
});

test('uses URL history, titles, managed focus, and route announcements', async ({ page }) => {
  await page.goto('/arrange');
  await page.getByRole('link', { name: 'Pair MIDI' }).click();
  await expect(page).toHaveURL(/\/connect$/);
  await expect(page).toHaveTitle('Pair MIDI pads — Pad Light Choreographer');
  await expect(page.locator('h1')).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('Pair MIDI pads');
  await page.goBack();
  await expect(page).toHaveURL(/\/arrange$/);
  await expect(page).toHaveTitle('Arrange routines — Pad Light Choreographer');
  await expect(page.locator('h1')).toHaveText('Arrange a routine');
  await expect(page.locator('h1')).toBeFocused();
});

test('serves metadata, legal pages, discovery files, and a designed 404', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pad-light-choreographer.sociobot.in/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /pad-cue-social\.jpg$/);
  const robots = await page.request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap:');
  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('<urlset');
  const notFound = await page.goto('/this-page-does-not-exist');
  expect(notFound?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Pad Light Choreographer');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.goto('/privacy/');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Project repository' })).toHaveAttribute('href', /github\.com/);
  await page.goto('/terms/');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeVisible();
});

test('has no serious accessibility violations on product and legal routes', async ({ page }) => {
  for (const route of ['/demo', '/demo/arrange', '/demo/connect', '/privacy/', '/terms/']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')), route).toEqual([]);
  }
});

test('sends the update command to a waiting worker', async ({ page }) => {
  await page.addInitScript(() => {
    const events = new EventTarget();
    const messages: unknown[] = [];
    const waiting = { postMessage: (message: unknown) => messages.push(message) };
    const registration = { waiting, addEventListener: () => undefined };
    Object.assign(window, { __serviceWorkerTest: { messages } });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: async () => registration,
        addEventListener: events.addEventListener.bind(events),
      },
    });
  });
  await page.goto('/demo');
  await expect(page.getByRole('button', { name: 'Update app' })).toBeVisible();
  await page.getByRole('button', { name: 'Update app' }).click();
  expect(await page.evaluate(() => (window as unknown as { __serviceWorkerTest: { messages: unknown[] } }).__serviceWorkerTest.messages)).toEqual([
    { type: 'SKIP_WAITING' },
  ]);
});

test('keeps the 390px sample action unobstructed', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'This regression is specific to the 390px mobile layout.');
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto('/');
  const action = page.locator('#try-sample');
  await action.scrollIntoViewIfNeeded();
  const point = await action.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const topElement = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    return topElement === element || element.contains(topElement);
  });
  expect(point).toBe(true);
});
