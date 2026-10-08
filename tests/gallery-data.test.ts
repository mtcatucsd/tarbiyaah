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
  it("describes every photo for screen readers", () => {
    for (const p of galleryPhotos) expect(p.alt.trim().length, p.id).toBeGreaterThanOrEqual(12);
  });
});
