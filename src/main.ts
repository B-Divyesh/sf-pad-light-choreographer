import './styles.css';
import { defaultSettings, normalizeImportedRoutine, normalizeRoutine, routineFile, starterRoutine, type Lane, type Routine, type Settings } from './model';
import { clearStorage, deleteRoutine, getSettings, listRoutines, saveRoutine, saveSettings, type StorageScope } from './storage';
import { MidiController } from './midi';

type View = 'practice' | 'arrange' | 'connect';

const laneNames = ['Kick', 'Clap', 'Hat', 'Tone'];
const laneKeys = ['1', '2', '3', '4'];
const BUILD_ID = '1.2.0';
const app = document.querySelector<HTMLDivElement>('#app')!;

let routines: Routine[] = [];
let current: Routine;
let settings: Settings = structuredClone(defaultSettings);
let midi: MidiController;
let view: View = 'practice';
let isDemo = false;
let connected = false;
let busy = true;
let playing = false;
let previewing = false;
let currentStep = -1;
let hits = 0;
let misses = 0;
let pressedLane: Lane | null = null;
let message = 'Loading routines…';
let messageTone: 'neutral' | 'success' | 'error' = 'neutral';
let isOffline = !navigator.onLine;
let installPrompt: BeforeInstallPromptEvent | null = null;
let updateReady = false;
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
const previewTimers: number[] = [];

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface RenderOptions {
  manageFocus?: boolean;
  announceRoute?: boolean;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
}

function storageScope(): StorageScope {
  return isDemo ? 'demo' : 'real';
}

function sampleRoutines(): Routine[] {
  const now = Date.now();
  return [
    {
      id: 'demo-pocket-call-response',
      name: 'Sample: Pocket call and response',
      steps: [0, 1, 2, 3, 0, null, 2, 1, 3, 0, 1, 3],
      bpm: 96,
      updatedAt: now,
    },
    {
      id: 'demo-offbeat-turnaround',
      name: 'Sample: Offbeat turnaround',
      steps: [0, null, 2, 1, 0, 3, null, 1],
      bpm: 108,
      updatedAt: now - 1,
    },
  ];
}

function pathFor(nextView: View, demo = isDemo): string {
  if (demo) return nextView === 'practice' ? '/demo' : `/demo/${nextView}`;
  return nextView === 'practice' ? '/' : `/${nextView}`;
}

function readRoute(): void {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  isDemo = parts[0] === 'demo';
  const requested = isDemo ? parts[1] : parts[0];
  view = requested === 'arrange' || requested === 'connect' ? requested : 'practice';
}

function routeLabel(): string {
  if (isDemo) return view === 'practice' ? 'Demo practice' : `Demo ${view === 'arrange' ? 'routine editor' : 'MIDI pairing'}`;
  return view === 'practice' ? 'Practice routines' : view === 'arrange' ? 'Arrange routines' : 'Pair MIDI pads';
}

function routeTitle(): string {
  if (isDemo) return 'Demo — Pad Light Choreographer';
  if (view === 'arrange') return 'Arrange routines — Pad Light Choreographer';
  if (view === 'connect') return 'Pair MIDI pads — Pad Light Choreographer';
  return 'Pad Light Choreographer — practise pad cues';
}

function announce(text: string, tone: typeof messageTone = 'neutral'): void {
  message = text;
  messageTone = tone;
  const region = document.querySelector<HTMLElement>('#live-status');
  if (region) {
    region.textContent = text;
    region.dataset.tone = tone;
  }
}

function connectionLabel(): string {
  if (!midi?.supported) return 'MIDI unavailable';
  if (!connected) return 'Pair MIDI';
  const input = midi.inputs().find((port) => port.id === settings.inputId);
  return input ? `Paired: ${input.name || 'MIDI input'}` : 'Paired · choose input';
}

function navLink(nextView: View, label: string): string {
  const path = pathFor(nextView);
  return `<a class="nav-tab ${view === nextView ? 'is-active' : ''}" href="${path}" data-route="${path}" ${view === nextView ? 'aria-current="page"' : ''}>${label}</a>`;
}

function render(options: RenderOptions = {}): void {
  document.title = routeTitle();
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="/" data-route="/">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span>Pad Light Choreographer</span>
      </a>
      <nav aria-label="Primary">
        ${navLink('practice', 'Practise')}
        ${navLink('arrange', 'Arrange')}
        ${navLink('connect', 'Pair MIDI')}
        <a class="nav-tab ${isDemo ? 'is-active' : ''}" href="/demo" data-route="/demo" ${isDemo ? 'aria-current="page"' : ''}>Demo</a>
      </nav>
      <button class="status-stamp ${connected ? 'is-connected' : ''}" data-route="${pathFor('connect')}">
        <span aria-hidden="true">${connected ? '●' : '○'}</span> ${escapeHtml(connectionLabel())}
      </button>
    </header>
    <p id="route-status" class="sr-only" aria-live="polite" aria-atomic="true"></p>
    ${isDemo ? `<aside class="demo-banner" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved</strong><span>Changes stay separate from your routines.</span><button id="reset-demo">Reset demo</button><a href="/" data-route="/">Start for real</a></aside>` : ''}
    ${isOffline ? '<div class="offline-strip" role="status">Offline rehearsal — routines still work and save in browser storage.</div>' : ''}
    <div id="live-status" class="live-status" data-tone="${messageTone}" role="status" aria-live="polite">${escapeHtml(message)}</div>
    ${updateReady ? '<div class="update-toast" role="status"><span>An app update is ready.</span><button id="reload-app">Update app</button></div>' : ''}
    <main id="main" tabindex="-1">
      ${view === 'practice' ? practiceView() : view === 'arrange' ? arrangeView() : connectView()}
    </main>
    ${footer()}`;
  bindGlobal();
  if (view === 'practice') bindPractice();
  if (view === 'arrange') bindArrange();
  if (view === 'connect') bindConnect();
  if (options.manageFocus || options.announceRoute) {
    requestAnimationFrame(() => {
      if (options.manageFocus) document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
      if (options.announceRoute) {
        const region = document.querySelector<HTMLElement>('#route-status');
        if (region) region.textContent = routeLabel();
      }
    });
  }
}

function footer(): string {
  return `<footer>
    <p>Practise four-lane MIDI-pad routines in your browser.</p>
    <div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><button class="text-button" id="install-app" ${installPrompt ? '' : 'hidden'}>Install app</button></div>
    <p class="art-credit">Built by Param Factory · build ${BUILD_ID} · AI-assisted artwork</p>
  </footer>`;
}

function hero(): string {
  return `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <h1 id="hero-title" tabindex="-1">Practise four-lane pad-light routines</h1>
        <p>MIDI-pad owners practise each cue with their pads, not a mouse.</p>
        <div class="hero-actions">
          <a class="button-like primary" id="try-sample" href="/demo" data-route="/demo">Try it with sample data</a>
          <span class="action-result">Loads a full routine you can play now.</span>
          <a class="button-like" href="${pathFor('arrange')}" data-route="${pathFor('arrange')}">Make a routine</a>
        </div>
        <ul class="hero-facts">
          <li>Free. No account.</li>
          <li>Routines stay in browser storage.</li>
          <li>Works offline after the first visit.</li>
        </ul>
      </div>
      <figure class="hero-art">
        <img src="/assets/pad-cue-hero.webp" srcset="/assets/pad-cue-hero-480.webp 480w, /assets/pad-cue-hero-800.webp 800w, /assets/pad-cue-hero.webp 1200w" sizes="(max-width: 700px) calc(100vw - 36px), (max-width: 980px) calc(100vw - 10vw), 55vw" width="1200" height="800" alt="An unbranded four-pad MIDI controller beside a printed practice routine" fetchpriority="high" decoding="async" />
        <figcaption>Four pads and a short practice routine.</figcaption>
      </figure>
    </section>`;
}

function practiceView(): string {
  const target = currentStep >= 0 ? current.steps[currentStep] : null;
  const complete = !playing && currentStep >= current.steps.length;
  return `
    ${hero()}
    <section class="workbench" aria-labelledby="practice-title">
      <div class="section-intro">
        <div><h2 id="practice-title">Practise this routine</h2><p>Start a response, then strike the pad marked Next.</p></div>
        <label class="routine-picker">Routine
          <select id="routine-select">${routines.map((routine) => `<option value="${routine.id}" ${routine.id === current.id ? 'selected' : ''}>${escapeHtml(routine.name)}</option>`).join('')}</select>
        </label>
      </div>
      <div class="practice-layout">
        <div class="score-strip" aria-label="Routine progress">
          <div><span class="score-label">Tempo</span><strong>${current.bpm}</strong><small>BPM</small></div>
          <div><span class="score-label">Hit</span><strong>${hits}</strong><small>right</small></div>
          <div><span class="score-label">Miss</span><strong>${misses}</strong><small>wrong</small></div>
          <div><span class="score-label">Step</span><strong>${currentStep < 0 ? '—' : Math.min(currentStep + 1, current.steps.length)}</strong><small>of ${current.steps.length}</small></div>
        </div>
        <div class="stage">
          <div class="cue-tape" aria-label="Cue sequence">
            ${current.steps.map((step, index) => `<span class="cue-dot lane-${step ?? 'rest'} ${index === currentStep ? 'is-current' : ''} ${index < currentStep ? 'is-past' : ''}" aria-label="Step ${index + 1}: ${step === null ? 'rest' : laneNames[step]}">${step === null ? '·' : step + 1}</span>`).join('')}
          </div>
          <div class="next-cue">
            <span>${playing ? 'Waiting for' : complete ? 'Routine complete' : previewing ? 'Playing routine' : 'Ready to practise'}</span>
            <strong>${playing && target !== null ? `${Number(target) + 1} / ${laneNames[Number(target)]}` : complete ? `${hits} hits · ${misses} misses` : previewing ? 'Listen and watch' : current.name}</strong>
          </div>
          <div class="pad-grid" aria-label="Four practice pads">
            ${([0, 1, 2, 3] as Lane[]).map((lane) => padButton(lane, target === lane && playing)).join('')}
          </div>
          <div class="transport">
            <button class="primary" id="toggle-play">${playing ? 'Stop response' : complete ? 'Play again' : 'Start response'}</button>
            <button id="preview-cue" ${playing ? 'disabled' : ''}>${previewing ? 'Stop preview' : 'Preview routine'}</button>
            <a class="button-like" href="${pathFor('arrange')}" data-route="${pathFor('arrange')}">Edit routine</a>
          </div>
          <p class="stage-help">Use keys 1–4 or a mapped pad. Space starts or stops a response.</p>
        </div>
      </div>
    </section>
    ${informationSections()}`;
}

function informationSections(): string {
  return `<section class="info-section" aria-labelledby="how-title">
    <h2 id="how-title">How it works</h2>
    <ol class="how-list">
      <li><h3>Load a routine</h3><p>Try the sample or make your own four-lane sequence.</p></li>
      <li><h3>Pair a MIDI pad</h3><p>Allow standard Web MIDI access and check the mapped notes.</p></li>
      <li><h3>Practise each cue</h3><p>Strike the pad marked Next and keep your score.</p></li>
    </ol>
  </section>
  <section class="info-section info-limit" aria-labelledby="limits-title">
    <h2 id="limits-title">What this app does not do</h2>
    <p>It does not connect to a DAW, send vendor commands, flash firmware, or include song charts.</p>
    <h2>Privacy and your routines</h2>
    <p>Routines and MIDI preferences stay in browser storage. MIDI messages stay in the page. Export JSON whenever you want a file.</p>
  </section>`;
}

function padButton(lane: Lane, isTarget: boolean): string {
  const shape = ['●', '▲', '■', '◆'][lane];
  return `<button class="practice-pad lane-${lane} ${isTarget ? 'is-target' : ''} ${pressedLane === lane ? 'is-pressed' : ''}" data-lane="${lane}" aria-pressed="${pressedLane === lane}">
    <span class="pad-number">0${lane + 1}</span><span class="pad-shape" aria-hidden="true">${shape}</span><strong>${laneNames[lane]}</strong><kbd>${lane + 1}</kbd>${isTarget ? '<span class="next-label">Next</span>' : ''}<span class="sr-only">Lane ${lane + 1}.${isTarget ? ' Next cue.' : ''}</span>
  </button>`;
}

function arrangeView(): string {
  return `
    <section class="page-heading">
      <div><h1 tabindex="-1">Arrange a routine</h1><p>Each column is one moment. Choose a lane or a rest, then save the routine in browser storage.</p></div>
      <div class="heading-stamp">${current.steps.length} steps<br>${current.bpm} BPM</div>
    </section>
    <section class="editor" aria-labelledby="editor-title">
      <h2 id="editor-title" class="sr-only">Routine editor</h2>
      <div class="editor-fields">
        <label>Routine name<input id="routine-name" value="${escapeHtml(current.name)}" maxlength="80" /></label>
        <label>Tempo<input id="routine-bpm" type="number" value="${current.bpm}" min="40" max="240" inputmode="numeric" /></label>
      </div>
      <div class="sequence-scroll" tabindex="0" aria-label="Scrollable step sequencer">
        <div class="sequence" style="--steps:${current.steps.length}">
          <div class="sequence-corner">Lane</div>
          ${current.steps.map((_, index) => `<div class="step-number">${String(index + 1).padStart(2, '0')}</div>`).join('')}
          ${([0, 1, 2, 3] as Lane[]).map((lane) => `
            <div class="lane-label lane-${lane}"><b>0${lane + 1}</b><span>${laneNames[lane]}</span></div>
            ${current.steps.map((step, index) => `<button class="step-cell lane-${lane} ${step === lane ? 'is-on' : ''}" data-step="${index}" data-lane="${lane}" aria-label="Step ${index + 1}, ${laneNames[lane]}${step === lane ? ', selected' : ''}" aria-pressed="${step === lane}"><span aria-hidden="true">${step === lane ? ['●', '▲', '■', '◆'][lane] : ''}</span></button>`).join('')}`).join('')}
        </div>
      </div>
      <div class="editor-actions">
        <button id="remove-step" ${current.steps.length <= 1 ? 'disabled' : ''}>− Remove step</button>
        <button id="add-step" ${current.steps.length >= 64 ? 'disabled' : ''}>+ Add step</button>
        <span class="action-spacer"></span>
        <button id="new-routine">New routine</button>
        <button class="primary" id="save-routine">Save routine</button>
      </div>
    </section>
    <section class="library" aria-labelledby="library-title">
      <div><h2 id="library-title">Routine library</h2><p>Stored in this browser. Import or export a small Pad Light JSON file.</p></div>
      <div class="library-actions">
        <button id="export-routine">Export JSON</button>
        <label class="button-like" for="import-routine">Import JSON</label>
        <input class="sr-only" id="import-routine" type="file" accept="application/json,.json" />
        <button class="danger-button" id="delete-routine" ${routines.length <= 1 ? 'disabled' : ''}>Delete routine</button>
      </div>
    </section>`;
}

function connectView(): string {
  const inputs = connected ? midi.inputs() : [];
  const outputs = connected ? midi.outputs() : [];
  return `
    <section class="page-heading connect-heading">
      <div><h1 tabindex="-1">Pair a MIDI pad</h1><p>The browser asks for permission. This app listens for note-on messages. Light output stays off until you enable it.</p></div>
      <div class="compatibility ${midi?.supported ? 'is-good' : 'is-bad'}"><b>${midi?.supported ? 'Web MIDI ready' : 'Web MIDI unavailable'}</b><span>${midi?.supported ? 'Use Chrome, Edge, or another compatible browser.' : 'Use a Chromium-based desktop browser, or play with keys 1–4.'}</span></div>
    </section>
    <section class="pair-sheet" aria-labelledby="pair-title">
      <div class="pair-number">01</div>
      <div><h2 id="pair-title">Allow and choose</h2><p>Connect the controller by USB before pairing. Unsupported devices receive no vendor messages or firmware commands.</p></div>
      <div class="pair-control">
        ${!connected ? `<button class="primary" id="connect-midi" ${midi?.supported ? '' : 'disabled'}>Allow MIDI access</button>` : `
          <label>MIDI input<select id="midi-input">${inputs.length ? inputs.map((port) => `<option value="${port.id}" ${port.id === settings.inputId ? 'selected' : ''}>${escapeHtml([port.manufacturer, port.name].filter(Boolean).join(' · ') || 'Unnamed input')}</option>`).join('') : '<option value="">No input found</option>'}</select></label>
          <button id="refresh-midi">Refresh ports</button>`}
      </div>
    </section>
    <section class="pair-sheet" aria-labelledby="map-title">
      <div class="pair-number">02</div>
      <div><h2 id="map-title">Map four notes</h2><p>Use your pad’s documented note numbers. Defaults are 36–39. Strike each pad to test input.</p></div>
      <div class="note-map">
        ${([0, 1, 2, 3] as Lane[]).map((lane) => `<label class="lane-${lane}"><span>0${lane + 1} ${laneNames[lane]}</span><input class="note-input" data-note-lane="${lane}" type="number" min="0" max="127" value="${settings.inputNotes[lane]}" inputmode="numeric" /></label>`).join('')}
      </div>
    </section>
    <section class="pair-sheet" aria-labelledby="light-title">
      <div class="pair-number">03</div>
      <div><h2 id="light-title">Enable cue lights <span class="optional">Optional</span></h2><p>Output uses note-on and note-off messages on your chosen channel. Leave it off if your controller does not light from notes.</p></div>
      <div class="light-settings">
        <label class="switch-row"><input id="lights-enabled" type="checkbox" ${settings.lightsEnabled ? 'checked' : ''} ${!outputs.length ? 'disabled' : ''}/><span>Send pad lights</span></label>
        <label>MIDI output<select id="midi-output" ${!settings.lightsEnabled ? 'disabled' : ''}>${outputs.length ? outputs.map((port) => `<option value="${port.id}" ${port.id === settings.outputId ? 'selected' : ''}>${escapeHtml([port.manufacturer, port.name].filter(Boolean).join(' · ') || 'Unnamed output')}</option>`).join('') : '<option value="">No output found</option>'}</select></label>
        <label>Channel<input id="midi-channel" type="number" min="1" max="16" value="${settings.midiChannel}" ${!settings.lightsEnabled ? 'disabled' : ''}/></label>
        <button id="test-lights" ${!settings.lightsEnabled || !settings.outputId ? 'disabled' : ''}>Test all four lights</button>
      </div>
    </section>
    <section class="input-test" aria-labelledby="input-test-title">
      <div><h2 id="input-test-title">Strike a mapped pad</h2><p id="input-test-copy">${connected ? 'Waiting for a note-on message…' : 'Pair MIDI above, or test with keys 1–4.'}</p></div>
      <div class="mini-pads">${([0, 1, 2, 3] as Lane[]).map((lane) => `<button class="mini-pad lane-${lane} ${pressedLane === lane ? 'is-pressed' : ''}" data-lane="${lane}" aria-label="Test ${laneNames[lane]} with key ${lane + 1}">${lane + 1}<small>${laneNames[lane]}</small></button>`).join('')}</div>
      <a class="button-like primary" href="${pathFor('practice')}" data-route="${pathFor('practice')}">Go to practice</a>
    </section>`;
}

function bindGlobal(): void {
  document.querySelectorAll<HTMLElement>('[data-route]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      const path = element.dataset.route;
      if (path) void navigate(path, true, true);
    });
  });
  document.querySelector('#reset-demo')?.addEventListener('click', () => void resetDemo());
  document.querySelector('#install-app')?.addEventListener('click', async () => {
    await installPrompt?.prompt();
    installPrompt = null;
    render();
  });
  document.querySelector('#reload-app')?.addEventListener('click', applyUpdate);
}

async function navigate(path: string, manageFocus: boolean, scrollToTop: boolean): Promise<void> {
  const previousScope = storageScope();
  stopPractice();
  history.pushState(null, '', path);
  readRoute();
  if (previousScope !== storageScope()) await loadWorkspace();
  render({ manageFocus, announceRoute: true });
  if (scrollToTop) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

async function restoreRoute(): Promise<void> {
  const previousScope = storageScope();
  stopPractice();
  readRoute();
  if (previousScope !== storageScope()) await loadWorkspace();
  render({ manageFocus: true, announceRoute: true });
}

function applyUpdate(): void {
  const waiting = serviceWorkerRegistration?.waiting;
  if (!waiting) {
    updateReady = false;
    announce('The update is no longer waiting. Check again after the next refresh.');
    render();
    return;
  }
  const button = document.querySelector<HTMLButtonElement>('#reload-app');
  if (button) { button.disabled = true; button.textContent = 'Updating…'; }
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

function bindPadButtons(): void {
  document.querySelectorAll<HTMLElement>('[data-lane]').forEach((button) => {
    button.addEventListener('click', () => handleHit(Number(button.dataset.lane) as Lane, 100));
  });
}

function bindPractice(): void {
  bindPadButtons();
  document.querySelector('#toggle-play')?.addEventListener('click', () => playing ? stopPractice() : startResponse());
  document.querySelector('#preview-cue')?.addEventListener('click', () => previewing ? stopPreview() : previewCue());
  document.querySelector<HTMLSelectElement>('#routine-select')?.addEventListener('change', (event) => {
    const found = routines.find((routine) => routine.id === (event.target as HTMLSelectElement).value);
    if (found) { current = structuredClone(found); resetScore(); render(); }
  });
}

function startResponse(): void {
  stopPreview(false);
  playing = true;
  hits = 0;
  misses = 0;
  currentStep = -1;
  advanceCue();
}

function advanceCue(): void {
  if (currentStep >= 0 && currentStep < current.steps.length) {
    const old = current.steps[currentStep];
    if (old !== null) midi.light(old, false);
  }
  currentStep += 1;
  while (currentStep < current.steps.length && current.steps[currentStep] === null) currentStep += 1;
  if (currentStep >= current.steps.length) {
    playing = false;
    midi.allOff();
    announce(`Routine complete: ${hits} right and ${misses} wrong.`, 'success');
  } else {
    midi.light(current.steps[currentStep] as Lane, true);
    announce(`Next: lane ${Number(current.steps[currentStep]) + 1}, ${laneNames[current.steps[currentStep] as Lane]}.`);
  }
  render();
}

function stopPractice(): void {
  if (midi) midi.allOff();
  playing = false;
  stopPreview(false);
}

function resetScore(): void {
  stopPractice();
  currentStep = -1;
  hits = 0;
  misses = 0;
}

function handleHit(lane: Lane, velocity: number): void {
  pressedLane = lane;
  document.querySelectorAll(`[data-lane="${lane}"]`).forEach((pad) => pad.classList.add('is-pressed'));
  window.setTimeout(() => {
    pressedLane = null;
    document.querySelectorAll(`[data-lane="${lane}"]`).forEach((pad) => pad.classList.remove('is-pressed'));
  }, 140);
  if (view === 'connect') {
    const copy = document.querySelector('#input-test-copy');
    if (copy) copy.textContent = `Received lane ${lane + 1} · ${laneNames[lane]} · velocity ${velocity}`;
    announce(`Input test passed on lane ${lane + 1}.`, 'success');
  }
  if (!playing) return;
  if (current.steps[currentStep] === lane) {
    hits += 1;
    advanceCue();
  } else {
    misses += 1;
    announce(`That was lane ${lane + 1}. Try lane ${Number(current.steps[currentStep]) + 1}.`, 'error');
    const miss = document.querySelector('.stage');
    miss?.classList.add('has-miss');
    window.setTimeout(() => miss?.classList.remove('has-miss'), 180);
    const score = document.querySelectorAll('.score-strip strong')[2];
    if (score) score.textContent = String(misses);
  }
}

function previewCue(): void {
  stopPreview(false);
  previewing = true;
  currentStep = -1;
  render();
  const interval = 60_000 / current.bpm;
  current.steps.forEach((step, index) => {
    previewTimers.push(window.setTimeout(() => {
      if (currentStep >= 0) {
        const prior = current.steps[currentStep];
        if (prior !== null) midi.light(prior, false);
      }
      currentStep = index;
      if (step !== null) {
        midi.light(step, true);
        pressedLane = step;
      } else pressedLane = null;
      render();
    }, index * interval));
  });
  previewTimers.push(window.setTimeout(() => {
    stopPreview(false);
    currentStep = -1;
    render();
    announce('Preview complete.', 'success');
  }, current.steps.length * interval));
}

function stopPreview(shouldRender = true): void {
  previewTimers.splice(0).forEach(clearTimeout);
  if (midi) midi.allOff();
  previewing = false;
  pressedLane = null;
  if (shouldRender) render();
}

function bindArrange(): void {
  document.querySelectorAll<HTMLButtonElement>('.step-cell').forEach((button) => button.addEventListener('click', () => {
    const step = Number(button.dataset.step);
    const lane = Number(button.dataset.lane) as Lane;
    current.steps[step] = current.steps[step] === lane ? null : lane;
    render();
    document.querySelector<HTMLButtonElement>(`.step-cell[data-step="${step}"][data-lane="${lane}"]`)?.focus();
  }));
  document.querySelector<HTMLInputElement>('#routine-name')?.addEventListener('input', (event) => { current.name = (event.target as HTMLInputElement).value; });
  document.querySelector<HTMLInputElement>('#routine-bpm')?.addEventListener('input', (event) => { current.bpm = Number((event.target as HTMLInputElement).value); });
  document.querySelector('#add-step')?.addEventListener('click', () => { if (current.steps.length < 64) current.steps.push(null); render(); });
  document.querySelector('#remove-step')?.addEventListener('click', () => { if (current.steps.length > 1) current.steps.pop(); render(); });
  document.querySelector('#new-routine')?.addEventListener('click', () => {
    current = { id: crypto.randomUUID(), name: 'Untitled routine', steps: Array(8).fill(null), bpm: 92, updatedAt: Date.now() };
    announce('Blank routine ready. It is not saved yet.');
    render();
  });
  document.querySelector('#save-routine')?.addEventListener('click', () => void saveCurrent());
  document.querySelector('#export-routine')?.addEventListener('click', exportCurrent);
  document.querySelector<HTMLInputElement>('#import-routine')?.addEventListener('change', (event) => void importFile(event));
  document.querySelector('#delete-routine')?.addEventListener('click', () => void removeCurrent());
}

async function saveCurrent(): Promise<void> {
  try {
    current = normalizeRoutine(current);
    const existing = routines.find((routine) => routine.id === current.id);
    if (existing) Object.assign(existing, structuredClone(current));
    else routines.unshift(structuredClone(current));
    await saveRoutine(current, storageScope());
    announce(`Saved “${current.name}” in browser storage.`, 'success');
    render();
  } catch (error) {
    announce(error instanceof Error ? error.message : 'Could not save this routine.', 'error');
    document.querySelector<HTMLInputElement>('#routine-name')?.focus();
  }
}

function exportCurrent(): void {
  try {
    current = normalizeRoutine(current);
    const blob = new Blob([routineFile(current)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${current.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'routine'}.padlight.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    announce('Routine exported as JSON.', 'success');
  } catch (error) {
    announce(error instanceof Error ? error.message : 'Could not export this routine.', 'error');
  }
}

async function importFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    if (file.size > 100_000) throw new Error('That file is too large. Choose a routine under 100 KB.');
    const contents = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(contents);
    } catch {
      throw new Error('That file is not valid Pad Light routine JSON. Choose a valid exported routine file and try again.');
    }
    const imported = normalizeImportedRoutine(parsed);
    imported.id = crypto.randomUUID();
    current = imported;
    await saveRoutine(current, storageScope());
    routines.unshift(structuredClone(current));
    announce(`Imported “${current.name}”.`, 'success');
    render();
  } catch (error) {
    announce(error instanceof Error ? error.message : 'That JSON file could not be read.', 'error');
  }
  (event.target as HTMLInputElement).value = '';
}

async function removeCurrent(): Promise<void> {
  if (routines.length <= 1) return;
  if (!confirm(`Delete “${current.name}” from browser storage? This cannot be undone.`)) return;
  await deleteRoutine(current.id, storageScope());
  routines = routines.filter((routine) => routine.id !== current.id);
  current = structuredClone(routines[0]);
  announce('Routine deleted.', 'success');
  render();
}

function bindConnect(): void {
  bindPadButtons();
  document.querySelector('#connect-midi')?.addEventListener('click', () => void connectMidi());
  document.querySelector('#refresh-midi')?.addEventListener('click', () => { midi.bindInput(); render(); announce('MIDI port list refreshed.'); });
  document.querySelector<HTMLSelectElement>('#midi-input')?.addEventListener('change', async (event) => {
    settings.inputId = (event.target as HTMLSelectElement).value;
    midi.settings = settings;
    midi.bindInput();
    await saveSettings(settings, storageScope());
    render();
  });
  document.querySelectorAll<HTMLInputElement>('.note-input').forEach((input) => input.addEventListener('change', async () => {
    const lane = Number(input.dataset.noteLane) as Lane;
    const note = Math.max(0, Math.min(127, Number(input.value)));
    settings.inputNotes[lane] = note;
    settings.outputNotes[lane] = note;
    midi.settings = settings;
    await saveSettings(settings, storageScope());
    announce(`Lane ${lane + 1} mapped to MIDI note ${note}.`, 'success');
  }));
  document.querySelector<HTMLInputElement>('#lights-enabled')?.addEventListener('change', async (event) => {
    settings.lightsEnabled = (event.target as HTMLInputElement).checked;
    if (!settings.outputId) settings.outputId = midi.outputs()[0]?.id ?? '';
    midi.settings = settings;
    await saveSettings(settings, storageScope());
    render();
    announce(settings.lightsEnabled ? 'Note light output enabled.' : 'Light output is off.', 'success');
  });
  document.querySelector<HTMLSelectElement>('#midi-output')?.addEventListener('change', async (event) => {
    settings.outputId = (event.target as HTMLSelectElement).value;
    midi.settings = settings;
    await saveSettings(settings, storageScope());
    render();
  });
  document.querySelector<HTMLInputElement>('#midi-channel')?.addEventListener('change', async (event) => {
    settings.midiChannel = Math.max(1, Math.min(16, Number((event.target as HTMLInputElement).value)));
    midi.settings = settings;
    await saveSettings(settings, storageScope());
  });
  document.querySelector('#test-lights')?.addEventListener('click', testLights);
}

async function connectMidi(): Promise<void> {
  const button = document.querySelector<HTMLButtonElement>('#connect-midi');
  if (button) { button.disabled = true; button.textContent = 'Waiting for browser…'; }
  try {
    await midi.connect();
    connected = true;
    if (!settings.inputId) settings.inputId = midi.inputs()[0]?.id ?? '';
    if (!settings.outputId) settings.outputId = midi.outputs()[0]?.id ?? '';
    midi.settings = settings;
    midi.bindInput();
    await saveSettings(settings, storageScope());
    announce(midi.inputs().length ? 'MIDI paired. Strike a mapped pad to test it.' : 'MIDI access allowed, but no input was found. Connect one and refresh.', midi.inputs().length ? 'success' : 'error');
    render();
  } catch (error) {
    connected = false;
    announce(error instanceof Error ? `${error.message} Check the browser permission and try again.` : 'MIDI permission was not granted.', 'error');
    render();
  }
}

function testLights(): void {
  ([0, 1, 2, 3] as Lane[]).forEach((lane, index) => {
    window.setTimeout(() => midi.light(lane, true), index * 220);
    window.setTimeout(() => midi.light(lane, false), index * 220 + 180);
  });
  announce('Sent one note-on and note-off to each mapped output.', 'success');
}

function keyboardHandler(event: KeyboardEvent): void {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target as HTMLElement;
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
  const lane = laneKeys.indexOf(event.key);
  if (lane >= 0) {
    event.preventDefault();
    handleHit(lane as Lane, 100);
  }
  if (event.code === 'Space' && view === 'practice') {
    event.preventDefault();
    playing ? stopPractice() : startResponse();
    render();
  }
}

function configureMidi(): void {
  connected = false;
  midi = new MidiController(settings);
  midi.onHit = handleHit;
  midi.onUnknown = (note) => announce(`Received unmapped MIDI note ${note}. Add it in the note map.`, 'error');
  midi.onPortsChanged = () => {
    announce('A MIDI port changed. Review your pairing.');
    if (view === 'connect') render();
  };
}

async function loadWorkspace(): Promise<void> {
  const scope = storageScope();
  settings = { ...defaultSettings, ...(await getSettings(scope)) };
  routines = await listRoutines(scope);
  if (!routines.length) {
    routines = isDemo ? sampleRoutines() : [starterRoutine()];
    await Promise.all(routines.map((routine) => saveRoutine(routine, scope)));
  }
  current = structuredClone(routines[0]);
  configureMidi();
  message = isDemo ? 'Sample routine ready. Your real routines are unchanged.' : midi.supported ? 'Ready. Pair MIDI or play with keys 1–4.' : 'Web MIDI is unavailable here; keyboard practice still works.';
  messageTone = 'neutral';
}

async function resetDemo(): Promise<void> {
  if (!isDemo) return;
  try {
    stopPractice();
    await clearStorage('demo');
    settings = structuredClone(defaultSettings);
    routines = sampleRoutines();
    await Promise.all(routines.map((routine) => saveRoutine(routine, 'demo')));
    current = structuredClone(routines[0]);
    configureMidi();
    announce('Demo reset. The sample routine is ready again.', 'success');
    render();
  } catch {
    announce('The demo could not reset. Reload this page and try again.', 'error');
  }
}

async function init(): Promise<void> {
  readRoute();
  try {
    await loadWorkspace();
  } catch {
    const starter = isDemo ? sampleRoutines()[0] : starterRoutine();
    routines = [starter];
    current = starter;
    configureMidi();
    message = 'Browser storage could not open. Practice works, but routines may not persist.';
    messageTone = 'error';
  }
  busy = false;
  render();
}

window.addEventListener('keydown', keyboardHandler);
window.addEventListener('popstate', () => { void restoreRoute(); });
window.addEventListener('online', () => { isOffline = false; if (!busy) { render(); announce('Back online. Your routines stayed in browser storage.', 'success'); } });
window.addEventListener('offline', () => { isOffline = true; if (!busy) { render(); announce('You are offline. Practice and saved routines still work.'); } });
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event as BeforeInstallPromptEvent; if (!busy) render(); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').then((registration) => {
    serviceWorkerRegistration = registration;
    if (registration.waiting) { updateReady = true; if (!busy) render(); }
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) { updateReady = true; if (!busy) render(); }
      });
    });
  }).catch(() => announce('Offline installation is unavailable, but the current page still works.', 'error')));
}

void init();
