# Pad Light Choreographer

Pad Light Choreographer is a local-first Web MIDI practice desk for four-lane pad controllers. It lets a performer build a compact cue routine, preview it at tempo, and practise call-and-response while the next hardware pad is lit. It is aimed at controller owners who want to rehearse without setting up a DAW.

Live: <https://pad-light-choreographer.sociobot.in>

## What it does

- Requests standard, non-SysEx Web MIDI access and lists available inputs/outputs.
- Maps four lanes to configurable MIDI notes (36–39 by default).
- Sends only note-on and note-off light cues, after explicit opt-in, on a selected channel.
- Runs an at-your-own-pace response routine with hit/miss feedback plus a tempo preview.
- Provides keyboard parity with keys `1`–`4` and Space.
- Edits 1–64 step routines, including rests and 40–240 BPM tempos.
- Saves locally in IndexedDB and imports/exports versioned JSON files.
- Installs as a PWA and continues to practise, edit, and save offline.

No account, backend, analytics, third-party fonts, copyrighted charts, or vendor-specific MIDI messages are used.

## Develop

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. For MIDI, use a Chromium-based desktop browser on `localhost` or HTTPS. Connect the controller before choosing **Pair MIDI**. Keyboard practice remains available when Web MIDI is unsupported.

## Test and build

The Playwright version is pinned to match the factory browser image.

```sh
npm test
npm run build
npm run preview
```

`npm test` runs unit tests plus desktop/mobile Chromium journeys, an axe accessibility scan, and an explicit offline reload. `npm run build` emits the deployable static app to `dist/`, with `dist/index.html` at its root.

## Routine file format

Exports are readable JSON with `format: "pad-light-routine"`, `version: 1`, a name, BPM, and an array of lane numbers `0`–`3` or `null` rests. Imports are validated and limited to 64 steps and 100 KB.

## Privacy and deployment

Routines and settings stay in browser IndexedDB. MIDI events never leave the page. Privacy and terms are available at `/privacy/` and `/terms/`. Deploy the contents of `dist/` to the configured Azure Static Web Apps host; `staticwebapp.config.json` sets immutable caching for hashed assets and a no-cache policy for the service worker. No environment variables or backend are required.

Visual direction and generated-art provenance are in [`.factory/design.md`](.factory/design.md). Release verification and known limitations are in [`.factory/handoff.md`](.factory/handoff.md).

## License

MIT — see [`LICENSE`](LICENSE).
