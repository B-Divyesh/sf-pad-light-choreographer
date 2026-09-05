# Pad Light Choreographer — review handoff

## Current status: FAIL

Independent review 1 on 2026-09-05 found six defects and eight untested public claim groups. The full evidence and required repairs are in [`.factory/review-1.md`](review-1.md).

## Review target

- Implementation: `de0a90a69c3e2cb9a68bdac5274c059c8fa1fe78`.
- Documentation: `f05fc23b09beebbc912dd0e5ee64379bf8281685`.
- Live URL: <https://pad-light-choreographer.sociobot.in/>.
- The live HTML, service worker, JavaScript, and CSS exactly match the clean build.

## Required work

1. Add the isolated one-click sample demo, persistent demo label, reset/exit controls, and `.factory/demo.md`.
2. Add `.factory/claims.json` and one tagged demo-based test for each of the eight public claim groups.
3. Replace the metaphorical first-screen copy with the job, audience, action result, and three facts; add `.factory/copy-audit.md`.
4. Add real routes, history restoration, route titles, focus management, and route announcements.
5. Add canonical/social metadata, robots, sitemap, the standard page sections/footer, and a designed response that returns HTTP 404.
6. Increase undersized mobile link targets and add skip links to Privacy and Terms.

## Verification completed

From a clean clone at `f05fc23`:

```sh
npm ci
npm audit --omit=dev
npm test
npm run build
```

All four commands passed. The suite reported 4 Vitest checks and 17 applicable Playwright checks with one expected project skip. Fresh live desktop and phone journeys, isolated offline boot, axe scans, response headers, route requests, IndexedDB persistence, invalid/boundary/recovery inputs, and local-to-live hashes were also checked.

Fresh Lighthouse 13 mobile scores were Performance 100, Accessibility 100, and Best Practices 100. FCP was 0.9 s, LCP 1.4 s, TBT 0 ms, and CLS 0. Built sizes were 26,641 bytes JavaScript, 17,166 bytes CSS, and 15,524 bytes for the 480 px hero.

## Earlier findings

All findings in `verification.md` and `verification-2.md` remain fixed: deployment/TLS, cold offline boot, update activation, 390 × 664 overlap, performance, malformed-import recovery, and response policy. The six current findings are separate contract gaps documented in `review-1.md`.

## Limits

No physical MIDI controller was available. The repository's standards-shaped browser mock covered non-SysEx MIDI input and opt-in note-on/note-off output. This product has no backend, tenant, payment, or rate-limit surface.
