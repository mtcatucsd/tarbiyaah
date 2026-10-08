import { describe, expect, it } from "vitest";
import { MOTION, arrowPush, clamp, decay, edgePush, isLostMouseUp, releaseVelocity, trackDrag, wheelPixels } from "@/lib/gallery-motion";

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
  const k = (key: string, mods: { altKey?: boolean; metaKey?: boolean; ctrlKey?: boolean } = {}) => ({ key, altKey: false, metaKey: false, ctrlKey: false, ...mods });
  it("moves the plane against the arrow so the view travels with it", () => {
    expect(arrowPush(k("ArrowRight"))).toEqual([-1, 0]);
    expect(arrowPush(k("ArrowLeft"))).toEqual([1, 0]);
    expect(arrowPush(k("ArrowDown"))).toEqual([0, -1]);
    expect(arrowPush(k("ArrowUp"))).toEqual([0, 1]);
    expect(arrowPush(k("Enter"))).toBeNull();
  });
  it("leaves modified arrows (Alt+← is browser back) to the browser", () => {
    expect(arrowPush(k("ArrowLeft", { altKey: true }))).toBeNull();
    expect(arrowPush(k("ArrowRight", { metaKey: true }))).toBeNull();
    expect(arrowPush(k("ArrowUp", { ctrlKey: true }))).toBeNull();
  });
});

describe("wheelPixels", () => {
  const e = (deltaX: number, deltaY: number, deltaMode = 0, shiftKey = false, ctrlKey = false) => ({ deltaX, deltaY, deltaMode, shiftKey, ctrlKey });
  it("passes pixel deltas through", () => expect(wheelPixels(e(3, -40), 900)).toEqual([3, -40]));
  it("turns lines into 16 px and pages into the page height", () => {
    expect(wheelPixels(e(0, 3, 1), 900)).toEqual([0, 48]);
    expect(wheelPixels(e(0, 1, 2), 900)).toEqual([0, 900]);
  });
  it("turns shift+wheel on a mouse into a sideways pan", () => {
    expect(wheelPixels(e(0, 100, 0, true), 900)).toEqual([100, 0]);
    expect(wheelPixels(e(20, 100, 0, true), 900)).toEqual([20, 100]);
  });
  it("leaves pinch and Ctrl+wheel to the browser so the page can zoom", () => {
    expect(wheelPixels(e(0, 30, 0, false, true), 900)).toBeNull();
  });
});

describe("trackDrag", () => {
  it("follows only the first pointer; a second finger can't take over or end the drag", () => {
    const d = trackDrag();
    expect(d.start(1)).toBe(true);
    expect(d.start(2)).toBe(false);
    expect(d.owns(1)).toBe(true);
    expect(d.owns(2)).toBe(false);
    expect(d.end(2)).toBe(false);
    expect(d.owns(1)).toBe(true);
    expect(d.end(1)).toBe(true);
    expect(d.owns(1)).toBe(false);
    expect(d.start(2)).toBe(true);
  });
  it("can be dropped without knowing the pointer (window blur)", () => {
    const d = trackDrag();
    expect(d.cancel()).toBe(false);
    d.start(7);
    expect(d.cancel()).toBe(true);
    expect(d.owns(7)).toBe(false);
  });
});

describe("isLostMouseUp", () => {
  it("spots a mouse moving with no button held (its pointerup went elsewhere)", () => {
    expect(isLostMouseUp({ pointerType: "mouse", buttons: 0 })).toBe(true);
    expect(isLostMouseUp({ pointerType: "mouse", buttons: 1 })).toBe(false);
    expect(isLostMouseUp({ pointerType: "touch", buttons: 0 })).toBe(false);
  });
});
