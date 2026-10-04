import { agave, both, poly, rect, type Pt } from "@/components/engraving/shapes";
import type { EtchPart } from "@/components/engraving/types";

// Geisel Library (UC San Diego), front elevation, as an engraving. Local units: centred on x = 0,
// ground at y = 0, up is negative. About 680 wide and 280 tall.

/** A band of glass from y0 to y1 (y0 above), half-width hw, with mullions every `step` units. */
function glass(y0: number, y1: number, hw: number, step = 22) {
  const n = Math.max(2, Math.round((2 * hw) / step));
  let mullions = "";
  for (let k = 1; k < n; k++) {
    const x = -hw + (k * 2 * hw) / n;
    mullions += ` M${Math.round(x * 10) / 10} ${y0} V${y1}`;
  }
  return { pane: rect(-hw, y0, hw, y1), mullions: mullions.trim() };
}

/** A thin slab overhanging its glass by `o`, with a band of shadow underneath it. */
function slab(y: number, hw: number, o = 12, t = 4) {
  return { slab: rect(-hw - o, y - t, hw + o, y), shadow: rect(-hw, y, hw, y + 5) };
}

// Upper tiers, widest at the bottom, each glass band capped by its slab.
const tiers = [
  { top: -200, bottom: -168, hw: 250 },
  { top: -232, bottom: -204, hw: 196 },
  { top: -262, bottom: -236, hw: 142 },
];

export function geiselParts(): EtchPart[] {
  const parts: EtchPart[] = [];
  const add = (p: EtchPart) => parts.push(p);

  // Ground: level either side, dipping under the podium.
  add({ d: "M-360 0 H-172 L-162 7 H162 L172 0 H360", weight: "line", delay: 0 });

  // Planter walls with agaves.
  add({ d: both([[-372, 0], [-372, -13], [-296, -13], [-296, 0]]), fill: "hatch-light", solid: true, delay: 1 });
  add({ d: [agave(-350, -13, 30, 7), agave(-318, -13, 22, 7), agave(350, -13, 30, 7), agave(318, -13, 22, 7)].join(" "), weight: "hair", delay: 2 });

  // Podium with its sunken, rounded window.
  add({ d: rect(-162, -26, 162, 7), fill: "hatch-light", solid: true, delay: 1 });
  add({ d: "M-26 3 V-12 Q-26 -20 -18 -20 H18 Q26 -20 26 -12 V3 Z", fill: "crosshatch", solid: true, delay: 2 });
  add({ d: "M-162 -18 H-40 M40 -18 H162", weight: "hair", delay: 2 });

  // Piers under the splayed supports.
  add({ d: both([[-160, -26], [-160, -42], [-140, -42], [-140, -26]]), fill: "hatch-mid", solid: true, delay: 2 });

  // Splayed outer supports, each with a triangular opening.
  const leg: Pt[] = [[-278, -150], [-226, -150], [-140, -42], [-160, -42]];
  const hole: Pt[] = [[-258, -143], [-233, -143], [-157, -53]];
  add({ d: `${both(leg)} ${both(hole)}`, fill: "hatch-light", solid: true, delay: 3 });

  // Central core with floor lines, and four slim tapered columns.
  add({ d: rect(-26, -108, 26, -26), fill: "hatch-light", solid: true, delay: 3 });
  add({ d: "M-26 -81 H26 M-26 -54 H26", weight: "hair", delay: 4 });
  const columns = [62, 116].flatMap((x) => [
    poly([[x - 4, -108], [x + 4, -108], [x + 2.5, -26], [x - 2.5, -26]]),
    poly([[-x - 4, -108], [-x + 4, -108], [-x + 2.5, -26], [-x - 2.5, -26]]),
  ]);
  add({ d: columns.join(" "), fill: "hatch-mid", solid: true, delay: 3 });

  // Two narrower glass tiers hanging below the platter.
  for (const [y0, y1, hw, delay] of [[-130, -108, 150, 4], [-150, -130, 206, 4]] as const) {
    const g = glass(y0, y1, hw);
    add({ d: g.pane, fill: "hatch-h", solid: true, delay });
    add({ d: g.mullions, weight: "hair", delay: delay + 1 });
  }
  add({ d: rect(-206, -150, 206, -145), fill: "hatch-dense", outline: false, delay: 5 });

  // The wide flared concrete platter.
  add({ d: poly([[-282, -150], [282, -150], [304, -168], [-304, -168]]), fill: "hatch-light", solid: true, weight: "bold", delay: 5 });

  // Upper tiers, bottom first.
  tiers.forEach((t, i) => {
    const g = glass(t.top, t.bottom, t.hw);
    const s = slab(t.top, t.hw);
    add({ d: g.pane, fill: "hatch-h", solid: true, delay: 6 + i });
    add({ d: g.mullions, weight: "hair", delay: 7 + i });
    add({ d: s.shadow, fill: "hatch-dense", outline: false, delay: 7 + i });
    add({ d: s.slab, solid: true, weight: "bold", delay: 6 + i });
  });

  // Small box on the roof.
  add({ d: rect(-52, -278, 52, -266), fill: "hatch-light", solid: true, delay: 9 });
  add({ d: "M-36 -278 V-266 M36 -278 V-266", weight: "hair", delay: 9 });

  return parts;
}

/** Local bounds of the drawing (for the SVG viewBox). */
export const GEISEL_BOUNDS = { x: -380, y: -290, w: 760, h: 310 };
