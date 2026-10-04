// Pure path builders for the engraved illustrations. No React here, so everything is unit-testable.
// Units are SVG user units; y grows downward as usual.

export type Pt = [number, number];

// Whole units: drawings are laid out at about 1 unit = 1px, so decimals only cost bytes.
export const r1 = (n: number) => Math.round(n);
const fmt = ([x, y]: Pt) => `${r1(x)} ${r1(y)}`;
export const rad = (deg: number) => (deg * Math.PI) / 180;

/** Polyline (closed by default) through the points. */
export const poly = (pts: Pt[], close = true) => "M" + pts.map(fmt).join(" L") + (close ? " Z" : "");

/** Mirror points about the vertical line x = cx. */
export const mirror = (pts: Pt[], cx = 0): Pt[] => pts.map(([x, y]) => [2 * cx - x, y]);

/** A shape plus its mirror image about x = cx (for symmetric buildings). */
export const both = (pts: Pt[], cx = 0, close = true) => `${poly(pts, close)} ${poly(mirror(pts, cx), close)}`;

export const rect = (x0: number, y0: number, x1: number, y1: number) =>
  poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);

export const circle = (cx: number, cy: number, r: number) =>
  `M${r1(cx - r)} ${r1(cy)} a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0 a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;

/** Deterministic pseudo-random numbers in [0, 1) (Park–Miller), so drawings are identical every render. */
export function rng(seed: number) {
  let s = Math.abs(Math.floor(seed)) % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ---------- stars and rosettes ----------

/** An n-pointed star polygon alternating between outer and inner radius, first point straight up. */
export function starPoints(cx: number, cy: number, rOut: number, rIn: number, n: number): Pt[] {
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 === 0 ? rOut : rIn;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });
}
export const star = (cx: number, cy: number, rOut: number, rIn: number, n: number) => poly(starPoints(cx, cy, rOut, rIn, n));

/** The khatam: an eight-pointed star made of two overlapping squares, with a ring inside. */
export function khatam(cx: number, cy: number, r: number) {
  const sq = (turn: number) =>
    poly([0, 1, 2, 3].map((k) => {
      const a = turn + (k * Math.PI) / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
    }));
  return `${sq(Math.PI / 4)} ${sq(0)} ${circle(cx, cy, r * 0.38)}`;
}

// ---------- pointed (two-centred) arches ----------

/** A pointed arch: jambs at left/right, arcs of `radius` springing from y = spring. radius >= half the span. */
export type Arch = { left: number; right: number; spring: number; radius: number };

/** Radius that gives a pointed arch of the given span a given rise (apex height above the spring line). */
export function archRadius(span: number, rise: number) {
  return Math.max(span / 2, (rise * rise + (span * span) / 4) / span);
}

/** y of the apex, where the two arcs meet on the axis. */
export function archApex({ left, right, spring, radius }: Arch) {
  const off = radius - (right - left) / 2; // arc centre's distance from the axis
  return spring - Math.sqrt(radius * radius - off * off);
}

/** Point on the arch at angle phi (radians) above the spring line; side -1 = left arc, 1 = right arc. */
export function archPoint(a: Arch, phi: number, side: -1 | 1, radius = a.radius): Pt {
  const centre = side < 0 ? a.left + a.radius : a.right - a.radius;
  return [centre + side * Math.cos(phi) * radius, a.spring - Math.sin(phi) * radius];
}

/** Angle above the spring line at which the arcs meet. */
export function apexAngle(a: Arch) {
  return Math.acos((a.radius - (a.right - a.left) / 2) / a.radius);
}

/** Open path: up the left jamb from `base`, over the pointed head, down the right jamb. */
export function pointedArch(a: Arch, base: number) {
  const r = r1(a.radius);
  const apex: Pt = [(a.left + a.right) / 2, archApex(a)];
  return `M${fmt([a.left, base])} V${r1(a.spring)} A${r} ${r} 0 0 1 ${fmt(apex)} A${r} ${r} 0 0 1 ${fmt([a.right, a.spring])} V${r1(base)}`;
}

/** The arch head as a closed shape (closed along the spring line). */
export const archHead = (a: Arch) => pointedArch(a, a.spring) + " Z";

/** The concentric arch `band` units inside this one (same arc centres). */
export const insetArch = (a: Arch, band: number): Arch => ({
  left: a.left + band,
  right: a.right - band,
  spring: a.spring,
  radius: a.radius - band,
});

/**
 * Voussoir blocks across the band between the arch and its inset, n per side, from the spring line to the apex.
 * Returns two path strings: even blocks and odd blocks (for striped ablaq masonry).
 */
export function voussoirs(a: Arch, band: number, n: number) {
  const inner = a.radius - band;
  const top = apexAngle(a);
  const out = ["", ""];
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < n; i++) {
      const p0 = (top * i) / n, p1 = (top * (i + 1)) / n;
      const o0 = archPoint(a, p0, side), o1 = archPoint(a, p1, side);
      const i0 = archPoint(a, p0, side, inner), i1 = archPoint(a, p1, side, inner);
      // Rising along the left arc turns clockwise (sweep 1); along the right arc, counter-clockwise.
      const up = side < 0 ? 1 : 0, down = 1 - up;
      out[i % 2] +=
        `M${fmt(i0)} L${fmt(o0)} A${r1(a.radius)} ${r1(a.radius)} 0 0 ${up} ${fmt(o1)} ` +
        `L${fmt(i1)} A${r1(inner)} ${r1(inner)} 0 0 ${down} ${fmt(i0)} Z `;
    }
  }
  return { even: out[0].trim(), odd: out[1].trim() };
}

/** Rows of small pointed niches (muqarnas), `tiers` rows between y and y + depth, each row offset by half a cell. */
export function muqarnas(x0: number, x1: number, y: number, depth: number, cells: number, tiers = 2) {
  const h = depth / tiers;
  let d = `M${r1(x0)} ${r1(y)} H${r1(x1)}`;
  for (let t = 0; t < tiers; t++) {
    const n = cells + (t % 2);
    const w = (x1 - x0) / n;
    const top = y + t * h, bot = top + h;
    for (let i = 0; i < n; i++) {
      const xa = x0 + i * w, xb = xa + w, mid = xa + w / 2;
      d += ` M${r1(xa)} ${r1(bot)} Q${r1(xa)} ${r1(top + h * 0.3)} ${r1(mid)} ${r1(top + h * 0.08)} Q${r1(xb)} ${r1(top + h * 0.3)} ${r1(xb)} ${r1(bot)}`;
    }
    d += ` M${r1(x0)} ${r1(bot)} H${r1(x1)}`;
  }
  return d;
}

// ---------- botanicals ----------

/** An almond leaf from its base, `len` long, pointing at `angle` degrees (0 = right, 90 = down). */
export function leaf(x: number, y: number, len: number, angle: number, width = len * 0.28, midrib = true) {
  const a = rad(angle), c = Math.cos(a), s = Math.sin(a);
  const tip: Pt = [x + c * len, y + s * len];
  const mx = x + c * len * 0.45, my = y + s * len * 0.45;
  const n: Pt = [-s * width, c * width];
  let d = `M${fmt([x, y])} Q${fmt([mx + n[0], my + n[1]])} ${fmt(tip)} Q${fmt([mx - n[0], my - n[1]])} ${fmt([x, y])}Z`;
  if (midrib) d += ` M${fmt([x, y])} L${fmt([x + c * len * 0.8, y + s * len * 0.8])}`;
  return d;
}

/** Quadratic Bézier point and unit tangent. */
function quad(p0: Pt, p1: Pt, p2: Pt, t: number) {
  const u = 1 - t;
  const pt: Pt = [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  const m = Math.hypot(dx, dy) || 1;
  return { pt, tan: [dx / m, dy / m] as Pt };
}

/** A tapering trunk along a quadratic curve: its two edges, plus the curve itself for decorating. */
function trunk(base: Pt, ctrl: Pt, top: Pt, wBase: number, wTop: number, steps = 14) {
  const left: Pt[] = [], right: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const { pt, tan } = quad(base, ctrl, top, t);
    const w = (wBase + (wTop - wBase) * t) / 2;
    left.push([pt[0] + tan[1] * w, pt[1] - tan[0] * w]);
    right.push([pt[0] - tan[1] * w, pt[1] + tan[0] * w]);
  }
  return { left, right, at: (t: number) => quad(base, ctrl, top, t) };
}

/** A date palm: ringed trunk, a crown of drooping fronds with leaflets, and a skirt of dead fronds. */
export function palm(x: number, base: number, height: number, lean: number, seed: number) {
  const r = rng(seed);
  const top: Pt = [x + lean, base - height];
  const tr = trunk([x, base], [x + lean * 0.15, base - height * 0.55], top, height * 0.065, height * 0.04);
  const outline = poly([...tr.left, ...[...tr.right].reverse()]); // closed, so it can hide what is behind

  // Leaf-base scars: chevrons across the trunk, closer together near the crown.
  let rings = "";
  for (let t = 0.04; t < 0.96; t += 0.045 - t * 0.012) {
    const i = Math.round(t * 14);
    const [l, rr] = [tr.left[i], tr.right[i]];
    const { pt } = tr.at(t);
    rings += ` M${fmt(l)} L${fmt([pt[0], pt[1] + height * 0.012])} L${fmt(rr)}`;
  }

  // Fronds fan out from the top and droop under their own weight.
  let fronds = "";
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = rad(-172 + (i * 164) / (n - 1) + (r() - 0.5) * 10);
    const len = height * (0.42 + r() * 0.14) * (1 - Math.abs(Math.sin(a)) * 0.25);
    const droop = len * (0.35 + 0.35 * Math.abs(Math.cos(a)));
    const tip: Pt = [top[0] + Math.cos(a) * len, top[1] + Math.sin(a) * len + droop];
    const ctrl: Pt = [top[0] + Math.cos(a) * len * 0.55, top[1] + Math.sin(a) * len * 0.55 - len * 0.12];
    fronds += ` M${fmt(top)} Q${fmt(ctrl)} ${fmt(tip)}`;
    for (let k = 1; k <= 11; k++) {
      const t = 0.12 + (k / 11) * 0.86;
      const { pt, tan } = quad(top, ctrl, tip, t);
      const ll = len * 0.2 * (1 - t * 0.6);
      for (const sgn of [-1, 1]) {
        // Leaflets angle forward along the rachis and sag downward.
        const dx = tan[0] * 0.55 + -tan[1] * sgn * 0.85;
        const dy = tan[1] * 0.55 + tan[0] * sgn * 0.85 + 0.45;
        const m = Math.hypot(dx, dy);
        fronds += `M${Math.round(pt[0])} ${Math.round(pt[1])}l${Math.round((dx / m) * ll)} ${Math.round((dy / m) * ll)}`;
      }
    }
  }
  // Dead fronds hanging under the crown.
  let skirt = "";
  for (let i = 0; i < 5; i++) {
    const ox = (i - 2) * height * 0.025;
    const sx = top[0] + ox, sy = top[1] + height * 0.03;
    skirt += ` M${fmt([sx, sy])} q${r1(ox * 1.5)} ${r1(height * 0.08)} ${r1(ox * 2.2 + (r() - 0.5) * 4)} ${r1(height * (0.14 + r() * 0.06))}`;
  }
  return { trunk: outline, rings: rings.trim(), fronds: fronds.trim(), skirt: skirt.trim(), top };
}

/**
 * A eucalyptus: a tall pale trunk that forks into slender limbs, with pendulous clusters of narrow leaves.
 * `dark` leaves are drawn solid to give the crown its shadow side.
 */
export function eucalyptus(x: number, base: number, height: number, seed: number) {
  const r = rng(seed);
  const lean = (r() - 0.5) * height * 0.12;
  const forkT = 0.48 + r() * 0.1;
  const fork: Pt = [x + lean * forkT, base - height * forkT];
  const tr = trunk([x, base], [x - lean * 0.3, base - height * forkT * 0.5], fork, height * 0.05, height * 0.032, 8);
  let wood = `${poly(tr.left, false)} ${poly(tr.right, false)}`;
  // Peeling-bark marks: a few short strokes down the trunk.
  for (let i = 1; i < 7; i++) {
    const { pt } = tr.at(i / 7);
    wood += ` M${fmt([pt[0] + (r() - 0.5) * height * 0.02, pt[1]])} l0 ${r1(height * 0.025)}`;
  }

  const tips: Pt[] = [];
  const limb = (p: Pt, a: number, len: number, depth: number) => {
    const t: Pt = [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len];
    const bend = (r() - 0.5) * 0.6;
    const c: Pt = [p[0] + Math.cos(a + bend) * len * 0.5, p[1] + Math.sin(a + bend) * len * 0.5];
    wood += ` M${fmt(p)} Q${fmt(c)} ${fmt(t)}`;
    tips.push(t);
    if (depth === 0) return;
    tips.push([(p[0] + t[0]) / 2, (p[1] + t[1]) / 2]);
    for (const turn of [-0.45, 0.4]) limb(t, a + turn + (r() - 0.5) * 0.3, len * (0.62 + r() * 0.1), depth - 1);
  };
  const limbs = 2 + Math.floor(r() * 2);
  for (let i = 0; i < limbs; i++) {
    const a = rad(-90 + (i / Math.max(1, limbs - 1) - 0.5) * 60 + (r() - 0.5) * 16);
    limb(fork, a, height * (0.2 + r() * 0.06), 2);
  }

  // Loose, drooping clusters around each twig. Light leaves are single curved strokes and dark ones small
  // filled blades, both in whole relative units to keep the markup small.
  let light = "", dark = "";
  const ri = Math.round;
  for (const [cx, cy] of tips) {
    const count = 7 + Math.floor(r() * 4);
    for (let k = 0; k < count; k++) {
      const lx = cx + (r() - 0.5) * height * 0.13, ly = cy + (r() - 0.4) * height * 0.07;
      const len = height * (0.05 + r() * 0.035);
      const a = rad(90 + (lx - cx) * 1.2 + (r() - 0.5) * 50);
      const ex = Math.cos(a) * len, ey = Math.sin(a) * len;
      const bx = -Math.sin(a) * len * 0.18, by = Math.cos(a) * len * 0.18; // sideways bow
      const start = `M${ri(lx)} ${ri(ly)}`;
      if (r() < 0.15) {
        dark += ` ${start}q${ri(ex / 2 + bx)} ${ri(ey / 2 + by)} ${ri(ex)} ${ri(ey)}q${ri(-ex / 2 + bx)} ${ri(-ey / 2 + by)} ${ri(-ex)} ${ri(-ey)}z`;
      } else {
        light += ` ${start}q${ri(ex / 2 + bx)} ${ri(ey / 2 + by)} ${ri(ex)} ${ri(ey)}`;
      }
    }
  }
  return { wood, light: light.trim(), dark: dark.trim() };
}

/** An agave rosette: long pointed leaves radiating up from a base point. */
export function agave(x: number, base: number, size: number, n = 9) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = rad(-160 + (i * 140) / (n - 1));
    const len = size * (0.7 + 0.3 * Math.sin((i / (n - 1)) * Math.PI));
    const tip: Pt = [x + Math.cos(a) * len, base + Math.sin(a) * len * 0.9];
    const w = size * 0.07;
    d += ` M${fmt([x - w, base])} Q${fmt([x + Math.cos(a) * len * 0.5 - w, base + Math.sin(a) * len * 0.5])} ${fmt(tip)}`;
    d += ` Q${fmt([x + Math.cos(a) * len * 0.5 + w, base + Math.sin(a) * len * 0.5])} ${fmt([x + w, base])}`;
  }
  return d.trim();
}

/** Short tufts of grass along the ground line. */
export function grass(x0: number, x1: number, y: number, seed: number, every = 22) {
  const r = rng(seed);
  let d = "";
  for (let x = x0; x < x1; x += every * (0.6 + r() * 0.8)) {
    const h = 3 + r() * 5;
    d += ` M${r1(x)} ${r1(y)} l${r1(-1 - r() * 2)} ${r1(-h)} M${r1(x + 2)} ${r1(y)} l${r1(r() * 2)} ${r1(-h * 0.8)}`;
  }
  return d.trim();
}

