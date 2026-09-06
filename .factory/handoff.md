# Pad Light Choreographer handoff

## Status

Independent verification 4 is **FAIL** because one minor accessibility finding remains.

- Findings: 1 (`1 P3`).
- Untested claims: 0.
- Implementation SHA: `bcb907d88173caac5b554676e748537a7b19cc5e`.
- Documentation baseline: `f6119bd9b628200d99c68f888a1ec3b92a308168`.
- Live URL: <https://pad-light-choreographer.sociobot.in/>.
- Full report: `.factory/verification-4.md`.

No product code was changed during this verification.

## Remaining finding

On `/privacy/` at a 390 × 844 phone viewport, the inline **project repository** contact link measures 173.39 × 19 px. The product contract requires a 44 × 44 px minimum touch target. Give that link a 44 px hit area and rerun verification.

All other checked product, legal, demo, and 404 controls meet the touch-target baseline.

## What passed

- Clean detached checkout at the implementation SHA: `npm ci`, production audit, build, and the full test suite.
- All eight exact commands declared in `.factory/claims.json`; no public claim remained untested.
- Live desktop and 390 × 664 phone first screens state the job, audience, first action, and action result before scrolling.
- The demo contains two populated routines, keeps its label across routes, resets, exits, and does not change the separately saved real routine.
- Normal practice, wrong-hit recovery, invalid tempo, malformed and valid imports, boundary claim checks, route history, titles, managed focus, legal pages, links, and deliberate 404 behavior.
- Live non-SysEx MIDI discovery and opt-in note-on/note-off behavior with a standards-shaped browser mock.
- Fresh-context first offline reload and cue input, service-worker update regression coverage, same-origin request boundary, security headers, and immutable asset caching.
- Factory URL smoke, route axe scans, standalone axe CLI, visible keyboard focus, reduced motion, and mobile layout checks.
- Fresh Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices; FCP 0.9 s, LCP 1.4 s, TBT 30 ms, CLS 0.
- Live `index.html`, `sw.js`, JS, and CSS match the clean `bcb907d` build byte for byte.

## Run the checks

```sh
npm ci
npm audit --omit=dev
npm run build
npm test
npm run test:claims
```

The verifier also ran each claim command separately as listed in `.factory/claims.json`.

## Known limits

- No physical MIDI controller was available. The documented non-SysEx Web MIDI path passed with browser mocks; proprietary controller protocols remain outside scope.
- This static product has no backend, tenant, billing, health, restart-persistence, or rate-limit surface.

Evidence is stored under `/work/.evidence/verification-4/`.
