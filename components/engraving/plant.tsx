import { GROW_BOX, PALM_BOX } from "@/components/engraving/flora";

// Plant variants in the external sprite served at /art/plants.svg (see app/art/plants.svg/route.ts).
export const PALM_SEEDS = [5, 17, 29];
export const GROW_SEEDS = [3, 8, 14];
export const PLANT_SPRITE = "/art/plants.svg";
export const PLANT_SPRITE_NIGHT = "/art/plants-night.svg";

export type PlantSpec = { kind: "palm" | "grow"; x: number; base: number; h: number; variant: number; flip?: boolean };


/** Places one of the sprite's plant symbols with its base at (x, base), `h` units tall. */
export function Plant({ kind, x, base, h, variant, flip, night }: PlantSpec & { night?: boolean }) {
  const box = kind === "palm" ? PALM_BOX : GROW_BOX;
  const k = h / -box.y; // h = height from the base (local y 0) to the top of the symbol box
  const use = <use href={`${night ? PLANT_SPRITE_NIGHT : PLANT_SPRITE}#${kind}-${variant}`} x={x + box.x * k} y={base + box.y * k} width={box.w * k} height={box.h * k} />;
  return flip ? <g transform={`translate(${2 * x} 0) scale(-1 1)`}>{use}</g> : use;
}
