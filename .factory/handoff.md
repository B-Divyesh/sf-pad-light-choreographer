# Pad Light Choreographer — verification handoff

## Verification status: **FAIL**

Independent verification of candidate `a9654421af516fc6df087e61485f6655f7f2fc83` on 2026-08-28 confirms that `https://pad-light-choreographer.sociobot.in/` is now healthy and byte-for-byte matches the candidate build. The candidate nevertheless **fails release acceptance**: on a fresh install, going offline immediately after the service worker becomes ready and reloading returns cached HTML but a blank `#app`, with two failed generated-asset loads. The worker does not precache the built JS/CSS.

Also open: a broken waiting-worker update action, a 390 × 664 mobile CTA obscured by the fixed status bar, Lighthouse performance 83 (target ≥90), raw malformed-import error copy, and non-immutable 30-second cache headers for hashed assets. The exact evidence, reproductions, passing checks, URL/hash match, and remediation are in [`.factory/verification-2.md`](verification-2.md). This supersedes the prior deployment-only report in `verification.md`.

## Shipped

- A complete four-lane call-and-response practice desk. The active cue is visible, announced, and—when enabled—sent to the chosen MIDI output as conservative note-on/note-off messages. Correct hits advance; wrong hits are counted without losing the cue.
- A tempo-based preview, keyboard controls (`1`–`4`, Space), progress tape, hit/miss score, and a built-in starter routine.
- Web MIDI permission and port selection, configurable input/output notes and channel, explicit light-output opt-in, live input feedback, hot-plug refresh, and clear unsupported-browser guidance.
- A 1–64 step routine editor with rests, 40–240 BPM validation, create/save/delete, IndexedDB persistence, and versioned JSON import/export with safety limits.
- Installable offline PWA with versioned caches, app-shell precache, runtime caching, offline fallback, update notification, responsive icons, and preserved local data.
- Dedicated `/privacy/` and `/terms/` pages, no account, no tracking, no runtime CDN, and no network dependency after install.
- Original dithered/halftone hero art, responsive WebP sources, and a product-specific print system documented with generation provenance in `.factory/design.md`.

## Run and deploy

```sh
npm install
npm run dev
npm test
npm run build
```

Static deployment root: `dist/`. The exact build command is `npm run build`; `dist/index.html` is present at the root. Production must be served over HTTPS for Web MIDI and service-worker support.

## Verification (2026-08-27)

- `npm test`: passed — 3 Vitest unit tests and 12 Playwright checks across desktop Chromium and a 390px mobile profile.
- Covered: starter practice and keyboard response, local edit/save/reload, mocked MIDI permission + note-only light messages, every workspace axe scan, legal routes, and online-to-offline reload/practice.
- `npm run build`: passed (Vite 7.3.6, ES2022). Output: 26.27 KB JS / 8.97 KB gzip; 17.10 KB CSS / 4.62 KB gzip. Mobile hero: 16 KB WebP; largest hero: 182 KB WebP.
- Production-route smoke test at 390×844: `/`, `/#arrange`, `/#connect`, `/privacy/`, and `/terms/` each have one `h1`, fit the viewport, produce no console/page errors, and have zero axe violations.
- Lighthouse mobile against the production preview: Performance **100**, Accessibility **100**, Best Practices **100**; FCP 0.9 s, LCP 1.7 s, TBT 0 ms, CLS 0, total transfer 90 KiB. INP has no lab interaction sample; TBT is the lab proxy and remains within budget.
- `npm audit --omit=dev`: 0 production vulnerabilities.
- Original hero reviewed manually: no text artifacts, logos, hands, misleading UI, or recognizable hardware branding. It is 1200×800 with 800×533 and 480×320 responsive derivatives.

## Known gaps

- Physical MIDI hardware is unavailable in the build container. Browser MIDI behavior and exact LED velocity/color semantics vary by controller; the automated test uses a standards-shaped input/output mock and verifies only the documented note messages the app promises.
- Controllers that require SysEx, proprietary LED palettes, or vendor drivers will still work as on-screen/keyboard practice tools but may not light. This is intentionally outside v1 and the UI keeps output disabled by default.
- Safari and Firefox do not consistently expose Web MIDI. The app detects this and preserves the complete keyboard path.

## Suggested next steps

- Publish a tested compatibility table after hands-on checks with common 4×4 and 8×8 devices.
- Add an opt-in “learn note” capture flow once hardware testing can validate duplicate-note handling.
- Consider user-shared routine files only after a privacy-preserving moderation and provenance design; v1 deliberately has no backend.
