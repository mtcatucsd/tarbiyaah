# Gallery page: an infinite photo canvas for last year's conference

Date: 2026-10-08 · Status: approved in brainstorming, awaiting spec review

## Goal

Show all 50 photos from the 2025 conference (The Art of Adab) on a new `/gallery/` page modelled on Framer's
Dynamic Gallery Grid, and give the home page carousel more photos with a link to the page.

Success means:
- Every one of the 50 photos is on the page, **uncropped**, and opens full size in a lightbox.
- The page feels like the Framer reference: a full-screen plane you drag, throw and wheel in any direction, with
  inertia, a slight 3D tilt and parallax.
- It works with touch, mouse, trackpad and keyboard; reduced-motion visitors get the same page with no inertia, tilt
  or parallax; no-JS visitors get a plain grid.
- Grid tiles load small thumbnails; full-size files load only in the lightbox and carousel.

## Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Fidelity | Faithful to the Framer mechanism (measured below), rebuilt in our code style. |
| Tile shape | Each tile keeps its photo's own aspect ratio (44 landscape, 6 portrait), in staggered columns. No cropping. |
| Source images | `~/Downloads/Picflow Images Oct 8` (50 webp, 8.7 MB, already compressed by the user). Used as-is for full size, not re-encoded. |
| Thumbnails | Generated with `sharp` (already in `node_modules`): 640 px wide, webp. |
| Animation engine | Plain refs + one `requestAnimationFrame` loop, like `components/site/gallery.tsx`. No new dependencies. |
| Lightbox | Built on Radix Dialog primitives (as `components/ui/dialog.tsx` is, but unstyled so it can be full screen): Esc, focus trap and scroll lock come free. |
| Home nav | Stays `#gallery` (the carousel); the carousel gets a "See all 50 photos" link to `/gallery/`. |

## Reference analysis: dynamicgallerygrid.framer.website

Read from the component's shipped source (`shared-lib.2qGAq79g.mjs`) and checked by driving the page on 2026-10-08.

1. **Stage.** A container with `overflow:hidden; perspective:1400px; touch-action:none; cursor:grab` holds one
   `preserve-3d` layer (`rotateX/rotateY` for tilt). Tiles are `position:absolute` at 0,0 and placed only by
   `translate3d`. Tiles: 300 / 230 / 160 px wide (desktop / ≤1024 / ≤640), 16 px gap, 4:5, radius 10, shadow
   `0 4px 14px rgba(0,0,0,.12)`.
2. **Infinite wrap.** Slots = `(ceil(W/cell)+3) × (ceil(H/cell)+3)`. Each frame a slot sits at
   `mod(base + offset, span) − 1.5·cell` on each axis, so ~40 DOM nodes tile an endless plane. Photos are assigned
   `(col·7 + row·3) % count` so neighbours differ.
3. **Physics.** One rAF loop that sleeps when nothing moves, and parks when offscreen (IntersectionObserver) or the
   tab is hidden. Drag velocity is smoothed (`v = 0.6v + 0.4·instant`) and released as a throw (clamped ±5000 px/s;
   zeroed if the pointer paused >90 ms). Friction per 60 fps frame: `0.985 − friction/100 · 0.13` with friction 35.
   Velocity under 4 px/s stops. Wheel adds to velocity (`v −= delta · 4`, clamped ±4000), shift-wheel goes sideways.
   Edge scroll: with a mouse within 110 px of an edge, the plane drifts at up to 6 px/frame.
4. **Depth.** Tilt up to 6° from velocity (`clamp(v/1400)·6`) plus pointer position (`·0.4`); parallax shifts
   tiles up to 14 px against the pointer. Both eased with `1 − 0.86^frames`.
5. **Hover / click.** Face scales to 1.03 over `.45s cubic-bezier(.2,.7,.2,1)` (hover-capable devices only). A drag
   of more than 6 px suppresses the click. The lightbox: `rgba(12,12,14,.9)` backdrop with 8 px blur, `01 / 50`
   counter, prev/next arrows, horizontal swipe (>60 px), fade + rise-in (`.4s cubic-bezier(.2,.7,.2,1)`).
6. **Reduced motion.** No inertia, tilt or parallax; the wheel moves the plane directly.
7. **Gaps we fix.** No keyboard access, no alt text, no Esc / focus trap in the lightbox.

## Design

### Layout: wrapping masonry columns

The one change from Framer is that tiles keep their aspect ratio, so rows no longer line up. Instead of a grid of
slots, the plane is a set of columns:

- Column count `C = max(4, ceil(W / cellW) + 3)`; `cellW = tileW + gap`. Horizontal wrap is unchanged.
- Photos are dealt round-robin: column `c` gets photos `c, c+C, c+2C, …`, so **each photo appears exactly once per
  horizontal period** and all 50 are always in the plane.
- Each column stacks its photos at their own heights (`tileW · h / w`) and wraps vertically on its **own** span.
  If a column is shorter than `H + 2 · tallest tile`, its sequence repeats until it isn't (repeats are
  `aria-hidden` and not focusable).
- Columns get a starting vertical offset of `(c · 0.37 % 1) · column span` so their seams don't line up and the
  stagger reads as deliberate.
- Tile widths: 320 / 240 / 170 px (desktop / ≤1024 / ≤640): a little wider than Framer's because most photos are
  landscape. Gap 16 / 14 / 10.

### Units

| File | Purpose |
|---|---|
| `scripts/prep-photos.mjs` | `node scripts/prep-photos.mjs <source dir>`. Copies each webp to `public/photos/gallery/<id>.webp`, where `id` is the first 8 characters of the source filename, lowercased (auto-rotated only if EXIF says so, otherwise copied byte-for-byte). Writes `<id>-sm.webp` (640 w, q 72) and `data/gallery.ts`. Re-running keeps existing alt text and order, matched by id. |
| `data/gallery.ts` | `galleryPhotos: { id, w, h, alt, source }[]`, ordered for a good mix (stage, speakers, crowd, bazaar, candid). |
| `lib/gallery-layout.ts` | Pure functions: `wrap(n, span)`, `sizingFor(viewW)`, `buildColumns(photos, viewW, viewH, sizing)`, `tilePosition(tile, layout, offsetX, offsetY)`. No DOM. |
| `lib/gallery-motion.ts` | The measured constants (`MOTION`) and pure physics helpers: `decay`, `edgePush`, `releaseVelocity`, `arrowPush`, `wheelPixels`, `isDragClick`. No DOM. |
| `components/site/gallery-view.tsx` | Client component: holds the open photo index, joins the grid and the lightbox, returns focus to the opening tile. |
| `components/site/gallery-grid.tsx` | Client component: the stage, physics loop, input handlers and tiles. Takes `photos` and `onOpen(index)`. |
| `components/site/gallery-lightbox.tsx` | Client component on `ui/dialog`: full-size image, `01 / 50` counter, arrows, ←/→ keys, swipe, alt text as an sr-only caption. |
| `app/gallery/page.tsx` | The page: metadata, a slim header overlaid on the canvas (back link to `/`, "The Art of Adab · 2025", photo count; only the link takes pointer events), the canvas filling the viewport, and a `<noscript>` fallback of plain thumbnail links. |
| `components/site/gallery.tsx` | Carousel: 5 → 12 photos drawn from `data/gallery.ts` (landscape only, since cards show a 3:2 slice), each with a hand-set `fx`; adds the "See all 50 photos" link. |

### Interaction

- **Pointer:** drag with inertia (all pointer types; the stage is `touch-action:none`), wheel/trackpad pans with
  momentum, mouse edge scroll (stops while the pointer is over the back link), click a tile to open it. A click that ends a drag of more than 6 px is ignored; keyboard clicks always open.
- **Keyboard:** the stage is focusable (`tabIndex=0`, labelled "Photo gallery, use arrow keys to move"); arrow keys
  add a velocity nudge; tiles are `<button>`s labelled with their alt text; focusing a tile pans it into view.
  Enter/Space opens the lightbox; closing it returns focus to the tile.
- **Reduced motion:** as Framer (no inertia/tilt/parallax, wheel moves directly); hover scale stays (it is not motion
  across the screen).
- **Look:** page background and tile fill use the site's paper/ink tokens from `app/globals.css`; tile radius,
  shadow, hover scale, tilt (6°), parallax (14 px) and friction (35) as Framer.

### Images and size

- `public/photos/gallery/`: 50 full-size files (~8.7 MB) + 50 thumbnails (estimated ~2 MB). Grid tiles use
  thumbnails with `loading="lazy"` and `decoding="async"`; the lightbox preloads the next and previous photo.
- Carousel switches to the new files. `public/photos/gallery-stage.webp`, `gallery-speakers.webp` and
  `gallery-panel.webp` become unused and are deleted; `gallery-session` and `gallery-booth` stay (the hero reel uses
  them).
- Alt text: written by hand after viewing every photo (contact sheets generated into the scratchpad).

## Testing

- `tests/gallery-layout.test.ts`: `wrap` handles negatives and multiples of span; every photo appears exactly once
  per horizontal period at mobile, tablet, desktop and 2560 px widths; every column's span covers
  `H + 2 · tallest tile`; tile heights keep each photo's aspect ratio.
- `tests/gallery-data.test.ts`: 50 entries, unique ids, both files exist for each, non-empty alt text, positive
  dimensions.
- `npm run build` (static export) and `npm run lint` pass.
- In a browser at 390×844 and 1440×900: drag, throw, wheel, edge scroll, keyboard pan and Tab, lightbox open,
  arrows, Esc, focus return, reduced-motion emulation, and the home carousel with its new link.

## Out of scope

Video tiles, hover captions (the photos have no titles), filtering or categories, and changes to the hero reel.
