import type { CSSProperties } from "react";
import { EtchGroup } from "@/components/engraving/etch";
import { GEISEL_BOUNDS, geiselParts } from "@/components/engraving/geisel";
import { Plant, type PlantSpec } from "@/components/engraving/plant";
import { SIDE, sideParts, sidePlants } from "@/components/engraving/scene";
import { Reveal } from "@/components/site/reveal";

const geisel = geiselParts();
const B = GEISEL_BOUNDS;

// In Geisel's own units (ground at y = 0, centred on x = 0), mirrored either side.
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
      <EtchGroup parts={sideParts(side)} night={night} />
    </svg>
  );
}

// Geisel Library with palms and undergrowth either side: engraved for the closing scene above the footer,
// and with `photo` (no drawing animation) at the foot of the hero.
// On wide screens the three drawings share one height (--sky-h), so they share one scale.
// On phones Geisel takes most of the width and the landscapes drop to a shorter band beside it,
// so the building reads larger than the trees.
// The colour-matched Geisel photo (public/art/geisel-photo.webp: Wikimedia Commons "Geisel Library on Clear Day",
// CC0, cut out and recoloured to the hero's duotone), placed in the drawing's units: centred, legs fading at y = 0.
const PHOTO = { w: 560, h: 560 / (1472 / 810) };

export function GeiselScene({ night, photo }: { night?: boolean; photo?: boolean }) {
  return (
    <Reveal fade={false} className="flex h-[var(--sky-h)] items-end justify-center">
      <Side side="left" night={night} />
      <svg
        viewBox={`${B.x} ${B.y} ${B.w} ${B.h}`}
        preserveAspectRatio="xMidYMax meet"
        className="geisel h-full shrink-0"
        style={{ width: `min(calc(var(--sky-h) * ${B.w / B.h}), var(--geisel-max-w, 100%))`, overflow: "visible" }}
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
          <EtchGroup parts={geisel} night={night} />
        )}
        {/* Undergrowth in front of the building's base, spilling past its frame, so the planting meets and overlaps Geisel. */}
        <g className="hatch-in" style={{ "--d": 6 } as CSSProperties}>
          {BASE_PLANTING.map((p, i) => <Plant key={i} {...p} night={night} />)}
        </g>
      </svg>
      <Side side="right" night={night} />
    </Reveal>
  );
}
