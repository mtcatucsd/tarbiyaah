// The site's one motion language (docs/superpowers/specs/2026-10-05-seamless-motion-design.md).
// Text plays once as it reaches TEXT_START; decoration and depth follow the scroll with SCRUB seconds of catch-up.
// Phones get a lighter version: no scrubbed depth, and headings rise whole instead of line by line.
export const MAIN_EASE_CURVE = "M0,0 C0.9,0.1 0.1,0.9 1,1"; // cubic-bezier(.9,.1,.1,.9), as on times-event.de
export const EASE = { main: "tarb-main", settle: "power3.out", scrub: "none" } as const;
export const DUR = { text: 0.9, block: 1.1 } as const;
export const STAGGER = 0.08;
export const SCRUB = 0.6;
export const TEXT_START = "top 85%";
export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  desktop: "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
} as const;
