import type { CSSProperties } from "react";
import type { EtchPart } from "@/components/engraving/types";

/** Renders one engraved shape: paper underlay, hatching that fades in, then an outline that draws itself. */
export function Etch({ d, fill, solid, outline = true, weight = "line", delay = 0 }: EtchPart) {
  const style = { "--d": delay } as CSSProperties;
  return (
    <>
      {solid ? <path d={d} className="etch-paper" fillRule="evenodd" /> : null}
      {fill ? (
        <path d={d} fillRule="evenodd" className={fill === "ink" ? "etch-ink hatch-in" : "hatch-in"} fill={fill === "ink" ? undefined : `url(#${fill})`} style={style} />
      ) : null}
      {outline ? <path d={d} pathLength={1} className={`etch etch-${weight} draw`} style={style} /> : null}
    </>
  );
}

export function EtchGroup({ parts }: { parts: EtchPart[] }) {
  return parts.map((p, i) => <Etch key={i} {...p} />);
}
