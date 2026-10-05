import type { CSSProperties } from "react";
import { EtchGroup } from "@/components/engraving/etch";
import { GEISEL_BOUNDS, geiselParts } from "@/components/engraving/geisel";
import { Plant, type PlantSpec } from "@/components/engraving/plant";
import { SIDE, sideParts, sidePlants } from "@/components/engraving/scene";

// Palms and undergrowth either side of Geisel Library, used twice:
//  - `photo`: the foot of the hero. Geisel is a photo (public/art/geisel-photo.webp: Wikimedia Commons "Geisel Library on
//    Clear Day", CC0, cut out and recoloured to the hero's teal/cream duotone, its legs fading into the undergrowth),
//    and the plants are cream on teal ("night" sprite).
//  - otherwise: the closing scene above the footer, with the engraved Geisel and ink-on-cream plants.
// The three drawings share one height (--sky-h) and the middle one (Geisel) is rendered smaller (--geisel-w, see
// globals.css), so the palms and undergrowth beside it are visible on every screen size.
const geisel = geiselParts();
const B = GEISEL_BOUNDS;
const PHOTO = { w: 560, h: 560 / (1472 / 810) }; // in the drawing's units: centred, legs fading at y = 0

// Undergrowth in front of the building's base, spilling past its frame so the planting meets and overlaps it.
const BASE_PLANTING: PlantSpec[] = [-1, 1].flatMap((side) => [
  { kind: "grow", x: side * 218, base: 2, h: 74, variant: side < 0 ? 2 : 0, flip: side > 0 },
  { kind: "grow", x: side * 322, base: 2, h: 92, variant: side < 0 ? 0 : 1, flip: side < 0 },
  { kind: "grow", x: side * 430, base: 2, h: 84, variant: side < 0 ? 1 : 2, flip: side > 0 },
] as PlantSpec[]);

function Side({ side, night }: { side: "left" | "right"; night?: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${SIDE.w} ${SIDE.h}`}
      preserveAspectRatio={side === "left" ? "xMaxYMax slice" : "xMinYMax slice"}
      className="geisel-side min-w-0 flex-1"
      style={{ overflow: "visible" }}
    >
      <g className="hatch-in" style={{ "--d": 5 } as CSSProperties}>
        {sidePlants(side).map((p, i) => <Plant key={i} {...p} night={night} />)}
      </g>
      <EtchGroup parts={sideParts(side)} />
    </svg>
  );
}

export function GeiselScene({ photo }: { photo?: boolean }) {
  return (
    <div data-anim="draw" className="flex h-[var(--sky-h)] items-end justify-center">
      <Side side="left" night={photo} />
      <svg
        viewBox={`${B.x} ${B.y} ${B.w} ${B.h}`}
        preserveAspectRatio="xMidYMax meet"
        className="geisel h-full shrink-0"
        style={{ width: "var(--geisel-w)", overflow: "visible" }}
      >
        {photo ? (
          <image
            href="/art/geisel-photo.webp"
            x={-PHOTO.w / 2}
            y={-PHOTO.h + 12}
            width={PHOTO.w}
            height={PHOTO.h}
            className="hatch-in"
            style={{ "--d": 1 } as CSSProperties}
          />
        ) : (
          <EtchGroup parts={geisel} />
        )}
        <g className="hatch-in" style={{ "--d": 6 } as CSSProperties}>
          {BASE_PLANTING.map((p, i) => <Plant key={i} {...p} night={photo} />)}
        </g>
      </svg>
      <Side side="right" night={photo} />
    </div>
  );
}
