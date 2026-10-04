# Quiet Edition format port + hero revisions: spec

Supersedes stages 3–6 of `2026-10-02-engraved-redesign-design.md`. The engraving system (stage 1) stays as built.

## Decisions (user-approved, 2026-10-02)
- **Look:** Tarbiyyah cream paper and blue-green ink everywhere; Instrument Serif for large paragraphs; Pinyon script for the wordmark; Geist / Geist Mono for small text.
- **Sections:** keep every current section, re-laid out in the Quiet Edition (QE) style (`/Users/zahir/quiet-edition/index.html`).
- **Artwork:** QE's illustrated slots are drawn in the hero's engraving style.
- **Pattern / lanterns:** original drawings of traditional forms (eight-fold interlaced star pattern; domed lantern with pierced panels), not traced from reference images.

## 1. Hero
- **Ogee arch.** Each side rises from the jamb, steps in at the spring line, then runs a convex curve into a concave curve up to a pointed apex with a small finial.
- **Frame body.** Everything between the outer frame and the opening is filled with an interlaced eight-fold star pattern (SVG `<pattern>` tile, about 56px on desktop and about 40px on phones) over paper.
- **Borders.** Double rules around the outer frame and around the opening; the opening's inner rule is a true inset of the curve.
- **Width.** The frame spans `min(1500px, 96vw)`; the opening keeps about 55–60% of the frame width on desktop.
- **Lanterns.** Ring, domed cap, rim, three pierced panels (star rosette in the centre, diamond lattice at the sides), lower rim, footed base. Ink silhouette with a gold glow showing through the cut-outs. They sway and hang from the arch shoulders on wide screens.
- **Geisel on phones.** About 90% of the screen width in a taller band, with heavier strokes; the side trees at about 60% of Geisel's scale.
- **Draw-in order.** Borders draw, then the pattern fades in.

## 2. Page format (QE)
- **Header.** QE-style bar: script wordmark left; "Nov 1, 2026 · UC San Diego", a Get tickets pill and a menu button (the existing Sheet) right. It replaces the floating tab nav.
- **Sections, in order:**
  1. Hero.
  2. Serif statement: what the conference is.
  3. Olive-sprig vignette: lectures, workshops, panels.
  4. Date-palm vignette: theme Ibad al-Rahman.
  5. Serif statement: date, time and MPR, with a mono countdown (replaces the HUD and stats).
  6. Tilted engraved campus postcard: venue text, directions buttons, map embed in a framed print.
  7. Four staggered pillars: Lectures · Workshops · Panels · Community.
  8. Engraved lantern band, introducing the schedule.
  9. Schedule timeline, restyled.
  10. Speakers as tilted portrait prints with bio dialogs.
  11. Deck: "From previous years", with engraved placeholder prints.
  12. Sponsors line with logo slots.
  13. Circles diagram: Knowledge → Action around Faith, Character at the core.
  14. FAQ accordion with serif questions.
  15. Closing: Get tickets pill over an engraved Geisel and palm landscape, with "who it's for" fine print, contact and Instagram.
- **Motion.** Text blurs into focus as it reaches mid-screen; vignettes stay pinned; postcard tilts with scroll; deck cards lift away. All of it is static under reduced motion and visible without JS.

## 3. Verification
- `npm test`, `tsc`, `eslint`.
- Screenshots at 390, 1440 and 1920 px.
- Reduced motion, no-JS, no horizontal scroll, clean console.
- No commits.
