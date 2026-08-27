# Pad Light Choreographer — visual thesis

## Direction

**Cue-sheet halftone:** the app looks like a two-colour rehearsal card printed at a neighborhood risograph studio, then brought alive by four pad inks. The dither is functional: sparse dots signal idle paper, denser registration marks signal timing, and solid ink marks the pad that should be struck. This gives a hardware practice tool a tactile identity without imitating any controller brand or default dashboard.

The treatment is deliberately single-mode. A warm paper ground reduces glare in a dark rehearsal room, near-black keylines retain stage contrast, and cyan/magenta/amber/green inks distinguish lanes with both numbers and shapes as non-colour cues.

## Tokens

- `paper` `#F4EEDB`: warm uncoated stock; page background.
- `sheet` `#FFF9E9`: raised working surface.
- `ink` `#171914`: primary text and outlines (14.8:1 on paper).
- `muted-ink` `#565849`: supporting text (6.2:1 on paper).
- `cyan` `#006E76`: lane 1 and connected state; darkened for readable text.
- `magenta` `#B52962`: lane 2.
- `amber` `#925000`: lane 3.
- `green` `#39733C`: lane 4.
- `signal` `#C43B18`: primary action and current beat, always paired with shape/text.
- `danger` `#A4262C`; `success` `#246B3C`; `focus` `#005FCC`.

Surfaces use 2px ink rules and hard 4px offset shadows—printed layers, never generic blurred cards or gradients. A CSS radial-dot screen supplies the halftone texture, kept below 7% opacity so text stays crisp.

## Typography

- Headlines: `Arial Black`, `Arial Narrow`, system sans-serif; compact, poster-like, uppercase only for short labels.
- Working text and controls: `ui-monospace`, `SFMono-Regular`, `Cascadia Mono`, `Roboto Mono`, monospace. It makes beat counts and MIDI note values align without downloading a font.
- Scale: 14 utility / 16 body / 20 section / 28 display / clamp(42–72) hero. Body line-height 1.55; prose measure 68ch.

## Spacing and layout

An 8px base rhythm: 4, 8, 12, 16, 24, 32, 48, 72. The desktop shell is an editorial two-column spread: a narrow status rail and a wide stage. At 760px it becomes one continuous score; secondary explanations collapse while transport and the four-pad grid stay prominent. All targets are at least 44px and respect safe-area insets.

## Interaction grammar

- **Punch:** buttons depress by the same 4px as their printed shadow.
- **Registration:** selected items align a cyan and magenta pseudo-print behind the ink edge.
- **Count-in:** one beat cell fills at a time; the active pad grows subtly and gains an explicit “Next” label.
- **Hardware-first:** incoming MIDI notes and the keyboard keys `1–4` trigger the same lane path. MIDI output is conservative note-on/note-off only; users choose channel and base notes, and output can remain off.
- Status is never colour-only: text, icons, lane numerals, and ARIA announcements repeat every state.

## Motion policy

Transitions last 160–220ms and animate only opacity/transform. A pad press compresses then returns; the current cue rises from its lane. Nothing flashes or loops. With `prefers-reduced-motion: reduce`, transitions and transforms are removed, count-in updates are instantaneous, and state remains clear through fill, label, and outline.

## Original asset plan and provenance

One generated hero illustration shows a top-down, unbranded four-pad controller as a dithered print artifact with a loose practice cue strip. It clarifies the product’s hardware-first premise; the working sequencer is real HTML, not baked into the artwork. App icons are original hand-authored SVG-derived geometric pad marks rendered locally to PNG.

**Prompt sheet**

- Use case: stylized-concept
- Asset: wide landing-page editorial illustration
- Subject/world: top-down four-pad MIDI practice controller, four large square pads, a short paper cue strip and metronome registration marks; no computer screen and no people
- Medium/materials: two-colour risograph and coarse halftone screenprint on warm recycled paper, visible misregistration, flat ink, cut-paper edges
- Composition: controller on the right two-thirds, generous quiet paper on the left for adjacent page copy, landscape 3:2
- Light/lens: flat scanner-bed light, top-down orthographic view, tactile paper grain
- Palette words: warm oat paper, near-black ink, cyan, magenta, tiny amber and green pad accents
- Negative list: no text, no letters, no numbers, no logos, no brand shapes, no laptop, no photorealism, no gradients, no hands, no watermark

**Generation record:** created 2026-08-27 with the Param Factory Azure image deployment via `/opt/fleet/lib/gen-image.sh`; prompt derived verbatim from the sheet above. Generated output is original for this product. Source PNG and prompt sidecar live in `assets/src/`; shipped WebP lives in `public/assets/`. The site footer discloses AI-assisted artwork.
