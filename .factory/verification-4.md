# Repair verification 4 — PASS

- Implementation SHA: bcb907d88173caac5b554676e748537a7b19cc5e
- Handoff documentation SHA: ca126662d07abe32cd07cf372a1dd4cd4510d668
- Live URL: https://pad-light-choreographer.sociobot.in/
- Verified: 2026-09-06 UTC
- Decision: PASS

The implementation and its later documentation commits are deliberately recorded separately. The live static artifact is the implementation build from bcb907d; this report is documentation only.

## Clean checkout

The clean clone was /tmp/pad-light-clean-hrqq8g at implementation SHA bcb907d88173caac5b554676e748537a7b19cc5e.

| Command | Result |
| --- | --- |
| npm ci | Passed; 60 packages audited. |
| npm audit --omit=dev | Passed; 0 production vulnerabilities. |
| npm test | Passed; 5 unit checks and 27 browser checks, with 1 expected mobile-only skip. |
| npm run build | Passed; dist produced. |
| Eight exact commands in .factory/claims.json | All passed from the clean clone. |

The eight claim checks cover non-SysEx MIDI discovery, opt-in note messages, keyboard practice, routine boundaries, JSON portability, browser persistence, first-visit offline reload, and private free-flow requests.

## Live identity and routes

Live SHA-256 values exactly match the built implementation:

| Artifact | SHA-256 |
| --- | --- |
| index.html | db51744c7423530fdb487c1fa2ce9a7b88886444c52eb4509c0d82261fe855fe |
| sw.js | 3894c59e15c789daab78b63a87e84330589782efbe732d4eb6dd867688dc2dae |
| assets/index-DmjtiZnC.js | 03d712ae733ae1072b109357ba7035ac632e8d5f145fa783516d6b14c1d699ed |
| assets/index-DgY0Kl4_.css | 6229b2ba3adc83df51e26e7848d07f64d92c1a79149c989cdd9eb0b3d931ea38 |

The live host returned 200 for /demo, /arrange, /connect, /privacy/, /terms/, /robots.txt, and /sitemap.xml. An unknown path returned the styled page with HTTP 404, which is the expected response.

The factory URL check passed live: title, language, one h1, main, image alt text, button names, and console smoke check all passed. Live headers include CSP, MIDI Permissions-Policy, Referrer-Policy, nosniff, and HSTS.

## Live journeys

- Fresh desktop and iPhone-13 contexts showed the headline, MIDI-pad audience sentence, Try it with sample data action, and its result before scrolling. Neither logged a console error.
- In a fresh live context, the sample action opened /demo with demo-pocket-call-response and the persistent Demo — sample data, nothing is saved label. Saving a demo edit, resetting, and leaving for real restored Sample: Pocket call and response and did not expose the demo edit in real storage.
- In a fresh live context, the service worker controlled /demo. With the context offline, reload rendered the demo and the first response hit incremented to 1 without console errors.
- A live Playwright axe scan of /demo found zero violations, including zero serious and critical violations.

## Quality evidence

- Local Lighthouse 13 mobile demo: Performance 100, Accessibility 100, Best Practices 100. FCP 1.2 s, LCP 1.5 s, TBT 0 ms, CLS 0.
- Entry JavaScript is 30,211 bytes and CSS is 19,141 bytes before gzip. The 480 px hero is 15,524 bytes.
- The standalone axe CLI could not start its Selenium Chrome in this container. The repository and live checks use the supported Playwright axe integration instead.

## Finding disposition

All six review-1 findings are resolved: isolated demo, claim manifest and tests, plain first screen and copy audit, browser routing/focus/titles, discovery/metadata/404/skeleton, and phone/legal touch targets. Earlier release findings remain covered by explicit regression tests for cold offline boot, update activation, mobile obstruction, import recovery, and response policy.

No physical controller was available. The supported documented Web MIDI behavior was tested with a standards-shaped browser mock; proprietary controller protocols remain out of scope. This static product has no backend, billing, tenant, health, persistence-restart, or 429 surface.
