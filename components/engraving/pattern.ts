import { r1, type Pt } from "@/components/engraving/shapes";

// Eight-fold star strapwork, built the traditional way (Hankin's "polygons in contact" method):
// take the octagon-and-square (4.8.8) tiling, and from the midpoint of every edge send two rays into
// each polygon at a fixed contact angle; where rays from neighbouring edges meet, they form the stars.
// The result tiles seamlessly in a T × T square (one octagon plus one square per cell).

const rot = ([x, y]: Pt, a: number): Pt => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const dot = (a: Pt, b: Pt) => a[0] * b[0] + a[1] * b[1];
const norm = (a: Pt): Pt => { const m = Math.hypot(a[0], a[1]) || 1; return [a[0] / m, a[1] / m]; };

/** Where the lines p + t·u and q + s·v cross (null if parallel). */
function cross(p: Pt, u: Pt, q: Pt, v: Pt): Pt | null {
  const det = u[0] * v[1] - u[1] * v[0];
  if (Math.abs(det) < 1e-9) return null;
  const t = ((q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0]) / det;
  return [p[0] + u[0] * t, p[1] + u[1] * t];
}

const regular = (cx: number, cy: number, r: number, n: number, start: number): Pt[] =>
  Array.from({ length: n }, (_, k) => [cx + r * Math.cos(start + (k * 2 * Math.PI) / n), cy + r * Math.sin(start + (k * 2 * Math.PI) / n)] as Pt);

/** Hankin segments for one convex polygon at contact angle `theta` (radians, measured from the edge). */
export function hankin(poly: Pt[], theta: number): [Pt, Pt][] {
  const n = poly.length;
  const c: Pt = [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
  const mids = poly.map((p, i) => [(p[0] + poly[(i + 1) % n][0]) / 2, (p[1] + poly[(i + 1) % n][1]) / 2] as Pt);
  // Of the two ways to turn a direction by theta, take the one that points into the polygon.
  const inward = (m: Pt, d: Pt) => {
    const a = rot(d, theta), b = rot(d, -theta), toC = sub(c, m);
    return dot(a, toC) > dot(b, toC) ? a : b;
  };
  const segs: [Pt, Pt][] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, corner = poly[j];
    const m1 = mids[i], m2 = mids[j];
    const u = inward(m1, norm(sub(corner, m1))); // from edge i, leaning towards the shared corner
    const v = inward(m2, norm(sub(corner, m2))); // from edge j, leaning towards the same corner
    const p = cross(m1, u, m2, v);
    if (p) segs.push([m1, p], [p, m2]);
  }
  return segs;
}

/** Path data for one seamless tile of size T (drawn over a 3×3 block of cells so edges continue across tiles). */
export function starTile(T: number, theta = (64 * Math.PI) / 180) {
  const s = T / (1 + Math.SQRT2); // octagon edge length
  const rOct = s / (2 * Math.sin(Math.PI / 8));
  const rSq = s / Math.SQRT2;
  const segs: [Pt, Pt][] = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const ox = i * T, oy = j * T;
      segs.push(...hankin(regular(ox + T / 2, oy + T / 2, rOct, 8, Math.PI / 8), theta));
      segs.push(...hankin(regular(ox, oy, rSq, 4, 0), theta));
    }
  }
  // Keep only segments that touch the tile (with a margin for stroke width).
  const inTile = ([a, b]: [Pt, Pt]) => Math.max(a[0], b[0]) > -2 && Math.min(a[0], b[0]) < T + 2 && Math.max(a[1], b[1]) > -2 && Math.min(a[1], b[1]) < T + 2;
  const f = (p: Pt) => `${Math.round(p[0] * 100) / 100} ${Math.round(p[1] * 100) / 100}`;
  return segs.filter(inTile).map(([a, b]) => `M${f(a)}L${f(b)}`).join("");
}

/** Average of the segment midpoints, for tests (should sit at the tile centre by symmetry). */
export const tileCentroid = (d: string) => {
  const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  let x = 0, y = 0;
  for (let i = 0; i < nums.length; i += 2) { x += nums[i]; y += nums[i + 1]; }
  const n = nums.length / 2;
  return [r1(x / n), r1(y / n)] as Pt;
};
