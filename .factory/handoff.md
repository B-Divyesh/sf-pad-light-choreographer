# Pad Light Choreographer — repair handoff

## Release status: **PASS — deployed and verified**

This repair addresses every finding in the independent verification of candidate `a9654421af516fc6df087e61485f6655f7f2fc83` recorded in `verification-2.md`. It preserves the local-first Web MIDI PWA, Vite static `dist/` artifact, and Azure Static Web Apps deployment class.

## Repaired findings

- **P0 cold offline boot:** the service worker is now emitted during the Vite build, with the actual hashed JavaScript and CSS included in its versioned `plc-v1.1.0-shell` precache. Cache lookups use `ignoreVary: true`, so Vite preview's `Vary: Origin` response cannot turn a precached asset into an offline miss. The shell cache version was advanced and the manifest start URL is now `?v=2`.
- **P1 update activation:** “Update app” posts `SKIP_WAITING` to `registration.waiting`, disables itself while updating, and reloads only after `controllerchange`.
- **P2 390 × 664 mobile overlap:** live status and update notices are normal document-flow strips below 700px, before `<main>`, rather than sticky/fixed overlays. The MIDI CTA keeps its full target and receives the centre hit test.
- **P2 performance:** production sourcemaps are not shipped. Current mobile Lighthouse is comfortably over the required threshold (details below).
- **P3 import recovery:** malformed routine files now say: “That file is not valid Pad Light routine JSON. Choose a valid exported routine file and try again.”
- **P3 response policy:** `staticwebapp.config.json` configures immutable one-year caching for `/assets/*`, no-cache service-worker/manifest fetches, CSP, Permissions-Policy (including `midi=(self)`), Referrer-Policy, and `nosniff` for the static Azure deployment.

## Regression coverage

- A Playwright cold-install test waits for service-worker control without an extra online reload, asserts every emitted JS/CSS resource exists in the shell cache, goes offline, reloads, and completes the first cue.
- A service-worker mock asserts the update action sends exactly `{ type: 'SKIP_WAITING' }` to the waiting worker.
- A 390 × 664 mobile test scrolls the MIDI CTA into view and verifies its centre resolves to the CTA, not status chrome.
- A malformed JSON upload test asserts the actionable recovery copy.
- A Vitest response-policy test asserts immutable hashed-asset caching, no-cache worker policy, CSP, and MIDI permissions policy.

## Verification — 2026-08-28 UTC

Run from a clean dependency installation:

```sh
npm ci
npm audit --omit=dev
npm test
npm run build
```

- `npm ci`: passed; 60 packages audited, 0 vulnerabilities.
- `npm audit --omit=dev`: passed; 0 production vulnerabilities.
- `npm test`: passed: 4 Vitest tests and 17 Playwright tests; one intentional desktop skip for the mobile-only 390px assertion. Coverage includes keyboard practice, persistence, standard non-SysEx MIDI mock/output, desktop and iPhone-13 accessibility scans, legal pages, cold offline reload, update targeting, mobile hit testing, and import recovery.
- `npm run build`: passed (`tsc --noEmit && vite build`). `dist/index.html` is at the static root. Initial JS is 26,641 bytes (9,080 gzip); CSS is 17,166 bytes (4,620 gzip); largest artwork is 186,066 bytes. All remain within static-product budgets.
- Lighthouse 12.8.2 mobile on `vite preview`: Performance **100**, Accessibility **100**, Best Practices **100**; FCP 1.0 s, LCP 1.4 s, TBT 90 ms, CLS 0, transfer 18 KiB.
- The browser suite reports no normal-load console/page errors, no serious/critical axe violations on Play, Arrange, Pair MIDI, Privacy, or Terms, keyboard controls work, and the fresh offline flow works without a warmed runtime cache.
- Privacy/network behavior remains local-first: no analytics, third-party scripts/fonts, or third-party requests; IndexedDB stores routines/settings; Web MIDI requests non-SysEx access and note output remains opt-in.

## Production identity and response verification

- Deployed with `/opt/fleet/lib/deploy-static.sh pad-light-choreographer dist` after pushing repair commit `de0a90a69c3e2cb9a68bdac5274c059c8fa1fe78` to `main`.
- `https://pad-light-choreographer.sociobot.in/` returns HTTPS 200. The factory browser smoke check loaded in 804 ms with no console errors and confirmed the expected title, `lang="en"`, one `h1`, a `main` landmark, and no missing image alt text or unlabeled buttons.
- Live SHA-256 values match the local production artifact: HTML `6ce829d4…f5306`, service worker `372f375b…a196d0`, JS `c1b93bf3…91e3e`, CSS `9d22e359…10e32`.
- Live `/assets/index-1KkRPhgQ.js` is `Cache-Control: public, max-age=31536000, immutable`; `/sw.js` is `no-cache, no-store, must-revalidate`. CSP, `Permissions-Policy: … midi=(self)`, `Referrer-Policy`, and `X-Content-Type-Options: nosniff` are present.
- A brand-new live Chromium context confirmed the shell cache contains the emitted JS/CSS; its first offline reload rendered the app and offline strip with the Start response control available and no console/page errors.

## Deploy

Build with `npm run build` and deploy the contents of `dist/` as the static artifact. The included `staticwebapp.config.json` is part of that artifact and is required for the immutable cache and security headers. The configured public URL is `https://pad-light-choreographer.sociobot.in/`.

## Known limits

- Physical MIDI hardware was unavailable in this container. Standards-shaped input/output mocks cover the documented non-SysEx note path; vendor-specific LED protocols remain intentionally out of scope.
- Safari and Firefox may not expose Web MIDI consistently. The keyboard practice path remains available and is surfaced by the UI.
