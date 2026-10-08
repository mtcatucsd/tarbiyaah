// Physics for the gallery canvas, measured from Framer's Dynamic Gallery Grid (see
// docs/superpowers/specs/2026-10-08-gallery-page-design.md). Velocities are px/s; "frames" are 60 fps frames.
export const MOTION = {
  friction: 35, throwMax: 5000, wheelMax: 4000, restMs: 90, stopBelow: 4,
  edgeZone: 110, edgeSpeed: 6, tilt: 6, parallax: 14, keyPush: 900, dragClick: 6,
};

export const clamp = (v: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, v));

export const decay = (frames: number) => (0.985 - (MOTION.friction / 100) * 0.13) ** frames;

export function edgePush(pos: number, size: number, zone = MOTION.edgeZone) {
  if (pos < zone) return 1 - Math.max(0, pos) / zone;
  if (pos > size - zone) return -(1 - Math.max(0, size - pos) / zone);
  return 0;
}

// A pointer that rested before letting go shouldn't throw the plane.
export const releaseVelocity = (v: number, restMs: number) => (restMs > MOTION.restMs ? 0 : clamp(v, -MOTION.throwMax, MOTION.throwMax));

const ARROWS: Record<string, [number, number]> = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
export const arrowPush = (key: string) => ARROWS[key] ?? null;

export function wheelPixels(e: { deltaX: number; deltaY: number; deltaMode: number; shiftKey: boolean }, pageH: number): [number, number] {
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? pageH : 1;
  const dx = e.deltaX * unit, dy = e.deltaY * unit;
  return e.shiftKey && !dx ? [dy, 0] : [dx, dy];
}

// Keyboard clicks have detail 0, so a drag earlier on can't swallow them.
export const isDragClick = (detail: number, moved: number) => detail > 0 && moved > MOTION.dragClick;
