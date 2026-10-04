// How far (0..1) the viewport's middle has travelled through an element,
// given the element's top (relative to the viewport) and height.
export function progressThrough(top: number, height: number, viewportH: number): number {
  const passed = viewportH / 2 - top;
  if (height <= 0) return passed > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, passed / height));
}
