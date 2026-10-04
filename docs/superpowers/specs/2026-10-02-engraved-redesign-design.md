# Engraved-illustration redesign: spec

Intended path: `docs/superpowers/specs/2026-10-02-engraved-redesign-design.md`. Written for an Opus session to execute. The next step is `superpowers:writing-plans`, then execution.

## Context
The Tarbiyyah Conference site (Next 16 static export, Tailwind v4, shadcn/Radix, branch `tarbiyaah-site`, MSA at UCSD, Sunday Nov 1 2026) currently has a layered SVG hero (arch, lattice, skyline, lanterns) on a cream and blue-green palette. The Geisel and tree SVGs look wrong, and the schedule spine doesn't connect (see `docs/superpowers/next-steps-2026-09-29.md`). The reference is the "Engraved Illustration Landing Page Template": a copperplate engraving in one ink, with an illustrated arch hero, hatched foliage, and every illustration as inline SVG.

**Goal:** give the whole site one coherent engraved visual identity, drawn as inline SVG and animated as it draws in. Content, sections and data stay as they are.

## Decisions made with the user
| Topic | Decision |
|---|---|
| Scope | Whole site, not only the hero |
| Ink | Single MSA blue-green ink (#307060, deep ink #1f4f5c) on cream (#f4efe3). Gold is dropped as a fill and survives only as an optional tiny accent (crescent, medallion). |
| Motifs | Geisel Library and UCSD landmarks; Islamic architecture and geometry (pointed arches, muqarnas, mashrabiya, tile); botanicals (date palm, olive, pomegranate, eucalyptus); lanterns, crescent, stars, calligraphy ornaments |
| Figurative imagery | None. No statues or people (unlike the template). |
| Art pipeline | Procedural hatching on hand-written simple SVG shapes: hatch via `<pattern>`/`clipPath`, varied stroke weight, `stroke-dashoffset` draw-on. No traced or AI images. |

## Assumptions (change any you disagree with)
- Static export, no new runtime dependencies. Illustrations are React components that render inline SVG.
- Keep section order and copy: Hero, stats, what to expect, About/Theme, schedule, speakers, sponsors, gallery, Find the MPR, tickets, FAQ, footer.
- The hero still shows no theme line, keeps "Transforming knowledge into action.", the date/time/MPR line and "Get tickets".
- Photo content (gallery, speaker photos) stays photographic, framed in engraved borders.
- No dark mode (already removed).

## Design

### 1. Engraving system (`components/engraving/`)
The foundation everything else uses.
- `defs.tsx`: shared `<svg><defs>` mounted once in `layout.tsx` with hatch patterns (`hatch-light`, `hatch-mid`, `hatch-dense`, `crosshatch`, `stipple`) at 45° and 135°, using `currentColor` so they follow the ink token.
- Stroke conventions: 3 weights (hairline 0.75, line 1.5, bold 2.5), round caps and joins, `vector-effect: non-scaling-stroke` so weight holds at every size.
- Shape helpers: `pointedArch(w, h)`, `muqarnasRow`, `geometricStar(n)`, `leafSprig`, `hatchFill(pattern)`. Pure functions that return path data, unit-testable under Vitest in `tests/`.
- Tokens in `app/globals.css`: `--ink`, `--ink-deep`, `--paper`, `--paper-shade`, `--accent-gold` (optional). Remove the unused gold/dark tokens.
- Animation primitives (CSS + the existing `Reveal`): `.draw` (dashoffset, `--path-length`), `.hatch-in` (fade/scale the hatch after its outline), `.sway` (a few degrees, 6–10 s, foliage only). All are disabled under `prefers-reduced-motion` (fully drawn) and fully visible without JS (existing `<noscript>` block in `app/layout.tsx`).
- Performance budget: each illustration is under 15 KB of SVG, and animation uses only transform and opacity, apart from stroke-dashoffset on outlines.

### 2. Hero scene (`components/site/hero/*`, replacing `skyline.tsx`)
- Layers back to front: faint geometric lattice, large pointed-arch frame with muqarnas hood and hatched spandrels, Geisel Library in hatched engraving, palms and eucalyptus either side, lanterns hanging from the arch.
- **Geisel** from the user's elevation (reference image to be saved at `docs/reference/geisel-elevation.jpg`). It is symmetric. It has a small top box; three glass tiers stepping wider downward, each with a thin overhanging slab; a wide flared concrete platter slab with two tapering supports with triangular cut-outs; two narrower glass tiers under the slab; four slim tapered columns; a central core; a podium with a sunken rounded window; side planter walls. Glass is rendered by thin horizontal hatching, concrete by crosshatch, and the ground line dips under the podium.
- Order of draw-in: arch outline, Geisel outline, hatching fills, foliage, lanterns.
- Acceptance: the title block keeps the existing no-overlap fixes (knockout halo, looser leading, short-window sizing). It reads at 390 px and 1440 px, doesn't touch the CTA, and the hero has no horizontal scroll.

### 3. Section system
- **Dividers:** a hatched band with a centred star or lantern ornament between sections (`<SectionDivider variant>`).
- **Section headers:** small engraved crescent/star ornament above the mono label, and the script title kept.
- **Cards and frames:** replace plain borders with a double-rule engraved frame, corners with small muqarnas notches, and a hatched drop shadow offset (`.engraved-card`). Photos (speakers, gallery) get the same frame with a `hatch-light` mat.
- **Stats and "what to expect" plates:** each plate gets a small engraved vignette, such as a date palm, a lantern, a minbar arch, a book or a tea glass, all from the shape helpers.
- **Schedule spine (replaces the broken one):** one continuous double line down the centre, scroll-linked using `hooks/use-scroll-progress.ts` and `lib/scroll-progress.ts` (both exist, so check their tests). The line is ink up to the point reached and hatched-grey below. Round stop nodes sit on the line aligned to each card header, and a short connector joins each node to its card. A medallion at the start and an end cap. Cards alternate left and right on desktop and sit on a left-aligned spine on phones. Card borders draw on entering view.
- **About / Theme:** the theme card gets an Islamic geometric star as its engraved hero.
- **Find the MPR:** keep the Google Maps embed, with an engraved frame and a small compass or Geisel vignette.
- **Footer:** a wide engraved scene (Geisel and palms silhouette in `hatch-dense` plus a lantern row) that mirrors the hero.
- **Nav:** keep the TTW-style floating tab (links left, script wordmark centre, Map and Get tickets right) and restyle it with the ink and paper tokens and a hairline engraved border.
- **Buttons and badges:** shadcn variants re-skinned to ink-on-paper with hatched hover.

### 4. Typography
Keep the script display face for titles and the mono for labels. Body in the existing sans. Titles in ink-deep. Add fine small caps for section labels. No new web fonts, unless the plan finds the script face too weak at small sizes.

## Decomposition (each its own plan task group)
1. Engraving system and tokens, with tests for the shape helpers.
2. Hero scene (arch, Geisel, foliage, lanterns).
3. Section primitives (divider, header, engraved card) and re-skin the existing sections.
4. Schedule spine rebuild.
5. Plate vignettes and the footer scene.
6. Nav and button restyle.
7. Verification and cleanup (README, delete `legacy/`, remove dead tokens).

## Risks
- **Looking amateur.** Hatched procedural art is easy to get wrong. Mitigation: build the engraving system and one test illustration first, screenshot it at 390 and 1440 px, and get the user's approval on the look before doing the rest.
- **Geisel accuracy.** It needs the elevation drawing in the repo. Ask the user to supply it if it's missing.
- **Heavy hero.** Too many hatch patterns and paths could hurt paint time. Budget per above, and measure in the Playwright run.
- **Whole-site scope.** Stage it in the order above so the site is shippable after each group.

## Out of scope
New copy, new sections, backend or ticketing changes, and the exact MPR location (tracked separately in the handoff).

## Verification
- `npm test` passes, including new shape-helper tests. `npm run build` completes as a static export.
- With the dev server running, take Playwright screenshots at 1440 and 390 px, waiting for animations to finish (the first capture is often blank).
- Check keyboard focus, `prefers-reduced-motion` (everything drawn, nothing moving), no-JS in a sandboxed iframe, a clean console, and no horizontal scroll.
- Check contrast of ink on paper (WCAG AA for body text and labels).
