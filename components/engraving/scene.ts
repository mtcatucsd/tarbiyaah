import type { PlantSpec } from "@/components/engraving/plant";
import { grass } from "@/components/engraving/shapes";
import type { EtchPart } from "@/components/engraving/types";

// The landscape either side of Geisel. Each side is a 1000 × 310 drawing with the ground at y = 290
// (matching Geisel's drawing, so both scale alike), laid out for the left side with Geisel beyond x = 1000;
// the right side mirrors the x positions and swaps plant variants.
export const SIDE = { w: 1000, h: 310, ground: 290 };

export function sideParts(side: "left" | "right"): EtchPart[] {
  const g = SIDE.ground;
  const seed = side === "left" ? 11 : 29;
  return [
    { d: grass(0, SIDE.w, g, seed), weight: "hair", delay: 2 },
    { d: `M0 ${g} H${SIDE.w}`, weight: "line", delay: 0 },
  ];
}

/** Engraved palms and shrubs, nearest to Geisel first; the outer ones are cropped on narrow screens. */
export function sidePlants(side: "left" | "right"): PlantSpec[] {
  const g = SIDE.ground;
  const X = (x: number) => (side === "left" ? x : SIDE.w - x);
  const v = (n: number) => (side === "left" ? n : (n + 1) % 3);
  const flip = (f: boolean) => (side === "left" ? f : !f);
  return [
    // Palms first; the low planting is drawn after them, so it overlaps their trunks.
    { kind: "palm", x: X(110), base: g, h: 250, variant: v(1), flip: flip(false) },
    { kind: "palm", x: X(330), base: g, h: 215, variant: v(2), flip: flip(true) },
    { kind: "palm", x: X(560), base: g, h: 270, variant: v(0), flip: flip(false) },
    { kind: "palm", x: X(760), base: g, h: 195, variant: v(1), flip: flip(true) },
    { kind: "palm", x: X(905), base: g, h: 230, variant: v(2), flip: flip(true) },
    { kind: "grow", x: X(120), base: g, h: 104, variant: 0 },
    { kind: "grow", x: X(290), base: g, h: 120, variant: 1, flip: true },
    { kind: "grow", x: X(480), base: g, h: 100, variant: 2 },
    { kind: "grow", x: X(670), base: g, h: 112, variant: 0, flip: true },
    { kind: "grow", x: X(830), base: g, h: 118, variant: 1 },
  ];
}
