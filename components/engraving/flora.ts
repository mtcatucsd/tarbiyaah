import { rng, type Pt } from "@/components/engraving/shapes";

// Plants in the manner of a 19th-century botanical engraving: tone comes only from the density of
// short ink strokes. Each plant is drawn once in local units (base at 0,0, up is negative) and reused
// as an SVG <symbol> wherever it appears (see defs.tsx).

const R = Math.round;
const rad = (d: number) => (d * Math.PI) / 180;

function quad(p0: Pt, p1: Pt, p2: Pt, t: number) {
  const u = 1 - t;
  const pt: Pt = [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  const m = Math.hypot(dx, dy) || 1;
  return { pt, tan: [dx / m, dy / m] as Pt };
}

/** Palm symbol bounds: base at (0, 0), height 340. */
export const PALM_BOX = { x: -175, y: -330, w: 350, h: 345 };

/**
 * A palm with a tall, slightly leaning trunk and a full crown: upper fronds rise in a fan, middle ones
 * spread, lower ones droop below the crown. Leaflets are short strokes angled forward along each
 * rachis, longest mid-frond, so each frond reads as a feather.
 */
export function engravedPalm(seed: number) {
  const r = rng(seed);
  const H = 330;
  const top: Pt = [R((r() - 0.5) * 10), -R(H * 0.6)];
  const lean = top[0];

  // Trunk: solid ink, tapering, with paper flecks for the rough bark.
  const steps = 16, left: Pt[] = [], right: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, y = top[1] * t, x = lean * t * t;
    const w = 9 - t * 2.6 + (r() - 0.5) * 0.8;
    left.push([x - w, y]); right.push([x + w, y]);
  }
  const trunk = "M" + [...left, ...right.reverse()].map(([x, y]) => `${R(x)} ${R(y)}`).join("L") + "Z";
  let bark = "";
  for (let i = 0; i < 70; i++) {
    const t = r() * 0.95, y = top[1] * t, x = lean * t * t + (r() - 0.5) * 12;
    bark += `M${R(x)} ${R(y)}h${R(1 + r() * 3)}`;
  }

  // Fronds.
  let fronds = "";
  const frond = (a: number, len: number, droop: number, density: number) => {
    const start: Pt = [top[0] + Math.cos(a) * 4, top[1] + Math.sin(a) * 4];
    const ctrl: Pt = [start[0] + Math.cos(a) * len * 0.55, start[1] + Math.sin(a) * len * 0.55 - len * 0.08];
    const tip: Pt = [start[0] + Math.cos(a) * len, start[1] + Math.sin(a) * len + droop];
    fronds += `M${R(start[0])} ${R(start[1])}Q${R(ctrl[0])} ${R(ctrl[1])} ${R(tip[0])} ${R(tip[1])}`;
    const m = Math.round(24 * density);
    for (let k = 1; k <= m; k++) {
      const t = 0.08 + (k / m) * 0.92;
      const { pt, tan } = quad(start, ctrl, tip, t);
      const ll = len * 0.15 * Math.sin(Math.PI * Math.min(1, 0.25 + t * 0.85)) * (0.8 + r() * 0.4) + 2;
      for (const s of [-1, 1]) {
        // Forward along the rachis, out to the side, and a little down.
        let dx = tan[0] * 0.75 - tan[1] * s * 0.66, dy = tan[1] * 0.75 + tan[0] * s * 0.66 + 0.22;
        const mm = Math.hypot(dx, dy); dx /= mm; dy /= mm;
        fronds += `M${R(pt[0])} ${R(pt[1])}l${R(dx * ll)} ${R(dy * ll)}`;
      }
    }
  };
  // Upper fan (rising), then spreading, then drooping fronds hanging under the crown.
  for (let i = 0; i < 11; i++) frond(rad(-160 + i * 14 + (r() - 0.5) * 8), H * (0.34 + r() * 0.1), H * 0.05 * r(), 1);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const a = s < 0 ? rad(-178 - i * 10 + (r() - 0.5) * 6) : rad(-2 + i * 10 + (r() - 0.5) * 6);
    frond(a, H * (0.36 + r() * 0.08), H * (0.12 + i * 0.05), 0.95);
  }
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
    const a = s < 0 ? rad(150 - i * 22) : rad(30 + i * 22);
    frond(a, H * (0.22 + r() * 0.06), H * 0.08, 0.8);
  }

  // A dark heart where the fronds meet, and a scruffy tuft of ground.
  const heart = `M${top[0] - 12} ${top[1] + 4}Q${top[0]} ${top[1] - 12} ${top[0] + 12} ${top[1] + 4}Q${top[0]} ${top[1] + 16} ${top[0] - 12} ${top[1] + 4}Z`;
  let ground = "";
  for (let i = 0; i < 46; i++) {
    const x = (r() - 0.5) * 120 * (0.4 + r() * 0.6), y = 2 + r() * 8 * (1 - Math.abs(x) / 70);
    ground += r() < 0.55 ? `M${R(x)} ${R(y)}h${R(2 + r() * 6)}` : `M${R(x)} ${R(y)}l${R((r() - 0.5) * 4)} ${R(-3 - r() * 7)}`;
  }
  return { trunk, bark, fronds, heart, ground };
}

// ---------- undergrowth ----------
// A mass of foreground planting after the botanical-engraving style: long sword leaves that arch and cross,
// feathery fern fronds, and spiky fan bursts, in two tones (a lighter one for what sits behind, a darker one in front).
// Drawn once in local units (base at 0,0, up is negative) and reused through the sprite.

const f1 = (n: number) => String(Math.round(n * 10) / 10);
const pt = (x: number, y: number) => `${f1(x)} ${f1(y)}`;

/** Undergrowth symbol bounds. */
export const GROW_BOX = { x: -204, y: -126, w: 408, h: 132 };

type Pair = [number, number];
const qpt = (p0: Pair, p1: Pair, p2: Pair, t: number): Pair => {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
};
const qtan = (p0: Pair, p1: Pair, p2: Pair, t: number): Pair => {
  const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  const m = Math.hypot(dx, dy) || 1;
  return [dx / m, dy / m];
};

export function engravedUndergrowth(seed: number) {
  const r = rng(seed);
  // Where a leaf leaves the ground, leans by `lean` (radians from vertical, negative = left), is `len` long
  // and droops by `droop` at its tip: a quadratic arch.
  const arch = (bx: number, lean: number, len: number, droop: number) => {
    const p0: Pair = [bx, 0];
    const p1: Pair = [bx + Math.sin(lean) * len * 0.62, -Math.cos(lean) * len * 0.78];
    // The tip droops but never dips below the ground line.
    const p2: Pair = [bx + Math.sin(lean) * len * 1.05 + Math.sign(lean || 1) * len * 0.22, Math.min(-6, -Math.cos(lean) * len * 0.62 + droop)];
    return [p0, p1, p2] as const;
  };

  // Sword leaves: tapered blades, filled, with fine veins along their length.
  let swordBlade = "", swordVeins = "";
  const sword = (bx: number, lean: number, len: number, w: number, droop: number) => {
    const [p0, p1, p2] = arch(bx, lean, len, droop);
    const L: Pair[] = [], R: Pair[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, c = qpt(p0, p1, p2, t), tg = qtan(p0, p1, p2, t);
      const half = (w / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.08)), 0.7) * (1 - t * 0.55);
      L.push([c[0] + tg[1] * half, c[1] - tg[0] * half]); R.push([c[0] - tg[1] * half, c[1] + tg[0] * half]);
    }
    swordBlade += "M" + [...L, ...R.reverse()].map(([x, y]) => pt(x, y)).join("L") + "Z";
    for (const off of [-0.28, 0.28]) { // veins, offset either side of the midrib
      let v = "";
      for (let i = 1; i <= 13; i++) {
        const t = i / 14, c = qpt(p0, p1, p2, t), tg = qtan(p0, p1, p2, t);
        const half = (w / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.08)), 0.7) * (1 - t * 0.55);
        v += `${i === 1 ? "M" : "L"}${pt(c[0] + tg[1] * half * off * 2, c[1] - tg[0] * half * off * 2)}`;
      }
      swordVeins += v;
    }
  };
  for (let i = 0; i < 11; i++) {
    const lean = rad(-62 + (i * 124) / 10 + (r() - 0.5) * 8);
    sword(-70 + (i * 140) / 10 + (r() - 0.5) * 14, lean, 88 + r() * 24, 7 + r() * 3, 8 + r() * 14);
  }

  // Fern fronds: an arching rachis with dense leaflet strokes down both sides; `back` ones are drawn in the lighter tone.
  const frond = (bx: number, lean: number, len: number, droop: number, leafLen: number) => {
    const [p0, p1, p2] = arch(bx, lean, len, droop);
    let d = "M" + pt(p0[0], p0[1]) + "Q" + pt(p1[0], p1[1]) + " " + pt(p2[0], p2[1]);
    const n = 24;
    for (let i = 2; i <= n; i++) {
      const t = i / n, c = qpt(p0, p1, p2, t), tg = qtan(p0, p1, p2, t);
      const ll = leafLen * 1.25 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.04)) * (1 - t * 0.35) * (0.85 + r() * 0.3) + 1.5;
      for (const sgn of [-1, 1]) {
        // forward along the rachis and out to the side, with a slight downward sag
        let dx = tg[0] * 0.5 + tg[1] * sgn * 0.85, dy = tg[1] * 0.5 - tg[0] * sgn * 0.85 + 0.28;
        const m = Math.hypot(dx, dy); dx /= m; dy /= m;
        d += `M${pt(c[0], c[1])}q${f1(dx * ll * 0.5 + dy * ll * 0.08 * sgn)} ${f1(dy * ll * 0.5)} ${f1(dx * ll)} ${f1(dy * ll)}`;
      }
    }
    return d;
  };
  let fernBack = "", fernFront = "";
  for (let i = 0; i < 4; i++) fernBack += frond(-48 + i * 32 + (r() - 0.5) * 10, rad(-68 + i * 44 + (r() - 0.5) * 10), 66 + r() * 18, 14 + r() * 10, 17);
  for (let i = 0; i < 4; i++) fernFront += frond(-60 + i * 40 + (r() - 0.5) * 10, rad(-76 + i * 50 + (r() - 0.5) * 10), 54 + r() * 14, 18 + r() * 10, 15);

  // Fan bursts: thin spikes radiating from one point (filled, dark), a few of them hooking at the tip.
  let fan = "";
  const burst = (cx: number, cy: number, size: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = rad(-172 + (i * 164) / (n - 1) + (r() - 0.5) * 7), len = size * (0.62 + r() * 0.38);
      const hook = (r() - 0.5) * 0.5;
      const tip: Pair = [cx + Math.cos(a + hook) * len, cy + Math.sin(a + hook) * len + len * 0.1];
      const mid: Pair = [cx + Math.cos(a) * len * 0.55, cy + Math.sin(a) * len * 0.55];
      const w = 1;
      fan += `M${pt(cx - w, cy)}Q${pt(mid[0] - w, mid[1])} ${pt(tip[0], tip[1])}Q${pt(mid[0] + w, mid[1])} ${pt(cx + w, cy)}Z`;
    }
  };
  burst(-34, -28, 54, 12);
  burst(38, -24, 48, 11);
  // Low spiky blades across the front.
  let spikes = "";
  for (let i = 0; i < 9; i++) {
    const x = -105 + (i * 210) / 8 + (r() - 0.5) * 8, lean = (x / 110) * 0.7 + (r() - 0.5) * 0.4, len = 30 + r() * 26;
    const tip: Pair = [x + Math.sin(lean) * len, -Math.cos(lean) * len];
    spikes += `M${pt(x - 1.6, 0)}Q${pt(x + Math.sin(lean) * len * 0.4 - 0.9, -len * 0.5)} ${pt(tip[0], tip[1])}Q${pt(x + Math.sin(lean) * len * 0.4 + 1.2, -len * 0.5)} ${pt(x + 1.6, 0)}Z`;
  }
  return { swordBlade, swordVeins, fernBack, fernFront, fan, spikes };
}
