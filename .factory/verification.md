# Independent release verification — FAIL

- Candidate: `a9654421af516fc6df087e61485f6655f7f2fc83` (`main`), verified from a clean, otherwise unmodified checkout.
- Requested production URL: `https://pad-light-choreographer.sociobot.in/`
- Date: 2026-08-27 UTC
- Decision: **FAIL — do not release this candidate as the deployed PWA.** The local build is healthy, but the public URL is not serving it and the first offline reload is broken.

## Release blockers

### P0 — public deployment is unavailable and cannot be matched to the candidate

Fresh requests to the requested URL fail TLS validation: the server presents a certificate whose subject is `*.msha-slice-7-eus2-1-ase.p.azurewebsites.net`, which does not cover `pad-light-choreographer.sociobot.in`. With certificate verification bypassed strictly to inspect the response, `GET /` returned `HTTP/1.1 404 Site Not Found` (2667-byte HTML) rather than the app. Plain HTTP also returned the same 404, rather than redirecting to HTTPS. The 404 response exposed only `Content-Type`, `Content-Length`, `Connection`, and `Date`; it did not expose an app cache policy or security response policy to verify.

Consequently the live site is not usable, its production headers/caching cannot be accepted, and it cannot be confirmed to match this candidate. No deployment-only success claim is supported by fresh evidence.

### P1 — first offline reload after service-worker install renders a blank app

Reproduction against the exact `dist/` build served by `vite preview`:

1. Open `/` in a new Chromium context and wait for `navigator.serviceWorker.ready`; the worker has claimed the client.
2. Before doing an additional online reload, put the context offline and reload.
3. The navigation returns cached `index.html` (`200`), but `#app` is empty and Chromium reports two `Failed to load resource: net::ERR_FAILED` console errors.

The worker's initial `plc-v1.0.0-shell` cache contains HTML, manifest, icons, artwork, legal pages and offline page, but not the built `/assets/index-*.js` or `/assets/index-*.css`. Thus the cached document cannot boot offline on this first reload. The repository’s existing offline test reloads once while online before setting offline, which runtime-caches the assets and masks this fresh-install path. This violates the PWA requirement to precache the app shell and to support offline rehearsal.

## Other defects

### P2 — 390px iPhone viewport partially hides the hero MIDI-pair action

At the installed-browser-sized iPhone 13 emulation (390 × 664 CSS px), the sticky live-status bar occupies y=617.86–664 while the secondary **Pair a MIDI pad** hero button occupies y=603.97–650.77. The status element (z-index 20) is the hit target at the button centre, obscuring 33px of its 46.8px target. Playwright can still activate an exposed strip, but the available touch target is no longer the required 44px and the CTA is visibly hidden. At 390 × 844 it is not overlapped.

### P3 — malformed JSON import exposes a raw parser error

Importing `not json` announces `Unexpected token 'o', "not json" is not valid JSON`. Recovery is possible, but the message does not plainly tell the musician to choose a valid Pad Light routine JSON file, contrary to the product’s error-language guideline.

## Local verification that passed

- Clean install: `npm ci` completed; `npm audit --omit=dev` found 0 production vulnerabilities.
- Full suite: `npm test` passed — 3 Vitest tests and 12 Playwright tests (desktop Chromium plus 390px mobile). This includes mocked standard non-SysEx MIDI input/output, normal keyboard practice, persistence, legal pages, axe scans, and the suite’s warmed offline path.
- Exact production build: `npm run build` passed (`tsc --noEmit && vite build`) and emitted `dist/`. The initial JS is 26.27 kB / 8.97 kB gzip; CSS is 17.10 kB / 4.62 kB gzip, below the stated static-product budgets. Largest shipped hero WebP is 186,066 bytes.
- Independent desktop and mobile journeys: starter response advanced with correct `1`–`4` hits; wrong hits incremented Miss and retained the cue; unsupported Web MIDI retained the keyboard path; persistence survived reload; 1-step/64-step editor bounds disabled the right controls; BPM 40 and 240 saved, while 39 and 241 were rejected; malformed, bad-lane, oversize (>100 kB), and valid JSON imports followed the expected recovery/success paths.
- Accessibility/browser smoke: desktop and 390px layouts had no horizontal overflow; one `h1`, `lang="en"`, and a `main` landmark were present; keyboard focus has a visible `3px` `#005FCC` outline with 4px offset; reduced-motion pad transitions collapse to 0.01ms; normal local loads had no console or page errors. The repository’s axe tests reported no serious/critical violations on Play, Arrange, and Pair MIDI in both desktop and mobile projects.
- Privacy: source review and a network capture of the local app found no third-party outbound requests, analytics, fonts, or scripts. State uses IndexedDB; the MIDI request explicitly uses `{ sysex: false }`; outgoing lighting is opt-in note-on/note-off only. `/privacy/` and `/terms/` exist locally.
- PWA update wiring was inspected: the worker implements `SKIP_WAITING` message handling and `clients.claim`, and the app renders an update toast for a waiting/new worker. A real update activation could not be triggered without changing the candidate’s worker bytes, which this verification appropriately did not do. The independently reproduced fresh offline failure above is sufficient to fail PWA acceptance.

## Environment and limits

- Local production preview: `http://127.0.0.1:4173/` from the just-built `dist/`.
- Browser: installed Playwright Chromium 1.58.2. No physical MIDI controller was available; standards-shaped MIDI mocks verified the promised documented message sequence.
- No product source, configuration, or deployment was modified during verification. Only this verification record and the handoff were added.

## Required remediation before retest

1. Configure the production hostname with a certificate covering `pad-light-choreographer.sociobot.in` and deploy the candidate; verify `200` app content over HTTPS, HTTPS redirect/security headers, and cache policy.
2. Include the generated JS and CSS in the versioned service-worker precache (and advance the cache version for a release), then rerun the fresh-context offline reload test.
3. Keep the sticky status from covering actionable controls at all supported 390px mobile viewport heights, and make invalid-import copy actionable.
