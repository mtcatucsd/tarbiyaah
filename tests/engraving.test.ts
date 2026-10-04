import { describe, expect, it } from "vitest";
import { GROW_BOX, engravedPalm, engravedUndergrowth } from "@/components/engraving/flora";
import { hankin, starTile, tileCentroid } from "@/components/engraving/pattern";
import { GEISEL_BOUNDS, geiselParts } from "@/components/engraving/geisel";
import { sideParts } from "@/components/engraving/scene";
import {
  apexAngle, archApex, archPoint, archRadius, insetArch, palm, pointedArch, rng, starPoints, voussoirs, type Arch,
} from "@/components/engraving/shapes";

/** Every point a path visits (end points of each segment, arcs included), in absolute coordinates. */
const coords = (d: string) => {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+/g) ?? [];
  const arity: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, q: 4, c: 6, a: 7, z: 0 };
  const out: number[][] = [];
  let x = 0, y = 0, sx = 0, sy = 0, i = 0, cmd = "M";
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const lower = cmd.toLowerCase(), rel = cmd === lower;
    const n = tokens.slice(i, i + arity[lower]).map(Number);
    i += arity[lower];
    if (lower === "z") { x = sx; y = sy; continue; }
    if (lower === "h") x = rel ? x + n[0] : n[0];
    else if (lower === "v") y = rel ? y + n[0] : n[0];
    else {
      const [ex, ey] = n.slice(-2);
      x = rel ? x + ex : ex; y = rel ? y + ey : ey;
    }
    if (lower === "m") { sx = x; sy = y; }
    out.push([x, y]);
  }
  return out;
};

describe("pointed arches", () => {
  const a: Arch = { left: 0, right: 400, spring: 500, radius: archRadius(400, 280) };

  it("chooses a radius that gives the requested rise", () => {
    expect(archApex(a)).toBeCloseTo(500 - 280, 6);
  });
  it("never goes below a semicircle", () => {
    expect(archRadius(400, 50)).toBe(200);
    expect(archApex({ ...a, radius: 200 })).toBeCloseTo(300, 6);
  });
  it("meets on the axis at the apex angle, from both sides", () => {
    const top = apexAngle(a);
    const [lx, ly] = archPoint(a, top, -1);
    const [rx, ry] = archPoint(a, top, 1);
    expect(lx).toBeCloseTo(200, 6);
    expect(rx).toBeCloseTo(200, 6);
    expect(ly).toBeCloseTo(archApex(a), 6);
    expect(ry).toBeCloseTo(archApex(a), 6);
  });
  it("starts at the jambs on the spring line", () => {
    expect(archPoint(a, 0, -1)).toEqual([0, 500]);
    expect(archPoint(a, 0, 1)).toEqual([400, 500]);
  });
  it("insets concentrically, so the inner apex is lower but still on the axis", () => {
    const inner = insetArch(a, 20);
    expect(archApex(inner)).toBeGreaterThan(archApex(a));
    expect(archPoint(inner, apexAngle(inner), -1)[0]).toBeCloseTo(200, 6);
  });
  it("draws from the base up and back down", () => {
    expect(pointedArch(a, 900)).toMatch(/^M0 900 V500 A.* 400 500 V900$/);
  });
  it("splits the band into n voussoirs per side, alternating", () => {
    const { even, odd } = voussoirs(a, 20, 7);
    const count = (s: string) => (s.match(/Z/g) ?? []).length;
    expect(count(even) + count(odd)).toBe(14);
    expect(count(even)).toBe(8); // blocks 0, 2, 4, 6 on each side
  });
});

describe("star tile and plants", () => {
  it("is balanced about the tile centre (it tiles by symmetry)", () => {
    const [cx, cy] = tileCentroid(starTile(56));
    expect(Math.abs(cx - 28)).toBeLessThan(2);
    expect(Math.abs(cy - 28)).toBeLessThan(2);
  });
  it("puts every Hankin ray inside its polygon", () => {
    const sq: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    for (const [a, b] of hankin(sq, (64 * Math.PI) / 180)) {
      for (const [x, y] of [a, b]) {
        expect(x).toBeGreaterThanOrEqual(-1e-9);
        expect(x).toBeLessThanOrEqual(10 + 1e-9);
        expect(y).toBeGreaterThanOrEqual(-1e-9);
        expect(y).toBeLessThanOrEqual(10 + 1e-9);
      }
    }
  });
  it("palms are deterministic per seed", () => {
    expect(engravedPalm(5)).toEqual(engravedPalm(5));
    expect(engravedPalm(5).fronds).not.toBe(engravedPalm(6).fronds);
  });
});

describe("drawings", () => {
  it("rng is deterministic per seed", () => {
    const a = rng(7), b = rng(7), c = rng(8);
    const seq = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seq);
    expect(c()).not.toBe(seq[0]);
    for (const v of seq) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it("palms are identical for the same seed", () => {
    expect(palm(100, 300, 200, 10, 5)).toEqual(palm(100, 300, 200, 10, 5));
  });
  it("stars have two points per arm", () => {
    expect(starPoints(0, 0, 10, 4, 8)).toHaveLength(16);
  });
  it("Geisel is symmetric and fits its bounds", () => {
    const pts = geiselParts().flatMap((p) => coords(p.d));
    const xs = pts.map(([x]) => x), ys = pts.map(([, y]) => y);
    expect(Math.min(...xs)).toBeCloseTo(-Math.max(...xs), 0);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(GEISEL_BOUNDS.x);
    expect(Math.max(...xs)).toBeLessThanOrEqual(GEISEL_BOUNDS.x + GEISEL_BOUNDS.w);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(GEISEL_BOUNDS.y);
  });
  it("the two side landscapes differ but keep the same ground", () => {
    const l = sideParts("left"), r = sideParts("right");
    expect(l.at(-1)!.d).toBe(r.at(-1)!.d);
    expect(l[0].d).not.toBe(r[0].d);
  });
});

describe("undergrowth", () => {
  it("keeps every layer inside its box, and is deterministic per seed", () => {
    for (const seed of [3, 8, 14]) {
      const g = engravedUndergrowth(seed);
      for (const d of [g.swordBlade, g.fernBack, g.fernFront, g.fan, g.spikes]) {
        for (const [x, y] of coords(d)) {
          expect(x).toBeGreaterThanOrEqual(GROW_BOX.x - 6);
          expect(x).toBeLessThanOrEqual(GROW_BOX.x + GROW_BOX.w + 6);
          expect(y).toBeGreaterThanOrEqual(GROW_BOX.y - 6);
          expect(y).toBeLessThanOrEqual(GROW_BOX.y + GROW_BOX.h + 6);
        }
      }
    }
    expect(engravedUndergrowth(3)).toEqual(engravedUndergrowth(3));
    expect(engravedUndergrowth(3).fernFront).not.toBe(engravedUndergrowth(8).fernFront);
  });
  it("has the expected leaves, fronds and spikes", () => {
    const g = engravedUndergrowth(3);
    expect((g.swordBlade.match(/Z/g) ?? []).length).toBe(11);
    expect((g.spikes.match(/Z/g) ?? []).length).toBe(9);
    expect((g.fan.match(/Z/g) ?? []).length).toBe(23);
    expect((g.fernFront.match(/M/g) ?? []).length).toBeGreaterThan(150);
  });
});
