import { describe, expect, it } from "vitest";
import { DUR, EASE, MAIN_EASE_CURVE, MEDIA, SCRUB, STAGGER, TEXT_START } from "@/components/motion/tokens";

describe("motion tokens", () => {
  it("only animate when the visitor allows motion; Lenis only with a fine hover pointer", () => {
    expect(MEDIA.motion).toBe("(prefers-reduced-motion: no-preference)");
    expect(MEDIA.desktop).toBe("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  });
  it("uses the reference's S-curve as the main ease and linear for scrubbed motion", () => {
    expect(MAIN_EASE_CURVE).toBe("M0,0 C0.9,0.1 0.1,0.9 1,1");
    expect(EASE.scrub).toBe("none");
  });
  it("keeps timings in a sensible range", () => {
    expect(SCRUB).toBeGreaterThan(0);
    expect(SCRUB).toBeLessThan(1);
    expect(STAGGER).toBeLessThan(DUR.text);
    expect(TEXT_START).toBe("top 85%");
  });
});
