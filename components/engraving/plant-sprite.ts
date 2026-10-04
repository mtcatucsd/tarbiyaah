import { GROW_BOX, PALM_BOX, engravedPalm, engravedUndergrowth } from "@/components/engraving/flora";
import { GROW_SEEDS, PALM_SEEDS } from "@/components/engraving/plant";

const box = (b: { x: number; y: number; w: number; h: number }) => `${b.x} ${b.y} ${b.w} ${b.h}`;

/** The engraved plants as one SVG sprite document, in the given ink and paper colours (literal: it is a separate file). */
export function plantSprite(ink: string, paper: string, mid: string) {
  const stroke = (d: string, w: number, colour = ink) =>
    `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${w}" stroke-linecap="round"/>`;
  const fill = (d: string) => `<path d="${d}" fill="${ink}"/>`;
  const palms = PALM_SEEDS.map((seed, i) => {
    const p = engravedPalm(seed);
    return `<symbol id="palm-${i}" viewBox="${box(PALM_BOX)}" overflow="visible">${stroke(p.ground, 1)}${fill(p.trunk)}${stroke(p.bark, 1.2, paper)}${stroke(p.fronds, 1.15)}${fill(p.heart)}</symbol>`;
  });
  const blade = (d: string, w: number, fillc: string) =>
    `<path d="${d}" fill="${fillc}" stroke="${ink}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const grows = GROW_SEEDS.map((seed, i) => {
    const g = engravedUndergrowth(seed);
    // Back to front: sword leaves, light fern, fan bursts, dark fern, front spikes.
    return `<symbol id="grow-${i}" viewBox="${box(GROW_BOX)}" overflow="visible">` +
      blade(g.swordBlade, 0.8, mid) + stroke(g.swordVeins, 0.6, paper) +
      stroke(g.fernBack, 0.8, mid) + `<path d="${g.fan}" fill="${ink}"/>` +
      stroke(g.fernFront, 0.85) + blade(g.spikes, 0.5, ink) + `</symbol>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg">${palms.join("")}${grows.join("")}</svg>`;
}
