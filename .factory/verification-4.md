# Verification 4 — practise four-lane pad-light routines

## Verdict: FAIL

- Finding count: **1** (`0 P0`, `0 P1`, `0 P2`, `1 P3`).
- Untested claim count: **0**.
- Implementation reviewed: `bcb907d88173caac5b554676e748537a7b19cc5e`.
- Documentation baseline: `f6119bd9b628200d99c68f888a1ec3b92a308168`.
- Live URL: <https://pad-light-choreographer.sociobot.in/>.
- Verified: 2026-09-06 UTC.

The later commits between the implementation and documentation SHAs change only `.factory/handoff.md` and `.factory/verification-4.md`. The live HTML, worker, JavaScript, and CSS match the clean implementation build byte for byte.

## What appears before scrolling

Fresh 1440 × 900 desktop and 390 × 664 phone contexts state:

- Job: **Practise four-lane pad-light routines**.
- Audience: MIDI-pad owners who want to practise each cue with their pads.
- First action: **Try it with sample data**.
- Result beside the action: **Loads a full routine you can play now.**

On the phone, the action occupied y=538.8–585.6 and its result occupied y=597.6–619.3. Both were visible before scrolling and the action's centre hit-tested to the link.

## Finding

### P3 — The Privacy contact link is a 19 px-high phone touch target

At a fresh 390 × 844 phone viewport, the inline **project repository** link on `/privacy/` measured **173.39 × 19 px**. The attached accessibility and site-structure contracts require touch targets to be at least 44 × 44 CSS px. The link is usable and has no adjacent link collision, but it does not meet the stated product baseline.

The Privacy header, navigation, footer, skip link, every visible home control, all Terms links, and the designed 404 link measured at least 44 px high. This is the only undersized live target found. Evidence: `/work/.evidence/verification-4/privacy-phone-touch-target.png`.

Required repair: give the contact link a 44 px minimum hit area without weakening the visible inline-link affordance, then rerun the phone target check.

## Clean checkout gates

The clean checkout was `/tmp/pad-light-verify4.iFc7da`, detached at the implementation SHA.

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 60 packages audited. |
| `npm audit --omit=dev` | Passed; 0 production vulnerabilities. |
| `npm run build` | Passed; `dist/` produced. |
| `npm test` | Passed; 5 Vitest checks and 27 Playwright checks passed, with 1 expected mobile-only skip. |

The build emitted 30,211 bytes of entry JavaScript and 19,141 bytes of CSS before gzip. The 480 px hero is 15,524 bytes. These meet the static PWA budgets.

## Declared claims

`.factory/claims.json` contains eight claims. Each ID occurs in exactly one tagged test. I ran every exact `test` command separately from the clean checkout.

| Claim | Exact command | Result |
| --- | --- | --- |
| `midi-discovery` | `npm test -- --grep @claim:midi-discovery` | Passed. |
| `midi-lights` | `npm test -- --grep @claim:midi-lights` | Passed. |
| `keyboard-practice` | `npm test -- --grep @claim:keyboard-practice` | Passed. |
| `editor-bounds` | `npm test -- --grep @claim:editor-bounds` | Passed. |
| `portable-json` | `npm test -- --grep @claim:portable-json` | Passed. |
| `local-persistence` | `npm test -- --grep @claim:local-persistence` | Passed. |
| `offline-reload` | `npm test -- --grep @claim:offline-reload` | Passed. |
| `private-free` | `npm test -- --grep @claim:private-free` | Passed. |

The live landing page, app screens, legal pages, manifest, and README were cross-checked against the manifest. Their public capability statements map to these eight tested claim groups. Untested claim count is zero.

## Live product checks

- The one-click sample opened `/demo` with **Sample: Pocket call and response** and **Sample: Offbeat turnaround** already populated.
- **Demo — sample data, nothing is saved**, **Reset demo**, and **Start for real** remained available across demo routes.
- A real routine named `Verifier real routine` remained intact after a demo-only edit and reset. The demo edit did not appear in real data. The browser showed separate `pad-light-choreographer` and `demo:pad-light-choreographer` IndexedDB databases.
- A wrong practice hit increased Miss and kept Kick as the next cue. Four correct keyboard hits then produced four right hits.
- Arrange rejected 39 BPM, gave actionable malformed-JSON recovery text, and accepted a valid two-step import at the 240 BPM boundary. The claim test also covered 1/64 steps and the 100 KB boundary.
- A live standards-shaped Web MIDI mock received `{ sysex: false }`, discovered its ports, and emitted only the expected channel-2 note-on/note-off sequence after opt-in. No physical controller was available.
- `/arrange` → `/connect` → Back preserved real URLs, distinct titles, heading focus, and the polite route announcement.
- `/`, `/demo`, `/arrange`, `/connect`, `/privacy/`, `/terms/`, `robots.txt`, and `sitemap.xml` returned 200. An unknown address returned the designed page with deliberate HTTP 404 and a working route home.
- Fourteen unique same-origin links returned expected responses. The external project repository returned 200. HTTP redirected to HTTPS.
- A fresh service-worker context cached the generated JS and CSS in `plc-v1.2.0-shell`; its first offline reload rendered `/demo` and accepted the first cue.
- Runtime requests during the full live journey stayed on the product origin. No account fields, analytics request, third-party script, or third-party font appeared.
- CSP, MIDI Permissions-Policy, Referrer-Policy, HSTS, and `nosniff` were present. Hashed assets were served with one-year immutable caching and `sw.js` with no-store.

## Accessibility and performance

- The factory URL smoke check passed: title, `lang`, one `h1`, `<main>`, image alt text, button names, and no unexpected console error.
- Playwright axe scans found zero violations on `/`, `/demo`, `/demo/arrange`, `/demo/connect`, `/privacy/`, and `/terms/`.
- After installing the matching Chrome 145 driver prerequisite, standalone axe CLI 4.10.3 found zero violations on home, demo, Privacy, and Terms.
- Keyboard Tab first reached the skip link. Its focus ring was a 3 px solid blue outline with a 4 px offset.
- Reduced motion changed pad transitions to `0.01ms`, removed animation, and removed the target transform.
- The 390 px home page had no horizontal overflow and all 18 visible links and buttons were at least 44 px in both dimensions.
- Fresh mobile Lighthouse: Performance **100**, Accessibility **100**, Best Practices **100**; FCP 0.9 s, LCP 1.4 s, TBT 30 ms, CLS 0.
- No unexpected console or page errors occurred. Chromium logged the expected failed-resource message only when intentionally loading the HTTP 404 response; that is not a defect.

## Live artifact identity

| Artifact | Clean build and live SHA-256 |
| --- | --- |
| `index.html` | `db51744c7423530fdb487c1fa2ce9a7b88886444c52eb4509c0d82261fe855fe` |
| `sw.js` | `3894c59e15c789daab78b63a87e84330589782efbe732d4eb6dd867688dc2dae` |
| `assets/index-DmjtiZnC.js` | `03d712ae733ae1072b109357ba7035ac632e8d5f145fa783516d6b14c1d699ed` |
| `assets/index-DgY0Kl4_.css` | `6229b2ba3adc83df51e26e7848d07f64d92c1a79149c989cdd9eb0b3d931ea38` |

## Earlier finding disposition

| Earlier finding | Current disposition and fresh evidence |
| --- | --- |
| TLS mismatch, missing deployment, and wrong live response | Resolved. HTTP redirects to valid HTTPS, home returns 200, and four runtime hashes match the candidate. |
| First cold offline reload showed a blank app | Resolved. A fresh live context cached both hashed assets, reloaded offline, and accepted cue 1. |
| Update action sent `SKIP_WAITING` to the old worker | Resolved. The passing full suite checks the waiting-worker target and `controllerchange` path. |
| 390 × 664 status covered the MIDI/sample action | Resolved. The sample action measured 354 × 46.8 px and its centre hit-tested correctly. |
| Mobile Lighthouse Performance was 83 | Resolved. Fresh Lighthouse measured 100 Performance and 30 ms TBT. |
| Malformed JSON exposed the parser exception | Resolved. Live copy asks for a valid exported Pad Light routine file and recovery succeeded. |
| Missing immutable caching and security response policy | Resolved. Live response headers contain the required cache and security policies. |
| Missing one-click demo and isolated storage | Resolved. Two samples, persistent label, reset, exit, and two database namespaces were exercised live. |
| Missing claims manifest and tagged tests | Resolved. Eight manifest entries have one tag each and all eight commands passed separately. |
| Metaphorical first screen and missing copy audit | Resolved. Job, audience, first action, result, and facts use plain words; the audit is present. |
| Hash navigation lacked route titles, focus, and announcements | Resolved. Live address-bar, Back, title, heading focus, and live-region checks passed. |
| Missing metadata, discovery, page structure, legal structure, and designed 404 | Resolved. Metadata, routes, discovery files, legal pages, link crawl, and deliberate 404 passed. |
| Undersized phone and legal targets; legal pages lacked skip links | **Partly resolved.** Skip links and all formerly cited header/footer targets pass, but the new Privacy repository link is only 19 px high. This is the remaining P3 finding. |

## Scope boundary and evidence

This is a static PWA with no backend, tenant, payment, health, restart, or 429 surface. Backend-only checks do not apply. Import/export is the useful portability step implied by the brief; an AI feature would not improve this hardware-first practice job.

Evidence is under `/work/.evidence/verification-4/`, including first-screen screenshots, the Privacy target screenshot, live browser JSON, axe CLI results, Lighthouse JSON, URL smoke output, and downloaded live artifacts.
