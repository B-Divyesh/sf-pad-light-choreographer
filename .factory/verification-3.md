# Independent release verification 3 — PASS

- **Candidate:** `cbd606ebc14ba71d32e0b8512e650fb3d77508b5`
- **Public URL:** <https://pad-light-choreographer.sociobot.in/>
- **Verified:** 2026-08-28 UTC, from a clean checkout at the candidate.
- **Decision:** **PASS — the deployed PWA matches this candidate and meets the researched smallest-useful-product contract.**

The previous release blockers are resolved in fresh evidence. In particular, a brand-new browser context received a shell cache containing both emitted hashed app assets and could reload, render, and begin a response routine while offline without first doing a warmed online reload.

## Required local gates

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 60 packages audited. |
| `npm audit --omit=dev` | Passed; 0 production vulnerabilities. |
| `npm test` | Passed: 4 Vitest tests and 17 Playwright tests; 1 expected desktop skip for the mobile-only 390px assertion. |
| Type check / production build | `npm run build` passed (`tsc --noEmit && vite build`); `dist/` produced. No separate lint script is defined. |
| Mobile Lighthouse, local exact `dist/` | Performance **95**, Accessibility **100**, Best Practices **100**; FCP 1.0 s, LCP 1.7 s, TBT 260 ms, CLS 0. |

The generated entry JS is 26,641 bytes (9,056 gzip); CSS is 17,166 bytes (4,617 gzip); the largest shipped hero WebP is 186,066 bytes. All are within the static-PWA budgets (200 KB JS, 50 KB CSS, 300 KB mobile hero).

## Independent product exercise

- Desktop keyboard-only practice completed all eight starter cues with keys `1`–`4`: **8 right, 0 wrong**. Normal loads produced no console errors or page errors.
- Arrange flow saved a named routine at 240 BPM, exported `boundary.padlight.json`, and persisted it. The 1-step Remove and 64-step Add bounds disabled their respective controls correctly.
- Invalid/recovery flows gave actionable messages for an empty name, 39 BPM, malformed JSON, a lane outside 0–3, and a JSON file over 100 KB. A valid 40-BPM three-step JSON routine imported successfully.
- The conservative MIDI path was covered by the repository's standards-shaped MIDI mock: non-SysEx access plus opt-in note-on/note-off output. Independently, a denied browser permission left pairing recoverable and announced “Permission denied Check the browser permission and try again.”
- At 390 × 664 CSS px, the MIDI CTA measured 354 × 46.8 px, its centre hit-tested to the button, and no horizontal overflow occurred. Desktop and 390px automated Playwright coverage passed.
- Keyboard focus begins at the skip link with a visible `rgb(0, 95, 204)` 3px outline and 4px offset. With reduced motion, pad transition duration measured `0.01ms`.
- Independent axe-core scans found **0 serious or critical** findings; the repository suite also scans Play, Arrange, Pair MIDI, Privacy, and Terms across desktop/mobile.

## PWA, privacy, and deployment evidence

- Fresh local and live Chromium contexts installed `plc-v1.1.0-shell`, which contains `/assets/index-tX2cJ1Yy.css` and `/assets/index-1KkRPhgQ.js`. On the first offline reload, the app rendered its offline strip and recorded the first response hit without console/page errors.
- Update wiring sends `{ type: 'SKIP_WAITING' }` to `registration.waiting` and reloads on `controllerchange`; this is covered by the passing Playwright regression. The worker handles that message with `skipWaiting()` and claims clients on activation.
- Browser network capture observed only the application origin for both local and live first loads. Source and runtime checks found no analytics, CDNs, third-party fonts/scripts, or outbound data requests. Routines/settings use IndexedDB; MIDI access explicitly requests `{ sysex: false }`; lighting output remains opt-in.
- Live HTTPS returned 200 for `/`, `/sw.js`, the manifest, assets, `/privacy/`, and `/terms/`; HTTP redirects to HTTPS. The live app shell has CSP, `Permissions-Policy: … midi=(self)`, HSTS, strict referrer policy, and `nosniff`. Hashed JS/CSS are `public, max-age=31536000, immutable`; the worker is `no-cache, no-store, must-revalidate`.

Fresh local-to-live SHA-256 matches:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `6ce829d43999c0e55c6568331915495abedde143067ac00aadd854be8d8f5306` |
| `sw.js` | `372f375bc9381574c8fe9baec4b16975f3f989b2daf4e588e75f180070a196d0` |
| `assets/index-1KkRPhgQ.js` | `c1b93bf3d0278114db5096d7c537299c29037300bc79ab934d5491d637991e3e` |
| `assets/index-tX2cJ1Yy.css` | `9d22e35996ff423a4df2de4465d36914f9c17edfb688b05d62fcac8379a10e32` |

## Defects by severity

- **P0:** None observed.
- **P1:** None observed.
- **P2:** None observed.
- **P3:** None observed.

## Known verification boundary

No physical MIDI controller was available in this container. The documented, hardware-safe Web MIDI protocol was exercised with standards-shaped browser mocks; proprietary controller LED protocols remain deliberately outside the product scope.
