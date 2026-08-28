# Independent release verification — FAIL

- Candidate: `a9654421af516fc6df087e61485f6655f7f2fc83`
- Public URL: `https://pad-light-choreographer.sociobot.in/`
- Verified: 2026-08-28 UTC from a clean clone detached at the candidate.
- Decision: **FAIL — do not release this PWA until the P0 offline defect is fixed and retested.**

The earlier TLS/404 deployment failure is resolved: the public site returned HTTPS 200 and its downloaded `index.html`, JS, CSS, and `sw.js` SHA-256 values exactly matched the freshly built candidate. The remaining failure is in the candidate itself.

## Release blockers

### P0 — a first offline reload after installation boots a blank application

Reproduced against the exact `dist/` from `npm run build`, served with `vite preview`, in a brand-new Chromium browser context:

1. Load `/`, wait for `navigator.serviceWorker.ready` and a controlled page.
2. Do **not** perform a second online reload; set the context offline and reload.
3. Navigation returns HTTP 200 from `plc-v1.0.0-shell`, but `#app` is empty, the offline strip is absent, and Chromium records two `Failed to load resource: net::ERR_FAILED` errors.

The cache contains only `plc-v1.0.0-shell`. `public/sw.js` precaches HTML, icons, artwork and legal pages but omits the generated `/assets/index-*.js` and `/assets/index-*.css`; the cached document therefore cannot start when those assets are not already present in the ordinary browser cache. The repository's offline test performs an extra online reload before going offline, which runtime-caches the generated assets and masks this cold-install path. This violates the offline PWA acceptance contract.

### P1 — the advertised service-worker update action targets the old worker

The update toast posts `SKIP_WAITING` to `navigator.serviceWorker.controller` and immediately reloads (`src/main.ts:257–260`). When an update is waiting, that controller is the **old active worker**, not `registration.waiting`; it cannot promote the waiting worker. The new worker does not call `skipWaiting()` during install either. Consequently the visible “Update app” action cannot reliably activate a waiting update. The message handler and `clients.claim()` exist, but the message must be sent to `registration.waiting` (or the installing worker must call `skipWaiting`).

## Other defects

### P2 — 390 × 664 mobile status bar obscures the MIDI CTA

At the standard iPhone-13-sized 390 × 664 CSS viewport, the hero **Pair a MIDI pad** button is `y=603.97..650.77`; the fixed live-status element is `y=617.86..664`. At the button centre, `elementFromPoint` returns the live-status `DIV`, not the button. Only about 14 px of the button remains unobscured, so it no longer has a 44 px touch target. At 390 × 844 it is unobscured.

### P2 — measured mobile Lighthouse performance is below the required threshold

Lighthouse 12.8.2 against the exact production preview with the installed Chromium reported Performance **83**, Accessibility **100**, Best Practices **100**; FCP 1.0 s, LCP 1.4 s, TBT 710 ms, CLS 0, transfer 18 KiB. The stated acceptance target is at least 90 performance. The small transfer size meets bundle budgets, but the lab score and TBT do not.

### P3 — invalid JSON exposes a raw parser exception

Importing malformed JSON reports `Expected property name or '}' in JSON at position 1 ...`, rather than an actionable instruction to choose a valid Pad Light routine JSON file. The file input is reset and recovery is possible.

### P3 — production static-asset caching is not long-lived immutable caching

The deployed hashed JS and CSS are served with `Cache-Control: public, must-revalidate, max-age=30`, rather than a long-lived immutable policy. HSTS, `nosniff`, and a strict referrer policy are present; neither `Content-Security-Policy` nor `Permissions-Policy` is returned.

## Checks that passed

- Clean install: `npm ci` passed; `npm audit --omit=dev` found 0 production vulnerabilities.
- Automated suite: `npm test` passed: 3 Vitest tests plus all 12 Playwright desktop/mobile tests. `npm run build` passed (`tsc --noEmit && vite build`). No separate lint script is defined.
- Output budgets: initial JS 26,266 bytes (8,970 gzip), CSS 17,102 bytes (4,620 gzip); largest hero WebP 186,066 bytes. These are within the stated static-product byte budgets.
- End-to-end local checks: correct keyboard response completed all eight starter steps; a wrong lane incremented Miss and retained the target; name-empty and 39-BPM saves reported validation errors; 240 BPM saved; 64-step Add and 1-step Remove bounds disabled correctly; malformed import recovered; MIDI permission denial reported a recovery message. Existing automated coverage also verified conservative non-SysEx MIDI note-on/off output with a standards-shaped mock.
- Desktop and 390 × 844 mobile: Play, Arrange and Pair have one `h1`, no horizontal overflow, controls at least 44 px, no console/page errors, and reduced-motion transition duration of 0.01 ms. Keyboard focus begins at the skip link with a solid 3 px focus outline.
- Independent axe-core Playwright scans of `/`, `/#arrange`, `/#connect`, `/privacy/`, and `/terms/` found zero serious or critical violations.
- Privacy/network review: local and deployed first loads made requests only to their own origin. No analytics, third-party fonts/scripts, or CDN requests were observed. Routines/settings use IndexedDB; MIDI requests `{ sysex: false }`; output lights are opt-in documented note-on/note-off. Privacy and terms routes return 200.
- Deployment: HTTPS is valid; `/`, `/sw.js`, `/privacy/`, `/terms/`, manifest, hashed JS and CSS all returned 200. Candidate/live SHA-256 matches: HTML `c385a048…09931`, JS `9075fc0c…cef6`, CSS `29f6419a…4e1`, service worker `047f273e…723`.

## Environment and limits

- Clean checkout: `/tmp/pad-light-qa.Vy1vXQ`, detached at the candidate; local production preview `http://127.0.0.1:4174/`.
- Browser: installed Playwright Chromium 1.58.2. No physical controller was available; the standards-shaped mock verifies the supported documented MIDI path, not vendor-specific LEDs.
- No product source, configuration, deployment, or infrastructure was changed. This report and the handoff are the only repository changes.

## Required remediation before retest

1. Add the emitted JS and CSS to a versioned precache (and advance the cache version), then retest the fresh-context offline reload without an intervening online reload.
2. Deliver `SKIP_WAITING` to `registration.waiting` and reload only after `controllerchange`, or invoke it on the installing worker.
3. Keep the fixed status out of the mobile CTA area at 390 × 664 and improve malformed-import copy.
4. Investigate the 710 ms lab TBT/83 performance score and configure immutable caching for hashed assets plus appropriate browser security policies.
