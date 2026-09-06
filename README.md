# Pad Light Choreographer

Pad Light Choreographer helps MIDI-pad owners practise four-lane pad-light routines without a DAW. It runs as a local-first browser PWA.

Live: https://pad-light-choreographer.sociobot.in

## Try it

Open https://pad-light-choreographer.sociobot.in/demo or select **Try it with sample data** on the first screen. The demo includes two populated routines in a separate browser-storage database. **Reset demo** restores the shipped samples. **Start for real** returns to your own browser storage.

## What it includes

- Standard non-SysEx Web MIDI pairing with configurable notes.
- Opt-in note-on and note-off cue lights on a selected MIDI channel.
- Response practice with keys 1–4, Space, or mapped controller pads.
- A 1–64 step editor with 40–240 BPM routines.
- Versioned JSON import and export.
- Browser-storage persistence and offline practice after the first visit.

Each public product claim and its browser test are listed in .factory/claims.json. Demo storage and reset behavior are documented in .factory/demo.md.

## Develop

Requires Node.js 20 or newer.

~~~sh
npm ci
npm run dev
~~~

Open http://localhost:5173. Use a Chromium-based desktop browser on localhost or HTTPS for Web MIDI. Keyboard practice remains available when Web MIDI is unsupported.

## Test and build

~~~sh
npm test
npm run test:claims
npm run build
npm run preview
~~~

npm test runs unit checks plus desktop and phone browser journeys against the production build. npm run test:claims runs the documented claim checks. npm run build writes deployable files to dist.

## Privacy and deployment

Routines and MIDI preferences stay in browser IndexedDB. MIDI messages are processed in the page. The product has no account, analytics, third-party fonts, or backend. The PWA uses a service worker and offers JSON export for routines.

Deploy dist to the configured static host. The included Static Web Apps configuration provides cache, security, app-route, and designed 404 behavior. Privacy and terms are available at /privacy/ and /terms/.

Visual direction and artwork provenance are in .factory/design.md. Release verification is recorded in .factory/handoff.md.

## License

MIT — see LICENSE.
