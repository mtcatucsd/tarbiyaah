import { describe, expect, it } from "vitest";
import { progressThrough } from "@/lib/scroll-progress";

describe("progressThrough", () => {
  // viewport 800px tall, so its middle is at y=400
  it("is 0 while the element is still below the viewport middle", () => {
    expect(progressThrough(600, 1000, 800)).toBe(0);
    expect(progressThrough(400, 1000, 800)).toBe(0);
  });
  it("is the fraction of the element the middle has passed", () => {
    expect(progressThrough(150, 1000, 800)).toBe(0.25);
    expect(progressThrough(-100, 1000, 800)).toBe(0.5);
  });
  it("is 1 once the middle has passed the bottom", () => {
    expect(progressThrough(-600, 1000, 800)).toBe(1);
    expect(progressThrough(-5000, 1000, 800)).toBe(1);
  });
  it("handles a zero-height element without dividing by zero", () => {
    expect(progressThrough(500, 0, 800)).toBe(0);
    expect(progressThrough(300, 0, 800)).toBe(1);
  });
});
