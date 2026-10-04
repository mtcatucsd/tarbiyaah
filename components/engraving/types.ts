export type Hatch = "hatch-light" | "hatch-mid" | "hatch-dense" | "hatch-h" | "crosshatch";
export type Weight = "hair" | "line" | "bold";

/** One engraved shape: an outline that draws itself, optionally over a paper fill and a hatched fill. */
export type EtchPart = {
  d: string;
  fill?: Hatch | "ink";
  solid?: boolean;   // paper underneath, so the shape hides whatever is behind it
  outline?: boolean; // default true
  weight?: Weight;   // default "line"
  delay?: number;    // stagger step for the draw-in
};
