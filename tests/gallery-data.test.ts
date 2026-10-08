import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { carouselPicks, galleryPhotos } from "@/data/gallery";

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
  it("describes every photo for screen readers", () => {
    for (const p of galleryPhotos) expect(p.alt.trim().length, p.id).toBeGreaterThanOrEqual(12);
  });
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
});
