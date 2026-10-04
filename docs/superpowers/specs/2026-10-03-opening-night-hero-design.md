# Opening-night hero: spec

Replaces the plain cream hero. User-approved direction "A: Opening night" (2026-10-03).

## Goal
A hero that stops people: big, animated, polished, on-brand. Deep-teal cinematic scene like the 2025 flyer, using last year's event photos. Everything below the hero (cream sections) is unchanged.

## Scene (back to front)
- Teal background (#1f4f5c to #0f3b3f), fine grain, soft drifting clouds.
- Photo reel: two rows of tall arch-topped windows from the 2025 photos, thin white ring, drifting in opposite directions. Teal duotone (a `color` blend overlay); on desktop the cursor reveals true colour in a soft circle. Phones: lighter tint, no spotlight.
- Title: "Tarbiyyah Conference" in huge white script, drawn on stroke by stroke from pre-converted glyph outlines, then filled. Slight tilt toward the cursor. Dark teal scrim behind it.
- Crescent (gold), "MSA at UC San Diego presents", tagline, date line, gold tickets button.
- Geisel + palms in cream line art on the teal, on a thin gold ground line. Cream sections begin below.

## Motion
Load (~3 s): reel fades up, title writes on, supporting text rises, Geisel draws. Idle: reel and clouds drift (transform only). Scroll: title scales/fades, rows move at different speeds. Reduced motion / no JS: static, fully drawn hero.

## Build notes
- Glyph outlines generated once by `scripts/gen-title.mjs` (opentype.js) into `components/site/hero/title-paths.ts`.
- Photos pre-resized (about 1000 px, JPEG) into `public/photos/`; originals stay in `docs/`.
- Night variants of the hatch patterns and plant sprite (cream strokes) so the engravings read on teal.
- Nav is transparent with light text over the hero, switching to the cream bar after it.
- Performance targets as before: no long frames while scrolling, near-zero idle repaints.
- Verified at 1920, 1440, 1280 and 390 px, with reduced motion and without JS. Nothing committed.
