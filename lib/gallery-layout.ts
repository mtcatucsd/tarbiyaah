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
