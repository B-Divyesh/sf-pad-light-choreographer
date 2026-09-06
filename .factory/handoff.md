# Pad Light Choreographer handoff

## Status

Implementation is deployed and verified on the HTTPS product URL.

- Implementation SHA: bcb907d88173caac5b554676e748537a7b19cc5e
- Verification documentation SHA: 059db744a2e383d7db04313ccf9e8eba9cce1f45
- Product URL: https://pad-light-choreographer.sociobot.in

This report is a later documentation update than the implementation commit. The release verification report records the documentation SHA and live artifact identity.

## What changed

- Added a direct, one-click /demo sandbox with two populated routines, persistent demo label, Reset demo, and Start for real.
- Isolated demo IndexedDB in demo:pad-light-choreographer. The real workspace remains pad-light-choreographer.
- Added .factory/demo.md, .factory/claims.json, .factory/copy-audit.md, and a verb-first catalog description.
- Replaced hash states with /, /arrange, /connect, /demo, /demo/arrange, and /demo/connect. Navigation now uses history entries, route-specific titles, focus transfer to the page heading, and a polite route announcement.
- Rewrote the first screen in plain words. It states the job, audience, first action, action result, privacy, offline, and price facts.
- Added How it works, product limits, privacy information, a consistent footer, metadata, robots, sitemap, social image, and a styled HTTP 404 page.
- Updated Privacy and Terms with the standard header, navigation, footer, skip link, metadata, and 44 px link targets.
- Added a built-artifact static test server so browser tests verify deep routes and a real 404 response.
- Kept the existing conservative Web MIDI implementation: non-SysEx access and opt-in note-on/note-off output only.

## Review finding disposition

| Finding | Disposition | Evidence |
| --- | --- | --- |
| Missing one-click sample and isolated storage | Resolved | Demo starts from /demo, uses a separate database, and browser coverage saves real data, changes demo data, resets it, and returns to intact real data. |
| Missing claim manifest and tagged tests | Resolved | Eight declared claim commands in .factory/claims.json all passed from a clean clone. |
| Metaphorical first screen and missing copy audit | Resolved | The first screen has the job headline, named audience, sample action, result, and three facts. .factory/copy-audit.md records the sentence audit. |
| Hash navigation, missing titles, focus, and announcements | Resolved | Browser coverage exercises /arrange to /connect and Back, checking URL, title, heading focus, and route status. |
| Missing discovery, metadata, sections, footer, and 404 | Resolved | Browser coverage checks canonical/social tags, robots, sitemap, legal pages, and an HTTP 404 page. |
| Undersized mobile and legal targets | Resolved | Header, footer, and legal links use 44 px targets. The 390 px sample action is hit-tested in the mobile suite. |

Earlier release findings remain resolved. The browser suite explicitly checks a fresh-context offline reload, update activation messaging, mobile action hit testing, actionable malformed JSON recovery, immutable asset policy, CSP, Permissions-Policy, and a no-console-error product journey.

## Verification

Clean checkout: /tmp/pad-light-clean-hrqq8g at implementation SHA bcb907d88173caac5b554676e748537a7b19cc5e.

| Check | Result |
| --- | --- |
| npm ci | Passed; 60 packages audited. |
| npm audit --omit=dev | Passed; 0 production vulnerabilities. |
| npm test | Passed; 5 unit checks plus 27 browser checks, with 1 expected mobile-only skip. |
| npm run build | Passed; dist produced. |
| All eight claim commands | Passed from the clean checkout. |
| Factory URL smoke check | Passed locally for title, lang, one h1, main, image alt text, button names, and console errors. |
| Accessibility | Passing Playwright axe scans cover demo practice, arrange, pairing, Privacy, and Terms. The standalone axe CLI could not start its Selenium Chrome in this container. |
| Local Lighthouse 13 mobile demo | Performance 100, Accessibility 100, Best Practices 100; FCP 1.2 s, LCP 1.5 s, TBT 0 ms, CLS 0. |

Built entry JavaScript is 30,211 bytes and CSS is 19,141 bytes before gzip. The 480 px hero is 15,524 bytes. These meet the static-PWA budgets.

Fresh desktop and iPhone-13 contexts showed the job, audience, sample action, and action result before scrolling. The 390 × 664 phone action occupied y=538.8–585.6 and its result occupied y=597.6–619.3, both inside the 664 px viewport. Both contexts had no console errors.

## Known limits

- No physical MIDI controller was available. Tests use a standards-shaped browser MIDI mock for the documented non-SysEx path. Vendor-specific LED protocols remain outside scope.
- This static PWA has no backend, payment, tenant, health, restart, or rate-limit surface.
- The product is free and has no billing offer, so billing registration metadata does not apply.

## Run and deploy

    npm ci
    npm test
    npm run test:claims
    npm run build

Deploy dist to the configured static host. staticwebapp.config.json preserves one static product, security headers, cache policy, app-route rewrites, and the 404 response.
