# Gallery Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/gallery/` page showing all 50 photos from the 2025 conference on an infinite, draggable, tilting
canvas (after Framer's Dynamic Gallery Grid), plus a fuller home carousel that links to it.

**Architecture:** A one-off Node script turns the user's compressed webp files into `public/photos/gallery/` (full
size + 640 px thumbnails) and a typed data file. Two pure libs hold the maths: column layout with modular wrap
(`lib/gallery-layout.ts`) and the measured physics (`lib/gallery-motion.ts`). A client grid component runs one rAF
loop that writes `transform` only; a Radix-based lightbox shows full-size photos; a server page composes them.

**Tech Stack:** Next.js 16.3 (App Router, `output: "export"`, unoptimized images), React 19.2, Tailwind 4 +
`app/globals.css`, `radix-ui` 1.6, `sharp` (already in `node_modules` via Next), Vitest 4 (node environment).

**Spec:** `docs/superpowers/specs/2026-10-08-gallery-page-design.md`

## Global Constraints

- No new dependencies. `sharp` is used only by the script, imported from the existing `node_modules`.
- Source photos: `~/Downloads/Picflow Images Oct 8` (50 webp). Full-size files are copied byte-for-byte, not re-encoded.
- Photo id = first 8 characters of the source filename, lowercased (e.g. `00bac653`).
- Thumbnails: 640 px wide, webp quality 72, named `<id>-sm.webp`.
- Tiles keep each photo's aspect ratio. Tile widths 320 / 240 / 170 px, gaps 16 / 14 / 10 (desktop / ≤1024 / ≤640).
- Motion constants exactly as measured: friction 35 (`0.985 − 0.35·0.13` per 60 fps frame), throw clamp ±5000 px/s,
  zero throw if the pointer rested > 90 ms, wheel `v −= delta·4` clamped ±4000, stop below 4 px/s, edge zone 110 px
  at 6 px/frame (mouse only), tilt 6° (`clamp(v/1400)·6 + pointer·6·0.4`), parallax 14 px, easing `1 − 0.86^frames`,
  hover scale 1.03 over `.45s cubic-bezier(.2,.7,.2,1)`, drag-click threshold 6 px.
- Reduced motion: no inertia, tilt or parallax; the wheel moves the plane directly.
- Animate `transform` only; the rAF loop sleeps when nothing moves.
- Code style: match `components/site/gallery.tsx` (refs + one rAF loop, short "why" comments, no comment noise).
- Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code (AGENTS.md).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Pressing Enter on a tile after having dragged the canvas must still open the photo (stale drag distance must not
   swallow keyboard clicks) → `isDragClick` test in Task 4.
2. Panning a very long way in any direction (offsets of ±1,000,000 px) must never show an empty strip → coverage
   test with huge and negative offsets in Task 3.
3. Unusual windows (2560×1440, 844×390 landscape phone, 390×844) must be fully covered with no gaps at the edges
   → coverage test across those sizes in Task 3.
4. A future photo set smaller than the column count (e.g. 3 photos on a wide screen) must not crash or leave empty
   columns → layout test in Task 3.
5. Mouse wheels that report lines or pages, and shift+wheel on a mouse, must pan a sensible distance in the
   expected direction → `wheelPixels` test in Task 4.

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `data/types.ts` | modify | Add `GalleryPhoto` type. |
| `scripts/prep-photos.mjs` | create | Source dir → `public/photos/gallery/*` + `data/gallery.ts`. |
| `public/photos/gallery/` | create | 50 × `<id>.webp` + 50 × `<id>-sm.webp`. |
| `data/gallery.ts` | create (generated, then hand-edited alt + order) | `galleryPhotos: GalleryPhoto[]`. |
| `lib/gallery-layout.ts` | create | `wrap`, `sizingFor`, `buildColumns`, `tilePosition`. |
| `lib/gallery-motion.ts` | create | `MOTION`, `clamp`, `decay`, `edgePush`, `releaseVelocity`, `arrowPush`, `wheelPixels`, `isDragClick`. |
| `components/site/gallery-grid.tsx` | create | The canvas: physics loop, input, tiles. |
| `components/site/gallery-lightbox.tsx` | create | Full-size viewer on Radix Dialog. |
| `components/site/gallery-view.tsx` | create | Open index state; grid + lightbox; focus return. |
| `app/gallery/page.tsx` | create | Page, metadata, header, noscript fallback. |
| `app/globals.css` | modify | `.ggrid*`, `.glb*`, `.gpage*` styles. |
| `components/site/gallery.tsx` | modify | 12 photos from `data/gallery.ts`, "See all" link. |
| `public/photos/gallery-{stage,speakers,panel}.webp` | delete | Unused after the carousel switch. |
| `tests/gallery-data.test.ts`, `tests/gallery-layout.test.ts`, `tests/gallery-motion.test.ts` | create | Tests. |

---

### Task 1: Photo pipeline

**Files:**
- Modify: `data/types.ts` (append)
- Create: `scripts/prep-photos.mjs`, `data/gallery.ts` (generated), `public/photos/gallery/*` (generated)
- Test: `tests/gallery-data.test.ts`

**Interfaces:**
- Produces: `type GalleryPhoto = { id: string; w: number; h: number; alt: string }` exported from `data/types.ts`;
  `galleryPhotos: GalleryPhoto[]` exported from `data/gallery.ts`; files `/photos/gallery/<id>.webp` and
  `/photos/gallery/<id>-sm.webp`.

- [ ] **Step 1: Add the type** — append to `data/types.ts`:

```ts
/** One photo from last year's conference (data/gallery.ts). Files: /photos/gallery/<id>.webp and <id>-sm.webp (640 w). */
export type GalleryPhoto = { id: string; w: number; h: number; alt: string };
```

- [ ] **Step 2: Write the failing data test** — `tests/gallery-data.test.ts`:

```ts
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { galleryPhotos } from "@/data/gallery";

const dir = "public/photos/gallery";

describe("galleryPhotos", () => {
  it("lists all 50 photos once each", () => {
    expect(galleryPhotos).toHaveLength(50);
    expect(new Set(galleryPhotos.map((p) => p.id)).size).toBe(50);
  });
  it("has a full-size file and a thumbnail for every photo, and nothing else", () => {
    const expected = galleryPhotos.flatMap((p) => [`${p.id}.webp`, `${p.id}-sm.webp`]).sort();
    expect(fs.readdirSync(dir).filter((f) => !f.startsWith(".")).sort()).toEqual(expected);
  });
  it("has real dimensions for every photo", () => {
    for (const p of galleryPhotos) {
      expect(p.w).toBeGreaterThan(0);
      expect(p.h).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run tests/gallery-data.test.ts`
Expected: FAIL — cannot resolve `@/data/gallery`.

- [ ] **Step 4: Write the script** — `scripts/prep-photos.mjs`:

```js
// Turns the conference photos into the gallery's files and data:
//   node scripts/prep-photos.mjs "<source dir of .webp files>"
// Each photo is copied as public/photos/gallery/<id>.webp (re-encoded only if EXIF says to rotate it) with a 640 px
// thumbnail <id>-sm.webp beside it, and data/gallery.ts is rewritten. The id is the first 8 characters of the source
// filename. Alt text and order already in data/gallery.ts are kept, so it is safe to re-run.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = process.argv[2];
if (!src || !fs.existsSync(src)) {
  console.error('usage: node scripts/prep-photos.mjs "<source dir>"');
  process.exit(1);
}
const OUT = "public/photos/gallery";
const DATA = "data/gallery.ts";

const old = fs.existsSync(DATA) ? fs.readFileSync(DATA, "utf8") : "";
const body = old.match(/galleryPhotos: GalleryPhoto\[\] = \[\n([\s\S]*?)\n\];/)?.[1] ?? "";
const kept = body ? JSON.parse(`[${body.trim().replace(/,$/, "")}]`) : [];
// Anything after the array (the home carousel's picks) is kept exactly as written.
const tail = old.match(/\n\];\n([\s\S]*)$/)?.[1] ?? "";
const order = new Map(kept.map((p, i) => [p.id, i]));
const alts = new Map(kept.map((p) => [p.id, p.alt]));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const photos = [];
for (const file of fs.readdirSync(src).filter((f) => /\.webp$/i.test(f)).sort()) {
  const from = path.join(src, file);
  const id = file.slice(0, 8).toLowerCase();
  const meta = await sharp(from).metadata();
  const turned = (meta.orientation ?? 1) >= 5;
  if ((meta.orientation ?? 1) > 1) await sharp(from).rotate().webp({ quality: 82 }).toFile(path.join(OUT, `${id}.webp`));
  else fs.copyFileSync(from, path.join(OUT, `${id}.webp`));
  await sharp(from).rotate().resize({ width: 640 }).webp({ quality: 72 }).toFile(path.join(OUT, `${id}-sm.webp`));
  photos.push({ id, w: turned ? meta.height : meta.width, h: turned ? meta.width : meta.height, alt: alts.get(id) ?? "" });
}
if (new Set(photos.map((p) => p.id)).size !== photos.length) throw new Error("two source files share an 8-character prefix");
photos.sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));

fs.writeFileSync(
  DATA,
  `// Generated by scripts/prep-photos.mjs; alt text and order are edited by hand and kept on re-runs.\n` +
    `import type { GalleryPhoto } from "./types";\n\n` +
    `export const galleryPhotos: GalleryPhoto[] = [\n${photos.map((p) => `  ${JSON.stringify(p)},`).join("\n")}\n];\n${tail}`,
);
console.log(`${photos.length} photos → ${OUT}, ${DATA}`);
```

- [ ] **Step 5: Run the script**

Run: `node scripts/prep-photos.mjs "$HOME/Downloads/Picflow Images Oct 8" && du -sh public/photos/gallery && ls public/photos/gallery | wc -l`
Expected: `50 photos → …`, about 10–11 MB, `100` files.

- [ ] **Step 6: Check re-runs keep data** — hand-edit one entry's `alt` to `"x"`, re-run the script, confirm with
`git diff --stat data/gallery.ts` (or `grep '"alt":"x"' data/gallery.ts`) that it is still there, then revert it to `""`.

- [ ] **Step 7: Run the test**

Run: `npx vitest run tests/gallery-data.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add data/types.ts data/gallery.ts scripts/prep-photos.mjs public/photos/gallery tests/gallery-data.test.ts
git commit -m "feat(gallery): photo pipeline for last year's 50 photos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Alt text and order

**Files:**
- Modify: `data/gallery.ts` (alt text and entry order only)
- Test: `tests/gallery-data.test.ts`

**Interfaces:**
- Consumes: `galleryPhotos` from Task 1.
- Produces: every `alt` filled; entries ordered for a good mix.

- [ ] **Step 1: Add the failing alt-text test** — add inside the `describe` in `tests/gallery-data.test.ts`:

```ts
  it("describes every photo for screen readers", () => {
    for (const p of galleryPhotos) expect(p.alt.trim().length, p.id).toBeGreaterThanOrEqual(12);
  });
```

Run: `npx vitest run tests/gallery-data.test.ts` — Expected: FAIL on the first photo's id.

- [ ] **Step 2: Build contact sheets** (scratchpad, not committed). Save as `<scratchpad>/contact.mjs`, run with
`node <scratchpad>/contact.mjs` from the repo root:

```js
// 10 thumbnails per sheet, 5 × 2, each labelled with its id, in data/gallery.ts order.
import fs from "node:fs";
import sharp from "sharp";
const out = process.argv[1].replace(/contact\.mjs$/, "");
const ids = [...fs.readFileSync("data/gallery.ts", "utf8").matchAll(/"id":"(\w+)"/g)].map((m) => m[1]);
for (let s = 0; s * 10 < ids.length; s++) {
  const cells = await Promise.all(ids.slice(s * 10, s * 10 + 10).map(async (id, i) => {
    const img = await sharp(`public/photos/gallery/${id}-sm.webp`).resize(400, 300, { fit: "contain", background: "#fff" }).toBuffer();
    const label = Buffer.from(`<svg width="400" height="28"><rect width="400" height="28" fill="#000"/><text x="8" y="20" font-size="18" fill="#fff" font-family="monospace">${id}</text></svg>`);
    return [{ input: img, left: (i % 5) * 400, top: Math.floor(i / 5) * 330 }, { input: label, left: (i % 5) * 400, top: Math.floor(i / 5) * 330 + 300 }];
  }));
  await sharp({ create: { width: 2000, height: 660, channels: 3, background: "#fff" } }).composite(cells.flat()).png().toFile(`${out}sheet-${s + 1}.png`);
}
```

Expected: `sheet-1.png` … `sheet-5.png`.

- [ ] **Step 3: Look at every sheet and write the alt text** — Read each sheet image. For each id write one
plain sentence (12–140 characters) of what is visible: who (speaker, panel, attendees, volunteers — no names
unless they're on a visible slide or sign), doing what, where (stage, lobby, bazaar, lawn, tent). No "image of" or
"photo of". If a full-size detail is unclear, Read `public/photos/gallery/<id>.webp`.

- [ ] **Step 4: Reorder entries** — move whole lines in `data/gallery.ts` so neighbours differ: no two stage/lectern
shots in a row, portraits spread out (roughly every 8th place), and the strongest wide stage shot first. Keep one
entry per line exactly as generated (the script's re-run parser depends on it).

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/gallery-data.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add data/gallery.ts tests/gallery-data.test.ts
git commit -m "feat(gallery): alt text and running order for every photo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Column layout with wrap

**Files:**
- Create: `lib/gallery-layout.ts`
- Test: `tests/gallery-layout.test.ts`

**Interfaces:**
- Produces:
  - `wrap(n: number, span: number): number` — `n mod span` in `[0, span)`.
  - `type Sizing = { tileW: number; gap: number }`; `sizingFor(viewW: number): Sizing`.
  - `type Tile = { photo: number; col: number; baseY: number; h: number; copy: number }` (`copy > 0` = repeat,
    rendered `aria-hidden` and not focusable).
  - `type Layout = { tiles: Tile[]; cols: number; cellW: number; spanX: number; spans: number[]; tileW: number; gap: number; maxH: number }`.
  - `buildColumns(photos: { w: number; h: number }[], viewW: number, viewH: number, sizing: Sizing): Layout`.
  - `tilePosition(tile: Tile, layout: Layout, offsetX: number, offsetY: number): { x: number; y: number }` —
    top-left of the tile's cell; the tile is drawn at `+gap/2`.

- [ ] **Step 1: Write the failing tests** — `tests/gallery-layout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildColumns, sizingFor, tilePosition, wrap, type Layout } from "@/lib/gallery-layout";

// 50 photos like the real set: mostly 3:2 landscape, every 8th a 2:3 portrait.
const photos = Array.from({ length: 50 }, (_, i) => (i % 8 === 0 ? { w: 1536, h: 2304 } : { w: 2304, h: 1536 }));
const views: [number, number][] = [[390, 844], [844, 390], [800, 1100], [1440, 900], [2560, 1440]];
const offsets: [number, number][] = [[0, 0], [123.4, -77.7], [-5000, 2500], [1e6, -1e6], [-987654.3, 456789.1]];

/** True when no point of the w×h viewport is more than one gap away from a tile, at this pan offset. */
function covers(L: Layout, w: number, h: number, ox: number, oy: number) {
  const slack = L.gap + 0.01;
  const xs = new Set<number>();
  for (let c = 0; c < L.cols; c++) {
    const col = L.tiles.filter((t) => t.col === c).map((t) => ({ ...tilePosition(t, L, ox, oy), h: t.h }));
    const x = col[0].x;
    xs.add(x);
    if (x + L.cellW < 0 || x > w) continue;
    col.sort((a, b) => a.y - b.y);
    if (col[0].y > 0) return false;
    let reach = col[0].y;
    for (const t of col) {
      if (t.y > reach + slack) return false;
      reach = Math.max(reach, t.y + t.h);
    }
    if (reach < h) return false;
  }
  const sorted = [...xs].sort((a, b) => a - b);
  if (sorted[0] > 0) return false;
  for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] > L.cellW + 0.01) return false;
  return sorted[sorted.length - 1] + L.cellW >= w;
}

describe("wrap", () => {
  it("keeps any number inside [0, span)", () => {
    expect(wrap(25, 10)).toBe(5);
    expect(wrap(-1, 10)).toBe(9);
    expect(wrap(10, 10)).toBe(0);
    expect(wrap(-30, 10)).toBe(0);
    expect(wrap(-1e9 - 3, 10)).toBe(7);
  });
});

describe("sizingFor", () => {
  it("uses Framer-like tile widths per breakpoint", () => {
    expect(sizingFor(390)).toEqual({ tileW: 170, gap: 10 });
    expect(sizingFor(640)).toEqual({ tileW: 170, gap: 10 });
    expect(sizingFor(1024)).toEqual({ tileW: 240, gap: 14 });
    expect(sizingFor(1440)).toEqual({ tileW: 320, gap: 16 });
  });
});

describe("buildColumns", () => {
  for (const [w, h] of views) {
    const L = buildColumns(photos, w, h, sizingFor(w));
    it(`shows every photo exactly once per period at ${w}×${h}`, () => {
      const firsts = L.tiles.filter((t) => t.copy === 0).map((t) => t.photo).sort((a, b) => a - b);
      expect(firsts).toEqual(photos.map((_, i) => i));
    });
    it(`leaves no gaps at ${w}×${h}, however far it is panned`, () => {
      expect(L.spanX).toBeGreaterThanOrEqual(w + 3 * L.cellW);
      for (const s of L.spans) expect(s).toBeGreaterThanOrEqual(h + 2 * L.maxH);
      for (const [ox, oy] of offsets) expect(covers(L, w, h, ox, oy), `offset ${ox},${oy}`).toBe(true);
    });
  }
  it("keeps each photo's aspect ratio", () => {
    const L = buildColumns(photos, 1440, 900, sizingFor(1440));
    for (const t of L.tiles) expect(Math.abs(t.h - (L.tileW * photos[t.photo].h) / photos[t.photo].w)).toBeLessThanOrEqual(0.5);
  });
  it("fills every column when there are fewer photos than columns", () => {
    const few = photos.slice(0, 3);
    const L = buildColumns(few, 2560, 1440, sizingFor(2560));
    expect(L.cols).toBeGreaterThan(3);
    for (let c = 0; c < L.cols; c++) expect(L.tiles.some((t) => t.col === c)).toBe(true);
    expect(L.tiles.filter((t) => t.copy === 0).map((t) => t.photo).sort()).toEqual([0, 1, 2]);
    expect(covers(L, 2560, 1440, -4321, 8765)).toBe(true);
  });
  it("returns an empty layout for no photos", () => {
    expect(buildColumns([], 1440, 900, sizingFor(1440)).tiles).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/gallery-layout.test.ts`
Expected: FAIL — cannot resolve `@/lib/gallery-layout`.

- [ ] **Step 3: Implement** — `lib/gallery-layout.ts`:

```ts
// Layout for the gallery canvas (components/site/gallery-grid.tsx), after Framer's Dynamic Gallery Grid but with
// tiles that keep their photo's shape. The plane is a ring of equal-width columns; photos are dealt round-robin so
// each appears once per lap, and each column stacks its photos at their own heights and wraps on its own span.
// Positions are `mod(base + offset, span)`, so a few screens' worth of tiles cover an endless plane.

export type Sizing = { tileW: number; gap: number };
export type Tile = { photo: number; col: number; baseY: number; h: number; copy: number };
export type Layout = { tiles: Tile[]; cols: number; cellW: number; spanX: number; spans: number[]; tileW: number; gap: number; maxH: number };

export const wrap = (n: number, span: number) => ((n % span) + span) % span;

export function sizingFor(viewW: number): Sizing {
  if (viewW <= 640) return { tileW: 170, gap: 10 };
  if (viewW <= 1024) return { tileW: 240, gap: 14 };
  return { tileW: 320, gap: 16 };
}

export function buildColumns(photos: { w: number; h: number }[], viewW: number, viewH: number, { tileW, gap }: Sizing): Layout {
  const cellW = tileW + gap;
  const cols = Math.max(4, Math.ceil(viewW / cellW) + 3);
  const empty = { tiles: [], cols, cellW, spanX: cols * cellW, spans: [], tileW, gap, maxH: 0 };
  if (!photos.length) return empty;
  const heights = photos.map((p) => (tileW * p.h) / p.w);
  const maxH = Math.max(...heights) + gap;
  const tiles: Tile[] = [];
  const spans: number[] = [];
  for (let col = 0; col < cols; col++) {
    const deal: number[] = [];
    for (let i = col; i < photos.length; i += cols) deal.push(i);
    // A column past the end of a short set borrows a photo; it counts as a repeat.
    const seq = deal.length ? deal : [col % photos.length];
    let copy = deal.length ? 0 : 1;
    const column: Tile[] = [];
    let y = 0;
    // Repeat the column's photos until it is a screen plus two of the tallest tiles: enough that wrapping never shows.
    do {
      for (const photo of seq) {
        column.push({ photo, col, baseY: y, h: heights[photo], copy });
        y += heights[photo] + gap;
      }
      copy++;
    } while (y < viewH + 2 * maxH);
    // Stagger each column's seam so the rows never line up.
    const shift = ((col * 0.37) % 1) * y;
    for (const t of column) t.baseY += shift;
    tiles.push(...column);
    spans.push(y);
  }
  return { tiles, cols, cellW, spanX: cols * cellW, spans, tileW, gap, maxH };
}

export function tilePosition(tile: Tile, layout: Layout, offsetX: number, offsetY: number) {
  return {
    x: wrap(tile.col * layout.cellW + offsetX, layout.spanX) - layout.cellW * 1.5,
    y: wrap(tile.baseY + offsetY, layout.spans[tile.col]) - layout.maxH * 1.5,
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/gallery-layout.test.ts`
Expected: PASS (all). If a coverage case fails, the fix belongs in `buildColumns` (span or column count), not in
the test's slack.

- [ ] **Step 5: Commit**

```bash
git add lib/gallery-layout.ts tests/gallery-layout.test.ts
git commit -m "feat(gallery): wrapping column layout for the canvas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Motion helpers

**Files:**
- Create: `lib/gallery-motion.ts`
- Test: `tests/gallery-motion.test.ts`

**Interfaces:**
- Produces:
  - `MOTION = { friction: 35, throwMax: 5000, wheelMax: 4000, restMs: 90, stopBelow: 4, edgeZone: 110, edgeSpeed: 6, tilt: 6, parallax: 14, keyPush: 900, dragClick: 6 }`
  - `clamp(v: number, lo = -1, hi = 1): number`
  - `decay(frames: number): number` — velocity multiplier for `frames` 60 fps frames of coasting.
  - `edgePush(pos: number, size: number, zone = MOTION.edgeZone): number` — `1` at the start edge, `-1` at the end, `0` outside the zones.
  - `releaseVelocity(v: number, restMs: number): number`
  - `arrowPush(key: string): [number, number] | null` — direction to add to the plane's velocity.
  - `wheelPixels(e: { deltaX: number; deltaY: number; deltaMode: number; shiftKey: boolean }, pageH: number): [number, number]`
  - `isDragClick(detail: number, moved: number): boolean`

- [ ] **Step 1: Write the failing tests** — `tests/gallery-motion.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MOTION, arrowPush, clamp, decay, edgePush, isDragClick, releaseVelocity, wheelPixels } from "@/lib/gallery-motion";

describe("decay", () => {
  it("matches Framer's friction 35 per frame and compounds over frames", () => {
    expect(decay(1)).toBeCloseTo(0.985 - 0.35 * 0.13, 10);
    expect(decay(2)).toBeCloseTo(decay(1) ** 2, 10);
    expect(decay(0)).toBe(1);
  });
});

describe("clamp", () => {
  it("defaults to -1..1", () => {
    expect(clamp(3)).toBe(1);
    expect(clamp(-3)).toBe(-1);
    expect(clamp(0.2)).toBe(0.2);
    expect(clamp(9000, -5000, 5000)).toBe(5000);
  });
});

describe("edgePush", () => {
  it("pushes hardest at the edges and not at all in the middle", () => {
    expect(edgePush(0, 1000)).toBe(1);
    expect(edgePush(55, 1000)).toBeCloseTo(0.5);
    expect(edgePush(110, 1000)).toBe(0);
    expect(edgePush(500, 1000)).toBe(0);
    expect(edgePush(1000, 1000)).toBe(-1);
  });
});

describe("releaseVelocity", () => {
  it("throws only if the pointer was still moving, clamped", () => {
    expect(releaseVelocity(1200, 20)).toBe(1200);
    expect(releaseVelocity(1200, 91)).toBe(0);
    expect(releaseVelocity(-99999, 0)).toBe(-MOTION.throwMax);
  });
});

describe("arrowPush", () => {
  it("moves the plane against the arrow so the view travels with it", () => {
    expect(arrowPush("ArrowRight")).toEqual([-1, 0]);
    expect(arrowPush("ArrowLeft")).toEqual([1, 0]);
    expect(arrowPush("ArrowDown")).toEqual([0, -1]);
    expect(arrowPush("ArrowUp")).toEqual([0, 1]);
    expect(arrowPush("Enter")).toBeNull();
  });
});

describe("wheelPixels", () => {
  const e = (deltaX: number, deltaY: number, deltaMode = 0, shiftKey = false) => ({ deltaX, deltaY, deltaMode, shiftKey });
  it("passes pixel deltas through", () => expect(wheelPixels(e(3, -40), 900)).toEqual([3, -40]));
  it("turns lines into 16 px and pages into the page height", () => {
    expect(wheelPixels(e(0, 3, 1), 900)).toEqual([0, 48]);
    expect(wheelPixels(e(0, 1, 2), 900)).toEqual([0, 900]);
  });
  it("turns shift+wheel on a mouse into a sideways pan", () => {
    expect(wheelPixels(e(0, 100, 0, true), 900)).toEqual([100, 0]);
    expect(wheelPixels(e(20, 100, 0, true), 900)).toEqual([20, 100]);
  });
});

describe("isDragClick", () => {
  it("ignores the click that ends a drag", () => expect(isDragClick(1, 40)).toBe(true));
  it("counts a click with a tiny wobble", () => expect(isDragClick(1, 4)).toBe(false));
  it("always counts keyboard clicks, even after an earlier drag", () => expect(isDragClick(0, 400)).toBe(false));
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/gallery-motion.test.ts`
Expected: FAIL — cannot resolve `@/lib/gallery-motion`.

- [ ] **Step 3: Implement** — `lib/gallery-motion.ts`:

```ts
// Physics for the gallery canvas, measured from Framer's Dynamic Gallery Grid (see
// docs/superpowers/specs/2026-10-08-gallery-page-design.md). Velocities are px/s; "frames" are 60 fps frames.
export const MOTION = {
  friction: 35, throwMax: 5000, wheelMax: 4000, restMs: 90, stopBelow: 4,
  edgeZone: 110, edgeSpeed: 6, tilt: 6, parallax: 14, keyPush: 900, dragClick: 6,
};

export const clamp = (v: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, v));

export const decay = (frames: number) => (0.985 - (MOTION.friction / 100) * 0.13) ** frames;

export function edgePush(pos: number, size: number, zone = MOTION.edgeZone) {
  if (pos < zone) return 1 - Math.max(0, pos) / zone;
  if (pos > size - zone) return -(1 - Math.max(0, size - pos) / zone);
  return 0;
}

// A pointer that rested before letting go shouldn't throw the plane.
export const releaseVelocity = (v: number, restMs: number) => (restMs > MOTION.restMs ? 0 : clamp(v, -MOTION.throwMax, MOTION.throwMax));

const ARROWS: Record<string, [number, number]> = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
export const arrowPush = (key: string) => ARROWS[key] ?? null;

export function wheelPixels(e: { deltaX: number; deltaY: number; deltaMode: number; shiftKey: boolean }, pageH: number): [number, number] {
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? pageH : 1;
  const dx = e.deltaX * unit, dy = e.deltaY * unit;
  return e.shiftKey && !dx ? [dy, 0] : [dx, dy];
}

// Keyboard clicks have detail 0, so a drag earlier on can't swallow them.
export const isDragClick = (detail: number, moved: number) => detail > 0 && moved > MOTION.dragClick;
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/gallery-motion.test.ts`
Expected: PASS. Note `wheelPixels(e(0, 1, 2), 900)` is `[0, 900]` and `edgePush(1000, 1000)` is `-1`.

- [ ] **Step 5: Commit**

```bash
git add lib/gallery-motion.ts tests/gallery-motion.test.ts
git commit -m "feat(gallery): measured physics helpers for the canvas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Lightbox

**Files:**
- Create: `components/site/gallery-lightbox.tsx`
- Modify: `app/globals.css` (append `.glb*` block before the `@media (prefers-reduced-motion: reduce)` block)

**Interfaces:**
- Consumes: `GalleryPhoto` (Task 1).
- Produces: `GalleryLightbox({ photos, index, onIndex, onClose, returnFocus }: { photos: GalleryPhoto[]; index: number | null; onIndex: (i: number) => void; onClose: () => void; returnFocus: () => void })`.
  Open when `index !== null`.

- [ ] **Step 1: Read the docs** — `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`
(check `unoptimized` export behaviour and `priority`/`preload` naming in this version; use whatever this version
documents for eager loading).

- [ ] **Step 2: Write the component** — `components/site/gallery-lightbox.tsx`:

```tsx
"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { GalleryPhoto } from "@/data/types";

// Full-size viewer for the gallery page, styled after Framer's: dark blurred backdrop, a 01 / 50 counter, arrows,
// ←/→ keys and horizontal swipe. Radix gives Esc, the focus trap and the scroll lock. Clicking the dark area closes it.
export function GalleryLightbox({ photos, index, onIndex, onClose, returnFocus }: {
  photos: GalleryPhoto[]; index: number | null; onIndex: (i: number) => void; onClose: () => void; returnFocus: () => void;
}) {
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const n = photos.length;
  const go = (d: 1 | -1) => { if (index !== null) onIndex((index + d + n) % n); };

  // Warm the neighbours so arrows feel instant.
  useEffect(() => {
    if (index === null) return;
    for (const d of [1, -1]) new window.Image().src = `/photos/gallery/${photos[(index + d + n) % n].id}.webp`;
  }, [index, photos, n]);

  const p = index === null ? null : photos[index];
  const pad = (i: number) => String(i).padStart(2, "0");
  const arrow = (d: string) => <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={d} /></svg>;
  return (
    <DialogPrimitive.Root open={p !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="glb-backdrop" />
        <DialogPrimitive.Content
          className="glb"
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => { e.preventDefault(); returnFocus(); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); go(e.key === "ArrowRight" ? 1 : -1); }
          }}
          onPointerDown={(e) => { swipe.current = { x: e.clientX, y: e.clientY }; swiped.current = false; }}
          onPointerUp={(e) => {
            const s = swipe.current;
            swipe.current = null;
            if (!s) return;
            const dx = e.clientX - s.x;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y)) { swiped.current = true; go(dx < 0 ? 1 : -1); }
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !swiped.current) onClose(); }}
        >
          {p && index !== null && (
            <>
              <DialogPrimitive.Title className="sr-only">Photo {index + 1} of {n}</DialogPrimitive.Title>
              <p className="glb-count" aria-hidden="true">{pad(index + 1)} / {pad(n)}</p>
              <DialogPrimitive.Close className="glb-btn glb-close" aria-label="Close">{arrow("M6 6l12 12M18 6L6 18")}</DialogPrimitive.Close>
              <figure key={p.id} className="glb-media">
                <Image src={`/photos/gallery/${p.id}.webp`} alt={p.alt} width={p.w} height={p.h} sizes="90vw" priority draggable={false} />
                <figcaption className="sr-only">{p.alt}</figcaption>
              </figure>
              {n > 1 && (
                <>
                  <button type="button" className="glb-btn glb-prev" aria-label="Previous photo" onClick={() => go(-1)}>{arrow("M15 5l-7 7 7 7")}</button>
                  <button type="button" className="glb-btn glb-next" aria-label="Next photo" onClick={() => go(1)}>{arrow("M9 5l7 7-7 7")}</button>
                </>
              )}
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

(If Step 1 shows `priority` is deprecated in favour of `preload`, use `preload` instead.)

- [ ] **Step 3: Add the styles** — append to `app/globals.css`, just before the
`@media (prefers-reduced-motion: reduce)` block:

```css
/* Gallery lightbox (components/site/gallery-lightbox.tsx), after Framer's: dark blurred backdrop, photo rises in. */
.glb-backdrop { position: fixed; inset: 0; z-index: 60; background: rgb(12 12 14 / 0.9); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); animation: glb-fade .3s ease both; }
.glb { position: fixed; inset: 0; z-index: 61; display: flex; align-items: center; justify-content: center; padding: 72px 16px 32px; color: #fff; outline: none; touch-action: pan-y; }
.glb-media { margin: 0; animation: glb-rise .4s cubic-bezier(.2,.7,.2,1) both; }
.glb-media img { display: block; width: auto; height: auto; max-width: min(90vw, 1400px); max-height: 80vh; object-fit: contain; border-radius: 12px; user-select: none; }
.glb-count { position: absolute; top: 26px; left: 24px; font-size: 13px; letter-spacing: .06em; opacity: .8; font-variant-numeric: tabular-nums; }
.glb-btn { position: absolute; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .35); background: rgb(255 255 255 / .06); color: #fff; outline: none; transition: background-color .2s; }
.glb-btn:hover { background: rgb(255 255 255 / .18); }
.glb-btn:focus-visible { box-shadow: 0 0 0 2px #fff; }
.glb-close { top: 16px; right: 16px; }
.glb-prev, .glb-next { top: 50%; margin-top: -22px; }
.glb-prev { left: 16px; }
.glb-next { right: 16px; }
@media (max-width: 640px) { .glb-prev, .glb-next { top: auto; bottom: 24px; margin-top: 0; } }
@keyframes glb-fade { from { opacity: 0; } }
@keyframes glb-rise { from { opacity: 0; transform: translateY(12px) scale(.98); } }
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint components/site/gallery-lightbox.tsx`
Expected: no errors. (Browser checks happen in Task 6 once the page exists.)

- [ ] **Step 5: Commit**

```bash
git add components/site/gallery-lightbox.tsx app/globals.css
git commit -m "feat(gallery): full-size lightbox

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Canvas, view and page

**Files:**
- Create: `components/site/gallery-grid.tsx`, `components/site/gallery-view.tsx`, `app/gallery/page.tsx`
- Modify: `app/globals.css` (append `.ggrid*` and `.gpage*` before the reduced-motion block)

**Interfaces:**
- Consumes: `buildColumns`, `sizingFor`, `tilePosition`, `Layout` (Task 3); `MOTION`, `clamp`, `decay`, `edgePush`,
  `releaseVelocity`, `arrowPush`, `wheelPixels`, `isDragClick` (Task 4); `GalleryLightbox` (Task 5);
  `galleryPhotos` (Tasks 1–2).
- Produces: `GalleryGrid({ photos, onOpen }: { photos: GalleryPhoto[]; onOpen: (index: number, tile: HTMLButtonElement) => void })`,
  `GalleryView({ photos }: { photos: GalleryPhoto[] })`, route `/gallery/`.

- [ ] **Step 1: Read the docs** — `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`
(static `metadata` export) and the static-export guide under `01-app/02-guides/` (grep `static-exports`), to confirm
a plain `app/gallery/page.tsx` exports to `out/gallery/index.html` with `trailingSlash: true`.

- [ ] **Step 2: Write the grid** — `components/site/gallery-grid.tsx`:

```tsx
"use client";
import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GalleryPhoto } from "@/data/types";
import { buildColumns, sizingFor, tilePosition, type Layout } from "@/lib/gallery-layout";
import { MOTION, arrowPush, clamp, decay, edgePush, isDragClick, releaseVelocity, wheelPixels } from "@/lib/gallery-motion";

// The gallery page's canvas, after Framer's Dynamic Gallery Grid: an endless plane you drag, throw, wheel or arrow
// around, on a layer that tilts with the motion and the pointer. Tiles are placed only by translate3d (see
// lib/gallery-layout.ts) and one rAF loop runs only while something moves. With reduced motion there is no inertia,
// tilt or parallax.
export function GalleryGrid({ photos, onOpen }: { photos: GalleryPhoto[]; onOpen: (index: number, tile: HTMLButtonElement) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const layoutRef = useRef<Layout | null>(null);
  const engine = useRef<{ paint: () => void; wake: () => void } | null>(null);
  const st = useRef({ x: 0, y: 0, vx: 0, vy: 0, drag: false, lastX: 0, lastY: 0, lastT: 0, moved: 0, aimX: 0, aimY: 0, ptrX: 0, ptrY: 0, tiltX: 0, tiltY: 0, edgeX: 0, edgeY: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const layout = useMemo(() => (size.w && size.h ? buildColumns(photos, size.w, size.h, sizingFor(size.w)) : null), [photos, size.w, size.h]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      setSize((s) => (Math.round(s.w) === Math.round(w) && Math.round(s.h) === Math.round(h) ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    layoutRef.current = layout;
    engine.current?.paint();
  }, [layout]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const s = st.current;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = 0;

    const paint = () => {
      const L = layoutRef.current;
      if (!L) return;
      const px = -s.ptrX * MOTION.parallax, py = -s.ptrY * MOTION.parallax;
      L.tiles.forEach((t, i) => {
        const node = tiles.current[i];
        if (!node) return;
        const p = tilePosition(t, L, s.x, s.y);
        node.style.transform = `translate3d(${p.x + L.gap / 2 + px}px, ${p.y + L.gap / 2 + py}px, 0)`;
      });
      if (layer.current) layer.current.style.transform = `rotateX(${s.tiltY}deg) rotateY(${s.tiltX}deg)`;
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const f = dt * 60;
      const reduced = still.matches;
      let moving = s.drag;
      if (s.drag) {
        if (performance.now() - s.lastT > 60) { s.vx *= 0.8 ** f; s.vy *= 0.8 ** f; }
      } else if (reduced) {
        s.vx = 0; s.vy = 0;
      } else {
        s.x += s.vx * dt; s.y += s.vy * dt;
        const k = decay(f);
        s.vx *= k; s.vy *= k;
        if (Math.abs(s.vx) < MOTION.stopBelow) s.vx = 0;
        if (Math.abs(s.vy) < MOTION.stopBelow) s.vy = 0;
        if (s.vx || s.vy) moving = true;
        if (s.edgeX || s.edgeY) { s.x += s.edgeX * MOTION.edgeSpeed * f; s.y += s.edgeY * MOTION.edgeSpeed * f; moving = true; }
      }
      const ease = 1 - 0.86 ** f;
      const ax = reduced ? 0 : s.aimX, ay = reduced ? 0 : s.aimY;
      s.ptrX += (ax - s.ptrX) * ease; s.ptrY += (ay - s.ptrY) * ease;
      const tx = reduced ? 0 : clamp(s.vx / 1400) * MOTION.tilt + s.ptrX * MOTION.tilt * 0.4;
      const ty = reduced ? 0 : clamp(-s.vy / 1400) * MOTION.tilt - s.ptrY * MOTION.tilt * 0.4;
      s.tiltX += (tx - s.tiltX) * ease; s.tiltY += (ty - s.tiltY) * ease;
      if (Math.abs(ax - s.ptrX) > 0.002 || Math.abs(ay - s.ptrY) > 0.002 || Math.abs(tx - s.tiltX) > 0.02 || Math.abs(ty - s.tiltY) > 0.02) moving = true;
      paint();
      if (moving) frame = requestAnimationFrame(tick);
      else last = 0;
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
    engine.current = { paint, wake };

    const drag = (e: PointerEvent) => {
      const now = performance.now();
      const dx = e.clientX - s.lastX, dy = e.clientY - s.lastY, dt = Math.max(1, now - s.lastT);
      s.x += dx; s.y += dy;
      s.moved += Math.abs(dx) + Math.abs(dy);
      s.vx = s.vx * 0.6 + (dx / dt) * 1000 * 0.4;
      s.vy = s.vy * 0.6 + (dy / dt) * 1000 * 0.4;
      s.lastX = e.clientX; s.lastY = e.clientY; s.lastT = now;
      wake();
    };
    const release = () => {
      s.drag = false;
      el.style.cursor = "";
      const rest = performance.now() - s.lastT;
      s.vx = releaseVelocity(s.vx, rest); s.vy = releaseVelocity(s.vy, rest);
      window.removeEventListener("pointermove", drag);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      wake();
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      Object.assign(s, { drag: true, moved: 0, vx: 0, vy: 0, edgeX: 0, edgeY: 0, lastX: e.clientX, lastY: e.clientY, lastT: performance.now() });
      el.style.cursor = "grabbing";
      window.addEventListener("pointermove", drag);
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
      wake();
    };
    const hover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      s.aimX = clamp((x / r.width) * 2 - 1); s.aimY = clamp((y / r.height) * 2 - 1);
      const edges = !s.drag && e.pointerType === "mouse";
      s.edgeX = edges ? edgePush(x, r.width) : 0;
      s.edgeY = edges ? edgePush(y, r.height) : 0;
      wake();
    };
    const leave = () => { s.aimX = 0; s.aimY = 0; s.edgeX = 0; s.edgeY = 0; wake(); };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const [dx, dy] = wheelPixels(e, el.clientHeight);
      if (still.matches) { s.x -= dx; s.y -= dy; paint(); return; }
      s.vx = clamp(s.vx - dx * 4, -MOTION.wheelMax, MOTION.wheelMax);
      s.vy = clamp(s.vy - dy * 4, -MOTION.wheelMax, MOTION.wheelMax);
      wake();
    };
    const key = (e: KeyboardEvent) => {
      const push = arrowPush(e.key);
      if (!push) return;
      e.preventDefault();
      if (still.matches) { s.x += push[0] * 160; s.y += push[1] * 160; paint(); return; }
      s.vx += push[0] * MOTION.keyPush; s.vy += push[1] * MOTION.keyPush;
      wake();
    };
    // A drag that ends on a tile must not open it.
    const click = (e: MouseEvent) => { if (isDragClick(e.detail, s.moved)) { e.preventDefault(); e.stopPropagation(); } };
    // Tabbing to a tile off screen (or under the header) pans it into view.
    const focus = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (t === el) return;
      const r = t.getBoundingClientRect(), v = el.getBoundingClientRect(), m = 24, top = 80;
      const dx = r.left < v.left + m ? v.left + m - r.left : r.right > v.right - m ? v.right - m - r.right : 0;
      const dy = r.top < v.top + top ? v.top + top - r.top : r.bottom > v.bottom - m ? v.bottom - m - r.bottom : 0;
      if (!dx && !dy) return;
      s.x += dx; s.y += dy; s.vx = 0; s.vy = 0;
      paint();
    };
    const noDrag = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", hover);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("keydown", key);
    el.addEventListener("click", click, true);
    el.addEventListener("focusin", focus);
    el.addEventListener("dragstart", noDrag);
    paint();
    return () => {
      cancelAnimationFrame(frame);
      engine.current = null;
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", hover);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("keydown", key);
      el.removeEventListener("click", click, true);
      el.removeEventListener("focusin", focus);
      el.removeEventListener("dragstart", noDrag);
      window.removeEventListener("pointermove", drag);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  return (
    <div ref={stage} className="ggrid" tabIndex={0} role="region" aria-label="Photo gallery. Drag, scroll or use the arrow keys to move around; select a photo to enlarge it.">
      <div ref={layer} className="ggrid-layer">
        {layout?.tiles.map((t, i) => {
          const p = photos[t.photo];
          return (
            <button
              key={`${layout.cols}-${i}`}
              ref={(n) => { tiles.current[i] = n; }}
              type="button"
              className="ggrid-tile"
              style={{ width: layout.tileW, height: t.h }}
              tabIndex={t.copy ? -1 : 0}
              aria-hidden={t.copy ? true : undefined}
              aria-label={`Enlarge: ${p.alt}`}
              onClick={(e) => onOpen(t.photo, e.currentTarget)}
            >
              <span className="ggrid-face">
                <Image src={`/photos/gallery/${p.id}-sm.webp`} alt="" width={p.w} height={p.h} sizes={`${layout.tileW}px`} loading="lazy" draggable={false} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write the view** — `components/site/gallery-view.tsx`:

```tsx
"use client";
import { useRef, useState } from "react";
import type { GalleryPhoto } from "@/data/types";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { GalleryLightbox } from "@/components/site/gallery-lightbox";

// The gallery page's interactive part: the canvas, and the lightbox for whichever photo was opened.
export function GalleryView({ photos }: { photos: GalleryPhoto[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <GalleryGrid photos={photos} onOpen={(i, tile) => { opener.current = tile; setIndex(i); }} />
      <GalleryLightbox photos={photos} index={index} onIndex={setIndex} onClose={() => setIndex(null)} returnFocus={() => opener.current?.focus()} />
    </>
  );
}
```

- [ ] **Step 4: Write the page** — `app/gallery/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { GalleryView } from "@/components/site/gallery-view";
import { galleryPhotos } from "@/data/gallery";

export const metadata: Metadata = {
  title: "Gallery — Tarbiyyah Conference 2025, The Art of Adab",
  description: `All ${galleryPhotos.length} photos from last year's Tarbiyyah Conference, The Art of Adab, presented by MSA at UC San Diego.`,
};

// Every photo from last year on one endless canvas (components/site/gallery-grid.tsx), under a slim header.
// Only the back link takes pointer events, so the canvas can be dragged from anywhere else.
export default function GalleryPage() {
  return (
    <main className="gpage">
      <h1 className="sr-only">Photos from the 2025 Tarbiyyah Conference, The Art of Adab</h1>
      <GalleryView photos={galleryPhotos} />
      <header className="gpage-bar">
        <Link href="/" className="qe-pill">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
          Tarbiyyah 2026
        </Link>
        <p className="gpage-title">The Art of Adab · 2025</p>
        <p className="gpage-count">{galleryPhotos.length} photos</p>
      </header>
      <noscript>
        <ul className="gpage-fallback">
          {galleryPhotos.map((p) => (
            <li key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- no-JS fallback */}
              <a href={`/photos/gallery/${p.id}.webp`}><img src={`/photos/gallery/${p.id}-sm.webp`} alt={p.alt} width={p.w} height={p.h} loading="lazy" /></a>
            </li>
          ))}
        </ul>
      </noscript>
    </main>
  );
}
```

- [ ] **Step 5: Add the styles** — append to `app/globals.css`, just before the reduced-motion block:

```css
/* Gallery page (app/gallery/page.tsx): a full-screen canvas under a header that fades into the paper. */
.gpage { position: fixed; inset: 0; background: var(--paper); }
.gpage-bar { position: absolute; inset: 0 0 auto; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px clamp(16px, 3vw, 28px) 28px; background: linear-gradient(var(--paper) 45%, transparent); pointer-events: none; }
.gpage-bar a { pointer-events: auto; }
.gpage-title { font-family: var(--font-instrument), serif; font-size: clamp(1.1rem, 2.2vw, 1.6rem); color: var(--ink-deep); }
.gpage-count { font-size: .85rem; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }
@media (max-width: 640px) { .gpage-count { display: none; } }
.gpage-fallback { position: absolute; inset: 72px 0 0; overflow: auto; columns: 3 220px; column-gap: 12px; padding: 0 16px 24px; list-style: none; }
.gpage-fallback li { break-inside: avoid; margin-bottom: 12px; }
.gpage-fallback img { width: 100%; height: auto; border-radius: 10px; }

/* Gallery canvas (components/site/gallery-grid.tsx), after Framer's Dynamic Gallery Grid: tiles placed only by
   translate3d on a layer that tilts in 3D. overflow: clip so focusing a tile can never scroll the stage. */
.ggrid { position: absolute; inset: 0; overflow: clip; perspective: 1400px; touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; outline: none; }
.ggrid:focus-visible { box-shadow: inset 0 0 0 3px var(--ink-deep); }
.ggrid-layer { position: absolute; inset: 0; transform-style: preserve-3d; transform-origin: 50% 50%; will-change: transform; }
.ggrid-tile { position: absolute; left: 0; top: 0; padding: 0; border: 0; background: none; cursor: inherit; outline: none; will-change: transform; }
.ggrid-face { display: block; width: 100%; height: 100%; border-radius: 10px; overflow: hidden; background: var(--paper-shade);
  box-shadow: 0 4px 14px rgb(31 79 92 / 0.14); transition: transform .45s cubic-bezier(.2,.7,.2,1); }
.ggrid-face img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
@media (hover: hover) { .ggrid-tile:hover .ggrid-face { transform: scale(1.03); } }
.ggrid-tile:focus-visible .ggrid-face { transform: scale(1.03); outline: 3px solid var(--ink-deep); outline-offset: 3px; }
```

- [ ] **Step 6: Type-check, lint, test**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no errors; all tests pass. If `react-hooks` lint rules flag the ref writes, keep refs written only in
effects and callbacks as above (not during render).

- [ ] **Step 7: Check it in a browser** — `npm run dev`, open `http://localhost:3000/gallery/` at 1440×900 and
390×844 (Playwright). Verify and note the result of each:
  1. The canvas fills the screen, no empty strips; header readable; all tiles uncropped (portraits taller).
  2. Mouse drag moves 1:1; a quick flick keeps gliding then stops; a slow release does not glide.
  3. Wheel and trackpad pan with momentum; shift+wheel pans sideways.
  4. Resting the mouse near an edge drifts that way; the layer tilts slightly with movement and pointer.
  5. Click a tile → lightbox with `NN / 50`; ←/→ and the arrows change photo; Esc and a click on the dark area
     close it; focus returns to the tile. A drag that ends on a tile does not open it.
  6. Keyboard: Tab focuses the stage, arrows pan; Tab again reaches tiles (each pans into view); Enter opens; after
     dragging with the mouse, Enter on a tile still opens it.
  7. Emulate `prefers-reduced-motion: reduce`: no glide, no tilt, no parallax; wheel moves directly.
  8. Network tab: grid requests only `-sm.webp` files.
  9. Console: no errors or hydration warnings.

- [ ] **Step 8: Commit**

```bash
git add components/site/gallery-grid.tsx components/site/gallery-view.tsx app/gallery/page.tsx app/globals.css
git commit -m "feat(gallery): infinite canvas gallery page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Home carousel — more photos and a link

**Files:**
- Modify: `components/site/gallery.tsx:1-18` (imports, `photos`) and `:86-118` (image src/sizes, link)
- Delete: `public/photos/gallery-stage.webp`, `public/photos/gallery-speakers.webp`, `public/photos/gallery-panel.webp`
- Test: `tests/gallery-data.test.ts`

**Interfaces:**
- Consumes: `galleryPhotos` (Tasks 1–2).
- Produces: `carouselPicks: { id: string; fx: number }[]` exported from `data/gallery.ts` (hand-written below the
  generated array; the script keeps everything after the array on re-runs).

- [ ] **Step 1: Add the picks to data and test them** — append to `data/gallery.ts`, below the generated array:

```ts
// The home carousel's photos, in order, with `fx`: where the card's window sits across the photo (0 = left edge,
// 1 = right edge; keep 0.15–0.85). Landscape only: a card shows a 3:2 slice.
export const carouselPicks: { id: string; fx: number }[] = [
  // filled in Step 3
];
```

and add to `tests/gallery-data.test.ts` (import `carouselPicks` alongside `galleryPhotos`):

```ts
  it("gives the home carousel 12 landscape photos with safe focal points", () => {
    expect(carouselPicks).toHaveLength(12);
    expect(new Set(carouselPicks.map((c) => c.id)).size).toBe(12);
    for (const c of carouselPicks) {
      const p = galleryPhotos.find((g) => g.id === c.id);
      expect(p, c.id).toBeDefined();
      expect(p!.w, c.id).toBeGreaterThan(p!.h);
      expect(c.fx).toBeGreaterThanOrEqual(0.15);
      expect(c.fx).toBeLessThanOrEqual(0.85);
    }
  });
```

Run: `npx vitest run tests/gallery-data.test.ts` — Expected: FAIL (length 0).

- [ ] **Step 2: Confirm re-runs keep the picks** — Run `node scripts/prep-photos.mjs "$HOME/Downloads/Picflow Images Oct 8"`
and confirm `git diff data/gallery.ts` shows only the picks block you just added (the script keeps everything after
the array).

- [ ] **Step 3: Choose the 12** — using the contact sheets from Task 2: the 3 current carousel scenes first (the stage
under "The Art of Adab" slide, the three speakers in the lobby, a community booth — find their ids by eye), then 9
more that each show something new (panel, crowd, bazaar, lawn, sisters' side, volunteers, a candid moment), no two
similar shots adjacent. For each, set `fx` so the main subject sits in the middle of a 3:4 window: for a subject at
horizontal position `s` (0–1) in the photo, `fx ≈ (s − 0.25) / 0.5`, clamped to 0.15–0.85. Fill `carouselPicks`.

Run: `npx vitest run tests/gallery-data.test.ts` — Expected: PASS.

- [ ] **Step 4: Switch the carousel** — in `components/site/gallery.tsx` replace the `photos` constant and its
comment's last two lines with:

```tsx
import Link from "next/link";
import { carouselPicks, galleryPhotos } from "@/data/gallery";
```

(with the other imports) and

```tsx
// `fx` (data/gallery.ts) is where the visible window sits across the photo's spare width (0 = left edge, 1 = right
// edge); it stays between 0.15 and 0.85 so the parallax never runs out of photo.
const photos = carouselPicks.map(({ id, fx }) => ({ ...galleryPhotos.find((p) => p.id === id)!, fx }));
```

In the JSX: `key={p.id}`, `src={`/photos/gallery/${p.id}.webp`}`, `width={p.w}`, `height={p.h}`. After the arrows'
`<div>`, add:

```tsx
      <Link href="/gallery/" className="qe-pill justify-self-center">
        See all {galleryPhotos.length} photos
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </Link>
```

- [ ] **Step 5: Delete the unused photos** — confirm nothing references them, then delete:

Run: `grep -rn "gallery-stage\|gallery-speakers\|gallery-panel" app components lib data` — Expected: no output.
Run: `git rm public/photos/gallery-stage.webp public/photos/gallery-speakers.webp public/photos/gallery-panel.webp`

- [ ] **Step 6: Check** — `npx tsc --noEmit && npm run lint && npm test`; then in the browser at 1440×900 and
390×844, the home page's gallery section shows 12 cards with faces/subjects in frame while dragging, the arrows
reach the last card, and "See all 50 photos" goes to `/gallery/`, whose back link returns home.

- [ ] **Step 7: Commit**

```bash
git add components/site/gallery.tsx data/gallery.ts tests/gallery-data.test.ts
git commit -m "feat(gallery): 12-photo home carousel linking to the gallery page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Final verification

**Files:** none new.

- [ ] **Step 1: Static build** — Run: `npm run build && ls out/gallery/index.html && du -sh out/photos/gallery`
Expected: build succeeds; the file exists; ~10–11 MB.

- [ ] **Step 2: Serve the export and re-check** — Run: `npx serve out -l 4173` (or `python3 -m http.server 4173 -d out`)
and repeat Task 6 Step 7 items 1, 5 and 9 against `http://localhost:4173/gallery/` plus the home carousel link.

- [ ] **Step 3: No-JS fallback** — in Playwright, open a context with JavaScript disabled on `/gallery/`: a
scrollable grid of all 50 thumbnails with alt text, each linking to the full photo.

- [ ] **Step 4: Full test run** — Run: `npm test && npm run lint` — Expected: all pass, no warnings added.

- [ ] **Step 5: Commit any fixes** from Steps 1–4 with a message describing them.
