# Review: practise pad-light cue routines

## Verdict: FAIL

Reviewed on 2026-09-05 UTC.

- Findings: **6** (`0 P0`, `2 P1`, `4 P2`, `0 P3`).
- Untested public claim groups: **8**.
- Implementation reviewed: `de0a90a69c3e2cb9a68bdac5274c059c8fa1fe78`.
- Documentation reviewed: `f05fc23b09beebbc912dd0e5ee64379bf8281685`.
- Live URL: <https://pad-light-choreographer.sociobot.in/>.

The live HTML, service worker, JavaScript, and CSS match the clean build byte for byte. The product's main practice flow works. It cannot pass this review because the required demo and claim system are absent, and the public site misses required copy, routing, site, and touch-accessibility behavior.

## What appears before scrolling

Fresh desktop and 390 × 664 phone contexts showed the same content.

- Job stated by the supporting sentence: build a cue, light the next pad, and answer on hardware.
- Audience stated on screen: none. A visitor must infer that it is for a four-lane MIDI-pad owner.
- First action: **Start first routine**. On the phone it was fully visible at y=591–638 before scrolling.
- Headline: **Let the pads call the beat.** This is not a plain statement of the job.

## Findings

### P1 — The required sample demo and storage sandbox do not exist

There is no **Try it with sample data** action on the first screen. `/demo` returns the ordinary app. It has no persistent **Demo — sample data, nothing is saved** label, **Reset demo**, or **Start for real** action. `.factory/demo.md` is also absent.

The missing separation affects real browser data. In a fresh context I saved `Review isolation marker` on the ordinary route, then opened `/demo`. The demo route displayed that routine. It therefore reads the normal `pad-light-choreographer` IndexedDB namespace instead of an isolated demo namespace. There was no reset action to test. The review context was disposable and did not touch another user's data.

Required repair: provide a one-click sample, a direct demo URL, realistic populated output, the persistent label and controls, and a separate storage namespace. Document it in `.factory/demo.md` and add clean-context coverage proving reset and isolation.

### P1 — Public claims have no claim manifest or tagged tests

`.factory/claims.json` does not exist. No test has an `@claim:<id>` tag. There are therefore no declared claim commands to run, and public claims cannot be traced to one sandbox test each. Existing unit and browser tests are useful incidental coverage but do not meet the claim contract.

Eight public claim groups remain untested under that contract:

1. Non-SysEx Web MIDI access discovers inputs and outputs.
2. Pad lights use only opt-in note-on and note-off messages on the selected channel.
3. Keys 1–4 and Space provide keyboard parity for response practice.
4. Routine editing enforces 1–64 steps and 40–240 BPM.
5. Import and export use validated, versioned JSON with a 100 KB import limit.
6. Routines and settings persist in IndexedDB.
7. The installed PWA can practise, edit, and save offline after the first visit.
8. The free product has no account, backend, analytics, tracking, third-party fonts, or outbound MIDI-event transfer.

Required repair: add each public claim to `.factory/claims.json`, give it exactly one tagged observable test using the demo entry point, and run every listed command from a clean checkout.

### P2 — The first screen and public copy do not meet the plain-words contract

The headline is metaphorical and does not name the job. The supporting sentence does not name the audience. The required sample action and adjacent explanation are absent. Privacy, offline use, and price are not presented as three short facts on the first screen. The eyebrow and figure caption use decorative wording that does not help the visitor act. `.factory/copy-audit.md` is absent.

Required repair: use a job title such as **Practise four-lane pad-light routines**, name MIDI-pad owners in the next sentence, explain the result beside the first action, show the three facts, remove decorative copy, and add the required sentence audit.

### P2 — App navigation does not preserve history, focus, or route titles

Play, Arrange, and Pair MIDI are hash states rather than real routes. They call `history.replaceState`, so moving from Arrange to Pair MIDI creates no history entry. Pressing Back left the app instead of restoring Arrange. Arrange and Pair MIDI both retained `Pad Light Choreographer — cue your next beat` rather than setting route-specific titles.

After activating Arrange or Pair MIDI, focus fell to `<body>`. The attempted focus target is a heading without `tabindex`, so route changes are not announced through managed focus. There is no route-change live announcement.

Required repair: use real URLs and `pushState`, restore the view on back/forward, set a distinct title per route, and move focus to an explicitly focusable page heading with a polite route announcement.

### P2 — Required site discovery, metadata, page structure, and 404 behavior are missing

The landing page has no canonical URL, Open Graph fields, or Twitter card. `/robots.txt` and `/sitemap.xml` both return the app HTML with status 200. An unknown path such as `/does-not-exist` also returns the normal app with status 200 and its ordinary headline; there is no designed 404 response. This is an unexpected success response, not the acceptable deliberate HTTP 404 described by the review contract.

The landing page omits the required three-step **How it works** and plain limitations/privacy sections. Its footer omits **Built by Param Factory** and a version/build ID. Privacy and Terms have correct titles and return 200, but they do not use the consistent site header/navigation/footer, have no page descriptions or canonical/social metadata, and the Privacy contact text provides no actual repository or contact link.

Required repair: add the required metadata and discovery files, a styled 404 that returns 404, the missing landing sections and footer data, and the standard site skeleton on legal pages.

### P2 — Several phone touch targets are smaller than 44 px and legal pages lack skip links

At 390 px wide, the home wordmark measured 358 × 38 px. Home footer links measured about 20 px high. Every header/footer link on Privacy and Terms measured 19 px high. These do not meet the 44 × 44 px touch-target baseline. Privacy and Terms also have no skip link to `<main>`.

Required repair: give each interactive link a 44 px minimum target with adequate spacing and add a visible-on-focus skip link to every page.

## Checks that passed

### Clean checkout and build

The clean clone was `/tmp/pad-light-review-1.XXDvAP` at documentation SHA `f05fc23b09beebbc912dd0e5ee64379bf8281685`.

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 60 packages audited, 0 vulnerabilities. |
| `npm audit --omit=dev` | Passed; 0 production vulnerabilities. |
| `npm test` | Passed: 4 Vitest checks and 17 Playwright checks; 1 expected project skip. |
| `npm run build` | Passed; `dist/index.html` produced. |
| `/opt/fleet/lib/verify-url.sh <live-url> <evidence-dir>` | Passed; title, `lang`, one `h1`, `<main>`, image alt text, button names, and console smoke check passed. |

There were no claim commands because the required claim file is missing. That absence is a finding, not a skipped command hidden by this report.

### Live product paths

- Desktop response practice completed the eight-step starter routine with `8 right and 0 wrong`. A wrong first input recorded one miss, retained the target, and said which lane to try.
- Empty names and 39 BPM were rejected. Both 40 and 240 BPM saved. Remove disabled at one step and Add disabled at 64 steps.
- Malformed and over-100 KB imports gave actionable errors. A valid three-step routine imported and survived reload.
- A fresh service-worker context contained both emitted CSS and JavaScript in `plc-v1.1.0-shell`. Its first offline reload rendered the offline notice and accepted the first cue without console errors.
- The app manifest parsed with no browser errors and contained 192 px, 512 px, and maskable icons.
- Live requests made during the tested workflow stayed on `pad-light-choreographer.sociobot.in`. No console or page errors occurred.
- Fresh axe scans of Play, Arrange, Pair MIDI, Privacy, and Terms had zero violations. Keyboard Tab first reached the skip link with a 3 px blue outline and 4 px offset. Reduced motion changed pad transitions to `0.01ms` and removed transforms.
- At 390 × 664, there was no horizontal overflow. The Pair MIDI button measured 354 × 46.8 px and its centre hit-tested to the button after normal scrolling.
- Fresh Lighthouse 13 mobile results were Performance **100**, Accessibility **100**, Best Practices **100**; FCP 0.9 s, LCP 1.4 s, TBT 0 ms, CLS 0. The first two Lighthouse 12.8.2 launches failed in the audit environment before one could find the configured browser and then because its tab crashed; the successful current run is the product measurement.
- Built sizes were 26,641 bytes JavaScript, 17,166 bytes CSS, and 15,524 bytes for the 480 px hero. They meet the static budgets.
- Live cache and security headers include immutable one-year caching for the hashed app asset, no-store for `sw.js`, CSP, MIDI-scoped Permissions-Policy, Referrer-Policy, HSTS, and `nosniff`.

### Live and candidate identity

| Artifact | Clean build and live SHA-256 |
| --- | --- |
| `index.html` | `6ce829d43999c0e55c6568331915495abedde143067ac00aadd854be8d8f5306` |
| `sw.js` | `372f375bc9381574c8fe9baec4b16975f3f989b2daf4e588e75f180070a196d0` |
| `assets/index-1KkRPhgQ.js` | `c1b93bf3d0278114db5096d7c537299c29037300bc79ab934d5491d637991e3e` |
| `assets/index-tX2cJ1Yy.css` | `9d22e35996ff423a4df2de4465d36914f9c17edfb688b05d62fcac8379a10e32` |

Commits after implementation SHA `de0a90a69c3e2cb9a68bdac5274c059c8fa1fe78` change only `.factory` documentation. The live runtime therefore matches the last implementation candidate even though the repository documentation SHA is later.

## Earlier finding disposition

| Earlier finding | Current disposition and evidence |
| --- | --- |
| TLS mismatch, missing live deployment, and HTTP behavior | Resolved. HTTPS returns 200 with a valid deployed app; live hashes match the clean build. |
| First cold offline reload showed a blank app | Resolved. Fresh live cache contains both hashed app assets; the first offline reload rendered and accepted a cue. |
| Update action messaged the old worker | Resolved in implementation and regression coverage. `npm test` passed the check that sends `SKIP_WAITING` to `registration.waiting` and waits for `controllerchange`. |
| 390 × 664 status bar covered Pair MIDI | Resolved. The button centre hit-tested to the button in the fresh live phone context. |
| Mobile Lighthouse score was 83 | Resolved. Fresh live Lighthouse scored 100 Performance with 0 ms TBT. |
| Malformed JSON exposed a raw parser error | Resolved. Live recovery copy names valid Pad Light routine JSON and tells the user to choose an exported file. |
| Missing immutable caching and response security policy | Resolved. Live hashed assets, worker policy, CSP, Permissions-Policy, Referrer-Policy, HSTS, and `nosniff` were verified. |

## Review boundaries

This static PWA has no backend, tenant, payment, or rate-limit surface, so backend isolation, restart persistence, health, and 429 checks do not apply. No physical MIDI controller was available. The declared standards-based, non-SysEx input and opt-in output path passed the repository's browser mock test. An extra AI step would not improve the brief's direct hardware-practice job; import and export already provide the useful portability step.

Evidence is stored under `/work/.evidence/`, including desktop and phone screenshots, URL smoke output, and Lighthouse JSON.
