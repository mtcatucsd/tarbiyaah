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
