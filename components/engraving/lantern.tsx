import Image from "next/image";
import type { CSSProperties } from "react";

// The hanging lantern artwork (public/art/lantern.webp, recoloured to the ink).
export const LANTERN_ASPECT = 226 / 110;

/**
 * For moving lanterns: an HTML layer positioned in px (hook at left/top), with its cord. It sways and its
 * light pulses using only transform and opacity on their own layers, so the drawing behind never repaints.
 */
export function SwingingLantern({ left, top, w, cord, delay = 0 }: { left: number | string; top: number; w: number; cord: number; delay?: number }) {
  const h = w * LANTERN_ASPECT;
  return (
    <div
      className="lantern-swing"
      style={{ left, top, width: w, height: cord + h, marginLeft: -w / 2, "--sway-delay": `${delay}s` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="lantern-cord" style={{ height: cord }} />
      <span className="lantern-light" style={{ top: cord + h * 0.3, left: w * 0.2, width: w * 0.6, height: h * 0.42 }} />
      <Image src="/art/lantern.webp" alt="" width={110} height={226} className="absolute left-0" style={{ top: cord, width: w, height: h }} />
    </div>
  );
}
