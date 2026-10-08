import { describe, expect, it } from "vitest";
import { MOTION, arrowPush, clamp, decay, edgePush, releaseVelocity, wheelPixels } from "@/lib/gallery-motion";

describe("MOTION", () => {
  it("matches the Framer demo: no tilt, no click handling", () => {
    expect(MOTION).toEqual({ friction: 35, throwMax: 5000, wheelMax: 4000, restMs: 90, stopBelow: 4, edgeZone: 110, edgeSpeed: 6, parallax: 14, keyPush: 900 });
  });
});

describe("decay", () => {
  it("matches Framer's friction 35 per frame and compounds over frames", () => {
    expect(decay(1)).toBeCloseTo(0.985 - 0.35 * 0.13, 10);
    expect(decay(2)).toBeCloseTo(decay(1) ** 2, 10);
    expect(decay(0)).toBe(1);
  });
});

describe("clamp", () => {
  it("defaults to -1..1", () => {
    expect(clamp(3)).toBe(1);
    expect(clamp(-3)).toBe(-1);
    expect(clamp(0.2)).toBe(0.2);
    expect(clamp(9000, -5000, 5000)).toBe(5000);
  });
});

describe("edgePush", () => {
  it("pushes hardest at the edges and not at all in the middle", () => {
    expect(edgePush(0, 1000)).toBe(1);
    expect(edgePush(55, 1000)).toBeCloseTo(0.5);
    expect(edgePush(110, 1000)).toBe(0);
    expect(edgePush(500, 1000)).toBe(0);
    expect(edgePush(1000, 1000)).toBe(-1);
  });
});

describe("releaseVelocity", () => {
  it("throws only if the pointer was still moving, clamped", () => {
    expect(releaseVelocity(1200, 20)).toBe(1200);
    expect(releaseVelocity(1200, 91)).toBe(0);
    expect(releaseVelocity(-99999, 0)).toBe(-MOTION.throwMax);
  });
});

describe("arrowPush", () => {
  it("moves the plane against the arrow so the view travels with it", () => {
    expect(arrowPush("ArrowRight")).toEqual([-1, 0]);
    expect(arrowPush("ArrowLeft")).toEqual([1, 0]);
    expect(arrowPush("ArrowDown")).toEqual([0, -1]);
    expect(arrowPush("ArrowUp")).toEqual([0, 1]);
    expect(arrowPush("Enter")).toBeNull();
  });
});

describe("wheelPixels", () => {
  const e = (deltaX: number, deltaY: number, deltaMode = 0, shiftKey = false) => ({ deltaX, deltaY, deltaMode, shiftKey });
  it("passes pixel deltas through", () => expect(wheelPixels(e(3, -40), 900)).toEqual([3, -40]));
  it("turns lines into 16 px and pages into the page height", () => {
    expect(wheelPixels(e(0, 3, 1), 900)).toEqual([0, 48]);
    expect(wheelPixels(e(0, 1, 2), 900)).toEqual([0, 900]);
  });
  it("turns shift+wheel on a mouse into a sideways pan", () => {
    expect(wheelPixels(e(0, 100, 0, true), 900)).toEqual([100, 0]);
    expect(wheelPixels(e(20, 100, 0, true), 900)).toEqual([20, 100]);
  });
});
