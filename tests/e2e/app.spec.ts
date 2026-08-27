import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('practises the starter routine with keyboard cues', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pad Light Choreographer/);
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('button', { name: /Start response/ }).click();
  await expect(page.getByRole('button', { name: /next cue/i })).toContainText('Kick');
  await page.keyboard.press('1');
  await expect(page.getByRole('button', { name: /next cue/i })).toContainText('Clap');
  await page.keyboard.press('2');
  await expect(page.locator('.score-strip strong').nth(1)).toHaveText('2');
});

test('edits and saves a local routine', async ({ page }) => {
  await page.goto('/#arrange');
  await page.getByLabel('Routine name').fill('Pocket test');
  await page.getByRole('button', { name: 'Step 1, Kick, selected' }).click();
  await page.getByRole('button', { name: 'Step 1, Tone' }).click();
  await page.getByRole('button', { name: 'Save routine' }).click();
  await expect(page.getByRole('status')).toContainText('Saved “Pocket test”');
  await page.reload();
  await expect(page.getByLabel('Routine name')).toHaveValue('Pocket test');
  await expect(page.getByRole('button', { name: 'Step 1, Tone, selected' })).toBeVisible();
});

test('pairs a safe note-only MIDI device and tests lights', async ({ page }) => {
  await page.addInitScript(() => {
    const input = { id: 'input-1', name: 'Test Grid', manufacturer: 'Workshop', onmidimessage: null as null | ((event: { data: Uint8Array }) => void) };
    const sent: number[][] = [];
    const output = { id: 'output-1', name: 'Test Grid', manufacturer: 'Workshop', send: (data: number[]) => sent.push([...data]) };
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: async () => ({ inputs: new Map([[input.id, input]]), outputs: new Map([[output.id, output]]), onstatechange: null }),
    });
    Object.assign(window, { __testMidi: { input, sent } });
  });
  await page.goto('/#connect');
  await page.getByRole('button', { name: 'Allow MIDI access' }).click();
  await expect(page.getByLabel('MIDI input')).toHaveValue('input-1');
  await page.getByLabel('Send pad lights').check();
  await page.getByRole('button', { name: 'Test all four lights' }).click();
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => (window as unknown as { __testMidi: { sent: number[][] } }).__testMidi.sent)).toEqual([
    [144, 36, 96], [128, 36, 0], [144, 37, 96], [128, 37, 0],
    [144, 38, 96], [128, 38, 0], [144, 39, 96], [128, 39, 0],
  ]);
});

test('has no serious accessibility violations in every workspace', async ({ page }) => {
  for (const route of ['/', '/#arrange', '/#connect']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).disableRules(['landmark-unique']).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')), route).toEqual([]);
  }
});

test('serves the privacy and terms pages', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page).toHaveTitle(/Privacy/);
  await expect(page.locator('h1')).toHaveText('Privacy');
  await page.goto('/terms/');
  await expect(page).toHaveTitle(/Terms/);
  await expect(page.locator('h1')).toHaveText('Terms');
});

test('continues working offline after installation', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Service worker check runs once in Chromium.');
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText(/Offline rehearsal/)).toBeVisible();
  await page.getByRole('button', { name: /Start response/ }).click();
  await page.keyboard.press('1');
  await expect(page.locator('.score-strip strong').nth(1)).toHaveText('1');
  await context.setOffline(false);
});
