# Tarbiyyah Next.js Site + Campus Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the conference site in Next.js + Tailwind + shadcn/ui, copying torontotechweek.com's animations and components in our Islamic parchment/teal/gold theme, and add a `/map` guest guide (MapLibre + UCSD venues) modelled on torontotechweek.github.io.

**Architecture:** Next.js App Router static export. Pure logic (`lib/`) and data (`data/`) are framework-free and unit-tested with Vitest; UI is small one-job components; motion is CSS keyframes driven by three tiny hooks. One `data/` source (venues + sessions) feeds both the home-page schedule and the map.

**Tech Stack:** Next.js (current stable, App Router), TypeScript strict, Tailwind CSS v4, shadcn/ui (Radix), next-themes, lucide-react, maplibre-gl, OpenFreeMap tiles, Vitest, npm, Node ≥ 20.

**Spec:** `docs/superpowers/specs/2026-09-29-nextjs-site-and-map-design.md` (supersedes the vanilla spec/plan, which are kept only for history).

## Global Constraints

- Keep it simple and readable (user's top requirement): one component per file, one job per hook, no state library, no CMS, no animation library, no data fetching except map style/tiles.
- Static export: `output: 'export'`, no server features (no API routes, no `next/image` optimisation, no middleware). Deploy at a domain root (assets referenced as `/star.svg`).
- Theme: light parchment default, dark teal/gold via `.dark` class (next-themes, `defaultTheme="system"`). Exact palette in Task 2; shadcn variable names are kept.
- Fonts: Geist (`--font-geist-sans`), Geist Mono (`--font-geist-mono`), Pinyon Script (`--font-pinyon`, hero wordmark only) via `next/font/google`.
- Ticket sales = redirect to `siteConfig.ticketUrl`; empty/non-http(s) URL falls back to `#tickets`. All copy is placeholder.
- All motion disabled under `prefers-reduced-motion`. Without JS, home-page content stays visible (noscript overrides in `app/layout.tsx`).
- Do not copy the reference sites' artwork, fonts or logos. Skyline, lanterns, medallion and lattice are original SVG.
- Map: MapLibre with OpenFreeMap (`https://tiles.openfreemap.org/styles/positron`, source id `openmaptiles`, font `Noto Sans Regular`/`Noto Sans Bold`). Venue `verified` may only be `true` after checking the official UC San Diego Campus Map (`https://campusmap.ucsd.edu/`) and listing that in `sources`.
- Times are stored as ISO 8601 with the `-08:00` offset and displayed in `America/Los_Angeles`.
- Commit with the trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (or the building model's trailer). The git root is above this folder and has unrelated uncommitted changes: always `git add` explicit paths and `git commit -- <paths>`.

## Review Focus

1. Countdown date invalid or in the past → zeros, never `NaN` (unit test, Task 2).
2. Ticket URL empty / `javascript:` / scheme-less → buttons link to `#tickets` (unit test, Task 2).
3. `/map?venue=nope` or `?session=nope` (typo, stale link) → ignored, map opens at the default view without crashing (unit test, Task 3; browser check, Task 11).
4. Map style/tiles blocked or WebGL unavailable → visible message, session list and campus-map link still work (manual, Task 11).
5. Switching light/dark on `/map` → map restyles and the selected venue ring and pins survive (manual, Task 11).

## File Structure

```
app/layout.tsx, app/page.tsx, app/map/page.tsx, app/globals.css
components/ui/*            shadcn generated
components/site/           reveal, section, ticket-button, theme-toggle, nav, footer,
                           hero/{hero,lattice,arch-frame,skyline,lanterns}.tsx,
                           hud/{hud,countdown,medallion}.tsx, stats.tsx, plate.tsx,
                           about.tsx, schedule.tsx, speakers.tsx, tickets.tsx, faq.tsx
components/map/            map-experience, map-view, venue-card, session-list, day-tabs
hooks/                     use-in-view.ts, use-count-up.ts, use-hide-on-scroll.ts
lib/                       format.ts, site-config.ts, map-data.ts, map-style.ts, map-config.ts
data/                      types.ts, venues.ts, sessions.ts, speakers.ts
public/                    star.svg, msalogo.jpg
tests/                     format.test.ts, map-data.test.ts, map-style.test.ts
legacy/                    old static prototype (removed in Task 13)
```

---

### Task 1: Scaffold Next.js, Tailwind, shadcn and tooling

**Files:**
- Create: everything `create-next-app` and `shadcn` generate, `vitest.config.ts`, `public/star.svg`, `public/msalogo.jpg`
- Modify: `next.config.ts`, `package.json`
- Move: `index.html`, `assets/` → `legacy/`

**Interfaces:**
- Produces: working `npm run dev|build|test`; `cn()` in `lib/utils.ts`; shadcn components `button card tabs accordion dialog sheet scroll-area badge tooltip` in `components/ui/`; `@/` alias.

- [ ] **Step 1: Check tooling**

Run: `node --version && npm --version`
Expected: Node `v20` or higher.

- [ ] **Step 2: Park the old static prototype**

Run (from the project folder `tarbiyaah/`):
```bash
mkdir -p legacy public
cp assets/msalogo.jpg public/msalogo.jpg
git mv index.html legacy/index.html
git mv assets legacy/assets
```
Expected: no errors; `legacy/index.html` exists.

- [ ] **Step 3: Scaffold Next.js in place**

Run:
```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --turbopack --yes
```
If it refuses because the folder is not empty (it lists conflicting files), scaffold elsewhere and copy in:
```bash
npx create-next-app@latest ../tarbiyaah-next --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --turbopack --yes
cp -R ../tarbiyaah-next/. . && rm -rf ../tarbiyaah-next
```
Expected: `package.json`, `app/`, `tsconfig.json`, `next.config.ts` exist; `npm run dev` would start.

- [ ] **Step 4: Install shadcn/ui and components**

Run:
```bash
npx shadcn@latest init -d
npx shadcn@latest add button card tabs accordion dialog sheet scroll-area badge tooltip
```
Expected: `components.json`, `components/ui/*.tsx`, `lib/utils.ts` created; `app/globals.css` gains shadcn variables (Task 2 replaces them).

- [ ] **Step 5: Install runtime and test dependencies**

Run:
```bash
npm install next-themes maplibre-gl lucide-react
npm install -D vitest
```

- [ ] **Step 6: Configure static export and tests**

Replace `next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(process.cwd()) } },
});
```

In `package.json` add to `"scripts"`: `"test": "vitest run --passWithNoTests"`.

Create `public/star.svg` (used as a CSS mask; colour comes from CSS):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g fill="none" stroke="#000" stroke-width="0.8"><polygon points="50,12 57.65,31.52 76.87,23.13 68.48,42.35 88,50 68.48,57.65 76.87,76.87 57.65,68.48 50,88 42.35,68.48 23.13,76.87 31.52,57.65 12,50 31.52,42.35 23.13,23.13 42.35,31.52"/><circle cx="50" cy="50" r="6"/><path d="M88 50H100M0 50H12M50 0V12M50 88V100"/><path d="M0 -12L12 0L0 12L-12 0ZM100 -12L112 0L100 12L88 0ZM0 88L12 100L0 112L-12 100ZM100 88L112 100L100 112L88 100Z"/></g></svg>
```

- [ ] **Step 7: Verify build and tests run**

Run: `npm run build && npm test`
Expected: build succeeds and writes `out/`; vitest prints "No test files found" and exits 0.

- [ ] **Step 8: Commit**

```bash
git add -A -- . ':!node_modules' ':!.next' ':!out'
git status --short -- . | head -40
```
Confirm only files inside this folder are staged, then:
```bash
git commit -m "Scaffold Next.js, Tailwind, shadcn/ui and Vitest; park static prototype in legacy/

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- .
```

---

### Task 2: Theme tokens, global CSS, fonts, hooks, `format` helpers (+ tests)

**Files:**
- Create: `lib/format.ts`, `lib/site-config.ts`, `tests/format.test.ts`, `hooks/use-in-view.ts`, `hooks/use-count-up.ts`, `hooks/use-hide-on-scroll.ts`, `components/site/reveal.tsx`, `components/site/theme-toggle.tsx`
- Modify: `app/globals.css` (replace), `app/layout.tsx` (replace)

**Interfaces:**
- Produces: `splitTime(ms) -> {days,hours,minutes,seconds}`, `ticketHref(url) -> string`, `countValue(target, progress) -> number` (lib/format); `siteConfig` `{name, eventDate, dateText, venueText, ticketUrl, timeZone}`; `useInView<T>(threshold?) -> {ref, inView}`; `useCountUp(target, active, duration?) -> number`; `useHideOnScroll() -> boolean`; `<Reveal as? delay? fade? className>`; `<ThemeToggle/>`; CSS utilities `mono-label`, `.draw`, `.draw-abs`, `.spine`, `.plate`, `.portrait`, `.lattice`, `.lattice-fade`, `.hero-bg`, `.nav-notch`, `.page-frame`, `.flicker-once`, `.spin-slow`, `.spin-slow-reverse`, `.glow`, `.sk-*`; `data-reveal` / `data-in-view` attributes.

- [ ] **Step 1: Write the failing tests**

`tests/format.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { countValue, splitTime, ticketHref } from "@/lib/format";

describe("splitTime", () => {
  it("breaks milliseconds into days/hours/minutes/seconds", () => {
    const ms = ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000;
    expect(splitTime(ms)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });
  it("returns zeros for past, zero and invalid input", () => {
    const zeros = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    expect(splitTime(-5000)).toEqual(zeros);
    expect(splitTime(0)).toEqual(zeros);
    expect(splitTime(NaN)).toEqual(zeros);
    expect(splitTime(new Date("not a date").getTime() - Date.now())).toEqual(zeros);
  });
});

describe("ticketHref", () => {
  it("accepts http(s) urls only", () => {
    expect(ticketHref("https://typeform.com/to/abc")).toBe("https://typeform.com/to/abc");
    expect(ticketHref("http://example.com")).toBe("http://example.com");
    expect(ticketHref("")).toBe("#tickets");
    expect(ticketHref(undefined)).toBe("#tickets");
    expect(ticketHref("javascript:alert(1)")).toBe("#tickets");
    expect(ticketHref("typeform.com/to/abc")).toBe("#tickets");
  });
});

describe("countValue", () => {
  it("eases from 0 to target and clamps progress", () => {
    expect(countValue(500, 0)).toBe(0);
    expect(countValue(500, 1)).toBe(500);
    expect(countValue(500, 2)).toBe(500);
    expect(countValue(500, -1)).toBe(0);
    const mid = countValue(500, 0.5);
    expect(mid).toBeGreaterThan(250);
    expect(mid).toBeLessThan(500);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/format`.

- [ ] **Step 3: Implement `lib/format.ts` and `lib/site-config.ts`**

`lib/format.ts`:
```ts
// Pure helpers (no DOM) so they can be unit-tested.

export function splitTime(ms: number) {
  if (!(ms > 0)) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function ticketHref(url?: string) {
  return typeof url === "string" && /^https?:\/\//.test(url) ? url : "#tickets";
}

export function countValue(target: number, progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  return Math.round(target * (1 - Math.pow(1 - p, 3)));
}
```

`lib/site-config.ts`:
```ts
// The one file to edit for event details. eventDate is a placeholder.
export const siteConfig = {
  name: "Tarbiyyah Conference",
  eventDate: "2026-12-05T09:00:00-08:00",
  dateText: "TBD 2026",
  venueText: "UC San Diego",
  ticketUrl: "https://typeform.com/to/placeholder",
  timeZone: "America/Los_Angeles",
} as const;
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: 4 test groups pass.

- [ ] **Step 5: Replace `app/globals.css`**

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --frame: min(1280px, 92vw);
  --background: #f4efe3;
  --foreground: #12403b;
  --card: #f4efe3;
  --card-foreground: #12403b;
  --popover: #f4efe3;
  --popover-foreground: #12403b;
  --primary: #12403b;
  --primary-foreground: #f4efe3;
  --secondary: #ece5d4;
  --secondary-foreground: #12403b;
  --muted: #ece5d4;
  --muted-foreground: #4a6b66;
  --accent: #ece5d4;
  --accent-foreground: #12403b;
  --destructive: #b5573a;
  --border: #c9c2b0;
  --input: #c9c2b0;
  --ring: #a87a26;
  --gold: #a87a26;
  --gold-text: #7d5a1a;
  --terracotta: #b5573a;
  --blue: #3a6a99;
  --green: #3f7a5a;
}

.dark {
  --background: #0b2f2c;
  --foreground: #f3ede0;
  --card: #0f3a36;
  --card-foreground: #f3ede0;
  --popover: #0f3a36;
  --popover-foreground: #f3ede0;
  --primary: #f3ede0;
  --primary-foreground: #0b2f2c;
  --secondary: #0f3a36;
  --secondary-foreground: #f3ede0;
  --muted: #0f3a36;
  --muted-foreground: #b9c6bd;
  --accent: #124a45;
  --accent-foreground: #f3ede0;
  --destructive: #e08a6a;
  --border: rgba(227, 195, 128, 0.3);
  --input: rgba(227, 195, 128, 0.3);
  --ring: #e3c380;
  --gold: #e3c380;
  --gold-text: #e3c380;
  --terracotta: #e08a6a;
  --blue: #8fb3dc;
  --green: #7fc29b;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-gold: var(--gold);
  --color-gold-text: var(--gold-text);
  --color-terracotta: var(--terracotta);
  --color-blue: var(--blue);
  --color-green: var(--green);
  --font-sans: var(--font-geist-sans), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --font-script: var(--font-pinyon), "Snell Roundhand", cursive;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --animate-accordion-down: accordion-down 0.3s var(--ease-out-expo);
  --animate-accordion-up: accordion-up 0.3s var(--ease-out-expo);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  html { scroll-behavior: smooth; scroll-padding-top: 90px; }
  body { @apply bg-background text-foreground font-sans antialiased; }
  h1, h2, h3 { @apply font-medium tracking-tight; }
}

@utility mono-label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

/* ---------- page frame: two hairline rules ---------- */
.page-frame { position: relative; }
.page-frame::before, .page-frame::after {
  content: ""; position: absolute; top: 0; bottom: 0; width: 1px;
  background: var(--border); pointer-events: none; z-index: 1;
}
.page-frame::before { left: calc((100% - var(--frame)) / 2); }
.page-frame::after { right: calc((100% - var(--frame)) / 2); }

/* ---------- reveal + stroke drawing (driven by data-in-view) ---------- */
[data-reveal] {
  opacity: 0; transform: translateY(18px);
  transition: opacity 0.8s var(--ease-out-expo), transform 0.8s var(--ease-out-expo);
  transition-delay: calc(var(--d, 0) * 90ms);
}
[data-reveal][data-in-view="true"] { opacity: 1; transform: none; }

.draw {
  stroke-dasharray: 1; stroke-dashoffset: 1;
  transition: stroke-dashoffset 2.4s var(--ease-out-expo);
  transition-delay: calc(var(--d, 0) * 0.25s + 0.3s);
}
[data-in-view="true"] .draw { stroke-dashoffset: 0; }
.draw-abs {
  stroke-dasharray: 5000; stroke-dashoffset: 5000;
  transition: stroke-dashoffset 2.6s cubic-bezier(0.65, 0, 0.35, 1) 0.3s;
}
[data-in-view="true"] .draw-abs { stroke-dashoffset: 0; }

/* ---------- keyframe effects copied in spirit from torontotechweek.com ---------- */
@keyframes drift { to { mask-position: 160px 160px; -webkit-mask-position: 160px 160px; } }
@keyframes glow { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
@keyframes flicker {
  0% { opacity: 0; } 8% { opacity: 1; } 14% { opacity: 0; } 22% { opacity: 1; }
  30% { opacity: 0.2; } 44% { opacity: 1; } 100% { opacity: 1; }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-reverse { to { transform: rotate(-360deg); } }
.spin-slow { animation: spin 20s linear infinite; transform-origin: center; transform-box: fill-box; }
.spin-slow-reverse { animation: spin-reverse 15s linear infinite; transform-origin: center; transform-box: fill-box; }
[data-in-view="true"] .flicker-once { animation: flicker 0.6s steps(1) 1; }

/* ---------- hero ---------- */
.hero-bg {
  background:
    radial-gradient(ellipse 70% 55% at 50% 42%, color-mix(in srgb, var(--gold) 16%, transparent), transparent 70%),
    var(--background);
}
.lattice-fade {
  position: absolute; inset: 0; z-index: -2; pointer-events: none;
  -webkit-mask-image: radial-gradient(ellipse 60% 55% at 50% 48%, transparent 30%, #000 100%);
          mask-image: radial-gradient(ellipse 60% 55% at 50% 48%, transparent 30%, #000 100%);
}
.lattice {
  position: absolute; inset: 0; background: var(--gold); opacity: 0.22;
  -webkit-mask: url(/star.svg) 0 0 / 160px 160px;
          mask: url(/star.svg) 0 0 / 160px 160px;
  animation: drift 90s linear infinite;
}
.arch-line { fill: none; stroke: var(--gold); stroke-width: 1.2; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.sk path, .sk .lantern path { fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.sk-ink { stroke: var(--muted-foreground); }
.sk-gold { stroke: var(--gold); }
.sk-terra { stroke: var(--terracotta); }
.sk-blue { stroke: var(--blue); }
.sk-green { stroke: var(--green); }
.glow { fill: var(--gold); stroke: none; animation: glow 3s ease-in-out infinite; animation-delay: calc(var(--d, 0) * 0.6s); }

/* ---------- nav ---------- */
.nav-notch { clip-path: polygon(0 0, 100% 0, 100% 30%, calc(100% - 26px) 100%, 26px 100%, 0 30%); }

/* ---------- stat plate: four screw dots ---------- */
.plate {
  --dot: radial-gradient(circle, transparent 1.5px, var(--muted-foreground) 2px, var(--muted-foreground) 2.5px, transparent 3px);
  background-image: var(--dot), var(--dot), var(--dot), var(--dot);
  background-size: 10px 10px; background-repeat: no-repeat;
  background-position: 6px 6px, calc(100% - 6px) 6px, 6px calc(100% - 6px), calc(100% - 6px) calc(100% - 6px);
}

/* ---------- schedule spine ---------- */
.spine { position: relative; }
.spine::before {
  content: ""; position: absolute; top: 0; bottom: 0; left: 10px; width: 6px;
  border-inline: 1px solid var(--gold);
  transform: translateX(-50%) scaleY(0); transform-origin: top;
  transition: transform 1.8s var(--ease-out-expo);
}
[data-in-view="true"].spine::before { transform: translateX(-50%) scaleY(1); }
@media (min-width: 768px) { .spine::before { left: 50%; } }

/* ---------- speaker portrait (arch + star tint) ---------- */
.portrait {
  position: relative; overflow: hidden; width: 100%; aspect-ratio: 4 / 5;
  border: 1px solid var(--border); border-radius: 999px 999px 8px 8px; background: var(--secondary);
}
.portrait::after {
  content: ""; position: absolute; inset: 0; background: var(--gold); opacity: 0.35;
  -webkit-mask: url(/star.svg) center / 120px 120px; mask: url(/star.svg) center / 120px 120px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important; transition-delay: 0s !important; scroll-behavior: auto !important;
  }
}
```
Note: if the shadcn-generated `globals.css` defines `--animate-accordion-*` or keyframes `accordion-down/up`, keep those keyframes and remove any duplicate `--animate-accordion-*` lines so only the ones above remain.

- [ ] **Step 6: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Pinyon_Script } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const pinyon = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-pinyon" });

export const metadata: Metadata = {
  title: "Tarbiyyah Conference 2026 — MSA at UC San Diego",
  description: "A gathering of knowledge and community, presented by MSA at UC San Diego.",
  icons: { icon: "/msalogo.jpg" },
};

// Without JS nothing may stay hidden: show revealed content, drawn strokes and all tab panels.
const noscriptCss =
  "[data-reveal]{opacity:1!important;transform:none!important}" +
  ".draw,.draw-abs{stroke-dashoffset:0!important}" +
  ".spine::before{transform:translateX(-50%) scaleY(1)!important}" +
  "[role=tabpanel][hidden]{display:block!important}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} ${pinyon.variable}`}>
      <head>
        <noscript><style>{noscriptCss}</style></noscript>
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Hooks, Reveal and ThemeToggle**

`hooks/use-in-view.ts`:
```ts
"use client";
import { useEffect, useRef, useState } from "react";

// True once the element has scrolled into view (immediately if motion is reduced).
export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}
```

`hooks/use-count-up.ts`:
```ts
"use client";
import { useEffect, useState } from "react";
import { countValue } from "@/lib/format";

// Starts at the final value (so no-JS/SSR shows real numbers), then counts up from 0 once active.
export function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    setValue(0);
    const step = (now: number) => {
      const progress = (now - start) / duration;
      setValue(countValue(target, progress));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}
```

`hooks/use-hide-on-scroll.ts`:
```ts
"use client";
import { useEffect, useState } from "react";

// True while the user is scrolling down past the top of the page.
export function useHideOnScroll(threshold = 120) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setHidden(y > last && y > threshold);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return hidden;
}
```

`components/site/reveal.tsx`:
```tsx
"use client";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";

type Props = {
  as?: ElementType;
  delay?: number;      // stagger step (each step = 90ms for fades, 250ms for strokes)
  fade?: boolean;      // false = only set data-in-view (used by SVG stroke drawing)
  className?: string;
  children?: ReactNode;
};

export function Reveal({ as: Tag = "div", delay = 0, fade = true, className, children }: Props) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      data-reveal={fade ? "" : undefined}
      data-in-view={inView}
      style={{ "--d": delay } as CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  );
}
```

`components/site/theme-toggle.tsx`:
```tsx
"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      className="size-9 rounded-full"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}
```

- [ ] **Step 8: Verify**

Run: `npm test && npm run build`
Expected: tests pass; build succeeds. Run `npm run dev`, open `http://localhost:3000`: page background is parchment `#f4efe3` (dark `#0b2f2c` if OS is dark), no console errors.

- [ ] **Step 9: Commit**

```bash
git add app lib hooks components tests
git commit -m "Add theme tokens, global animations, hooks and tested format helpers

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- app lib hooks components tests
```

---

### Task 3: Data model, seed venues/sessions, map data helpers (+ tests)

**Files:**
- Create: `data/types.ts`, `data/venues.ts`, `data/sessions.ts`, `lib/map-data.ts`, `lib/map-config.ts`, `tests/map-data.test.ts`

**Interfaces:**
- Produces (`data/types.ts`): `Room`, `Venue`, `Session`, `DayFilter = "all" | 1 | 2`.
- Produces (`data/venues.ts`, `data/sessions.ts`): `venues: Venue[]`, `sessions: Session[]`.
- Produces (`lib/map-data.ts`): `getVenue(venues, id)`, `sessionsForDay(sessions, day)`, `venuesToGeoJSON(venues, sessions) -> FeatureCollection<Point, {id,name,shortName,count}>`, `directionsUrls(venue) -> {google, apple}`, `formatTimeRange(start, end, timeZone) -> string`, `roomLabel(venue, roomId) -> string`, `resolveVenueId(venues, sessions, {venue?, session?}) -> string | null`.
- Produces (`lib/map-config.ts`): `CAMPUS_VIEW`.

- [ ] **Step 1: Types and seed data**

`data/types.ts`:
```ts
export type Room = { id: string; name: string; floor: number; howToFind?: string };

export type Venue = {
  id: string;
  name: string;
  shortName: string;
  coordinates: [lng: number, lat: number];
  address?: string;
  rooms: Room[];
  entrance?: { coordinates: [number, number]; note: string; accessible: boolean };
  parkingNote?: string;
  verified: boolean;   // true only after checking https://campusmap.ucsd.edu/
  sources: string[];   // URLs used for verification
};

export type Session = {
  id: string;
  title: string;
  description: string;
  day: 1 | 2;
  start: string;       // ISO 8601 with offset
  end: string;
  venueId: string;
  roomId: string;
};

export type DayFilter = "all" | 1 | 2;
```

`data/venues.ts` (coordinates and room floors are from public sources and are unverified placeholders until Task 12):
```ts
import type { Venue } from "./types";

export const venues: Venue[] = [
  {
    id: "price-center",
    name: "Price Center",
    shortName: "Price Center",
    coordinates: [-117.23694, 32.88],
    rooms: [
      { id: "theater", name: "Price Center Theater", floor: 1 },
      { id: "east-ballroom", name: "East Ballroom", floor: 2 },
      { id: "west-ballrooms", name: "West Ballrooms", floor: 2 },
    ],
    verified: false,
    sources: ["https://en.wikipedia.org/wiki/Price_Center"],
  },
  {
    id: "geisel-library",
    name: "Geisel Library",
    shortName: "Geisel",
    coordinates: [-117.237651, 32.88116],
    rooms: [{ id: "main-lobby", name: "Main lobby", floor: 1 }],
    verified: false,
    sources: ["https://en.wikipedia.org/wiki/Geisel_Library"],
  },
  {
    id: "rimac-arena",
    name: "RIMAC Arena",
    shortName: "RIMAC",
    coordinates: [-117.239223, 32.885278],
    address: "9860 Hopkins Drive",
    rooms: [{ id: "arena", name: "Arena", floor: 1 }],
    verified: false,
    sources: ["https://en.wikipedia.org/wiki/RIMAC"],
  },
];
```

`data/sessions.ts` (placeholder programme; rooms will be replaced with real bookings in Task 12):
```ts
import type { Session } from "./types";

export const sessions: Session[] = [
  { id: "d1-registration", title: "Registration & check-in", description: "Placeholder description of the session.", day: 1, start: "2026-12-05T08:00:00-08:00", end: "2026-12-05T09:00:00-08:00", venueId: "price-center", roomId: "theater" },
  { id: "d1-keynote", title: "Opening keynote", description: "Placeholder description of the session.", day: 1, start: "2026-12-05T09:30:00-08:00", end: "2026-12-05T10:30:00-08:00", venueId: "price-center", roomId: "east-ballroom" },
  { id: "d1-panel", title: "Panel discussion", description: "Placeholder description of the session.", day: 1, start: "2026-12-05T11:00:00-08:00", end: "2026-12-05T12:15:00-08:00", venueId: "price-center", roomId: "theater" },
  { id: "d1-bazaar", title: "Bazaar & community time", description: "Placeholder description of the session.", day: 1, start: "2026-12-05T12:30:00-08:00", end: "2026-12-05T15:00:00-08:00", venueId: "rimac-arena", roomId: "arena" },
  { id: "d2-lecture", title: "Morning lecture", description: "Placeholder description of the session.", day: 2, start: "2026-12-06T09:30:00-08:00", end: "2026-12-06T10:45:00-08:00", venueId: "price-center", roomId: "west-ballrooms" },
  { id: "d2-workshops", title: "Workshops", description: "Placeholder description of the session.", day: 2, start: "2026-12-06T11:00:00-08:00", end: "2026-12-06T12:30:00-08:00", venueId: "geisel-library", roomId: "main-lobby" },
  { id: "d2-closing", title: "Closing remarks", description: "Placeholder description of the session.", day: 2, start: "2026-12-06T15:00:00-08:00", end: "2026-12-06T16:00:00-08:00", venueId: "price-center", roomId: "east-ballroom" },
];
```

`lib/map-config.ts`:
```ts
export const CAMPUS_VIEW = {
  center: [-117.234, 32.8801] as [number, number],
  zoom: 15.2,
  pitch: 30,
  bearing: -10,
  minZoom: 13.5,
  maxZoom: 19,
  maxBounds: [[-117.27, 32.85], [-117.2, 32.91]] as [[number, number], [number, number]],
};
```

- [ ] **Step 2: Write the failing tests**

`tests/map-data.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  directionsUrls, formatTimeRange, getVenue, resolveVenueId,
  roomLabel, sessionsForDay, venuesToGeoJSON,
} from "@/lib/map-data";
import { sessions } from "@/data/sessions";
import { venues } from "@/data/venues";

describe("seed data integrity", () => {
  it("every session points at a real venue and room", () => {
    for (const s of sessions) {
      const venue = getVenue(venues, s.venueId);
      expect(venue, s.id).toBeDefined();
      expect(venue!.rooms.some((r) => r.id === s.roomId), s.id).toBe(true);
    }
  });
});

describe("sessionsForDay", () => {
  it("filters by day and sorts by start time", () => {
    const day1 = sessionsForDay(sessions, 1);
    expect(day1.every((s) => s.day === 1)).toBe(true);
    const starts = day1.map((s) => new Date(s.start).getTime());
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(sessionsForDay(sessions, "all")).toHaveLength(sessions.length);
  });
});

describe("venuesToGeoJSON", () => {
  it("emits one point per venue that has sessions, with a session count", () => {
    const fc = venuesToGeoJSON(venues, sessions);
    const price = fc.features.find((f) => f.properties.id === "price-center")!;
    expect(price.geometry.coordinates).toEqual([-117.23694, 32.88]);
    expect(price.properties.count).toBe(sessions.filter((s) => s.venueId === "price-center").length);
  });
  it("omits venues with no sessions in the given set", () => {
    const day1 = sessionsForDay(sessions, 1);
    const fc = venuesToGeoJSON(venues, day1);
    expect(fc.features.map((f) => f.properties.id)).not.toContain("geisel-library");
  });
});

describe("directionsUrls", () => {
  it("builds walking directions by latitude,longitude", () => {
    const v = getVenue(venues, "rimac-arena")!;
    const { google, apple } = directionsUrls(v);
    expect(google).toContain("destination=32.885278,-117.239223");
    expect(apple).toContain("daddr=32.885278,-117.239223");
  });
});

describe("formatTimeRange", () => {
  it("formats in Los Angeles time", () => {
    expect(formatTimeRange("2026-12-05T09:30:00-08:00", "2026-12-05T10:30:00-08:00", "America/Los_Angeles"))
      .toBe("9:30 AM – 10:30 AM");
    expect(formatTimeRange("2026-12-05T17:30:00Z", "2026-12-05T18:30:00Z", "America/Los_Angeles"))
      .toBe("9:30 AM – 10:30 AM");
  });
});

describe("roomLabel", () => {
  it("combines room name and floor", () => {
    const v = getVenue(venues, "price-center")!;
    expect(roomLabel(v, "east-ballroom")).toBe("East Ballroom · Floor 2");
    expect(roomLabel(v, "missing")).toBe("");
  });
});

describe("resolveVenueId", () => {
  it("accepts a valid venue or the venue of a valid session", () => {
    expect(resolveVenueId(venues, sessions, { venue: "geisel-library" })).toBe("geisel-library");
    expect(resolveVenueId(venues, sessions, { session: "d1-bazaar" })).toBe("rimac-arena");
  });
  it("ignores unknown or missing ids instead of throwing", () => {
    expect(resolveVenueId(venues, sessions, { venue: "nope" })).toBeNull();
    expect(resolveVenueId(venues, sessions, { session: "nope" })).toBeNull();
    expect(resolveVenueId(venues, sessions, {})).toBeNull();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/map-data`.

- [ ] **Step 4: Implement `lib/map-data.ts`**

```ts
import type { FeatureCollection, Point } from "geojson";
import type { DayFilter, Session, Venue } from "@/data/types";

export type VenueProps = { id: string; name: string; shortName: string; count: number };

export const getVenue = (venues: Venue[], id: string) => venues.find((v) => v.id === id);

export function sessionsForDay(sessions: Session[], day: DayFilter): Session[] {
  const list = day === "all" ? [...sessions] : sessions.filter((s) => s.day === day);
  return list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function venuesToGeoJSON(venues: Venue[], sessions: Session[]): FeatureCollection<Point, VenueProps> {
  const counts = new Map<string, number>();
  for (const s of sessions) counts.set(s.venueId, (counts.get(s.venueId) ?? 0) + 1);
  return {
    type: "FeatureCollection",
    features: venues
      .filter((v) => counts.has(v.id))
      .map((v) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: v.coordinates },
        properties: { id: v.id, name: v.name, shortName: v.shortName, count: counts.get(v.id)! },
      })),
  };
}

export function directionsUrls(venue: Venue) {
  const [lng, lat] = venue.coordinates;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
    apple: `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`,
  };
}

export function formatTimeRange(start: string, end: string, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

export function roomLabel(venue: Venue, roomId: string) {
  const room = venue.rooms.find((r) => r.id === roomId);
  return room ? `${room.name} · Floor ${room.floor}` : "";
}

// Deep links may be stale or mistyped: unknown ids resolve to null, never throw.
export function resolveVenueId(
  venues: Venue[],
  sessions: Session[],
  params: { venue?: string | null; session?: string | null },
): string | null {
  if (params.venue && venues.some((v) => v.id === params.venue)) return params.venue;
  const session = params.session ? sessions.find((s) => s.id === params.session) : undefined;
  return session && venues.some((v) => v.id === session.venueId) ? session.venueId : null;
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test`
Expected: all groups in `format.test.ts` and `map-data.test.ts` pass.

- [ ] **Step 6: Commit**

```bash
git add data lib tests
git commit -m "Add venue/session data model, seed data and tested map data helpers

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- data lib tests
```

---

### Task 4: Nav, footer, section helpers, ticket button, page frame

**Files:**
- Create: `components/site/nav.tsx`, `components/site/footer.tsx`, `components/site/section.tsx`, `components/site/ticket-button.tsx`
- Modify: `components/ui/button.tsx` (mono label style), `app/page.tsx` (replace)

**Interfaces:**
- Consumes: `useHideOnScroll`, `ThemeToggle`, `ticketHref`, `siteConfig`, `Reveal`.
- Produces: `<Nav/>`, `<Footer/>`, `<Section id? className?>`, `<SectionHead eyebrow title lede?>`, `<TicketButton variant? size?>{label}</TicketButton>`.

- [ ] **Step 1: Give shadcn buttons the mono/uppercase look**

In `components/ui/button.tsx`, in the `cva(...)` base class string, replace `text-sm font-medium` with `font-mono text-xs font-medium uppercase tracking-[0.14em]` and change the `default` variant hover to `hover:bg-gold hover:text-primary-foreground`. Leave the rest of the file as generated.

- [ ] **Step 2: `components/site/ticket-button.tsx`**

```tsx
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ticketHref } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

type Props = Pick<ComponentProps<typeof Button>, "variant" | "size" | "className"> & { children: ReactNode };

export function TicketButton({ children, ...props }: Props) {
  const href = ticketHref(siteConfig.ticketUrl);
  const external = href.startsWith("http");
  return (
    <Button asChild {...props}>
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>
    </Button>
  );
}
```

- [ ] **Step 3: `components/site/section.tsx`**

```tsx
import type { ReactNode } from "react";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

export function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("mx-auto w-[var(--frame)] px-4 py-16 sm:px-8 md:py-28", className)}>
      {children}
    </section>
  );
}

export function SectionHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <Reveal className="mb-10 grid justify-items-center gap-3 text-center md:mb-14">
      <p className="mono-label">{eyebrow}</p>
      <h2 className="text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.1]">{title}</h2>
      {lede ? <p className="max-w-[46ch] text-muted-foreground">{lede}</p> : null}
    </Reveal>
  );
}
```

- [ ] **Step 4: `components/site/nav.tsx`**

```tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { TicketButton } from "@/components/site/ticket-button";
import { useHideOnScroll } from "@/hooks/use-hide-on-scroll";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#schedule", label: "Schedule" },
  { href: "/#speakers", label: "Speakers" },
  { href: "/map", label: "Map" },
  { href: "/#faq", label: "FAQ" },
];

export function Nav() {
  const hidden = useHideOnScroll();
  return (
    <div
      className={cn(
        "fixed left-1/2 top-0 z-50 w-[var(--frame)] -translate-x-1/2 transition-transform duration-300 ease-[var(--ease-out-expo)]",
        "[filter:drop-shadow(0_1px_0_var(--border))]",
        hidden && "-translate-y-[120%]",
      )}
    >
      <nav aria-label="Main" className="nav-notch flex h-[60px] items-center justify-between gap-4 bg-secondary px-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 font-medium tracking-tight">
          <Image src="/msalogo.jpg" alt="" width={28} height={28} className="size-7 rounded-full object-cover" />
          <span>Tarbiyyah</span>
        </Link>
        <ul className="hidden gap-6 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="mono-label transition-colors hover:text-foreground">{l.label}</Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <TicketButton size="sm">Tickets</TicketButton>
        </div>
      </nav>
    </div>
  );
}
```

- [ ] **Step 5: `components/site/footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="border-t px-4 py-8">
      <div className="mx-auto flex w-[var(--frame)] flex-wrap items-center justify-between gap-4">
        <span className="mono-label">Made by MSA at UC San Diego</span>
        <nav aria-label="Footer" className="flex gap-6">
          <a href="#" className="mono-label transition-colors hover:text-foreground">Instagram</a>
          <a href="#" className="mono-label transition-colors hover:text-foreground">Contact</a>
        </nav>
        <span className="mono-label">© 2026 Tarbiyyah Conference</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Replace `app/page.tsx` with the composed shell**

```tsx
import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";

export default function Home() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <Nav />
      <div className="page-frame mx-auto max-w-[2000px]">
        <main id="main">
          {/* @hero @hud @stats @about @schedule @speakers @tickets @faq — added by later tasks */}
        </main>
        <Footer />
      </div>
    </>
  );
}
```

- [ ] **Step 7: Verify**

Run `npm run dev`. Expected: notched nav tab at top with brand, links, theme toggle, Tickets button; toggle switches parchment ↔ dark teal and persists on reload; footer at bottom; frame rules visible down both sides; `npm run build` passes.

- [ ] **Step 8: Commit**

```bash
git add app components
git commit -m "Add nav, footer, section helpers and ticket button

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- app components
```

---

### Task 5: Hero (lattice, arch frame, wordmark, skyline, lanterns)

**Files:**
- Create: `components/site/hero/hero.tsx`, `lattice.tsx`, `arch-frame.tsx`, `skyline.tsx`, `lanterns.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `Reveal`, `TicketButton`, CSS classes `.lattice`, `.lattice-fade`, `.hero-bg`, `.arch-line`, `.draw`, `.draw-abs`, `.sk`, `.sk-*`, `.glow`.
- Produces: `<Hero/>`.

- [ ] **Step 1: `lattice.tsx` and `arch-frame.tsx`**

`components/site/hero/lattice.tsx`:
```tsx
export function Lattice() {
  return (
    <div className="lattice-fade" aria-hidden="true">
      <div className="lattice" />
    </div>
  );
}
```

`components/site/hero/arch-frame.tsx`:
```tsx
import { Reveal } from "@/components/site/reveal";

export function ArchFrame() {
  return (
    <Reveal fade={false} className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[min(94%,1000px)] w-[min(860px,94vw)] -translate-x-1/2">
      <svg viewBox="0 0 800 1000" preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-hidden="true">
        <path className="arch-line draw-abs" d="M 20 1000 V 440 C 20 260 230 130 400 20 C 570 130 780 260 780 440 V 1000" />
        <path className="arch-line draw-abs opacity-55" style={{ transitionDelay: "0.7s" }} d="M 56 1000 V 450 C 56 285 250 170 400 68 C 550 170 744 285 744 450 V 1000" />
      </svg>
    </Reveal>
  );
}
```

- [ ] **Step 2: `skyline.tsx`**

```tsx
import type { CSSProperties } from "react";
import { Reveal } from "@/components/site/reveal";

type Tone = "ink" | "gold" | "terra" | "blue" | "green";
const paths: { d: string; tone: Tone; delay: number }[] = [
  { d: "M0 200H1200", tone: "ink", delay: 0 },
  { d: "M60 200V140H170V200", tone: "terra", delay: 1 },
  { d: "M78 200V166a11 11 0 0 1 22 0V200M130 200V166a11 11 0 0 1 22 0V200", tone: "terra", delay: 2 },
  { d: "M232 200V80M258 200V80M226 80H264M236 80V62M254 80V62M234 62Q245 34 256 62M245 34V20", tone: "blue", delay: 2 },
  { d: "M310 200Q313 160 308 128M308 128Q290 120 278 130M308 128Q296 110 280 110M308 128Q320 110 336 114M308 128Q328 122 340 134", tone: "green", delay: 3 },
  { d: "M380 200V150H820V200", tone: "gold", delay: 3 },
  { d: "M490 150V132H710V150M490 132a110 110 0 0 1 220 0M600 22V12", tone: "gold", delay: 4 },
  { d: "M604 4a7 7 0 1 0 0 12 5.5 5.5 0 1 1 0-12z", tone: "gold", delay: 5 },
  { d: "M400 150a40 40 0 0 1 80 0M720 150a40 40 0 0 1 80 0", tone: "gold", delay: 5 },
  { d: "M570 200V175C570 160 590 150 600 140C610 150 630 160 630 175V200", tone: "gold", delay: 5 },
  { d: "M420 200V186a8 8 0 0 1 16 0V200M452 200V186a8 8 0 0 1 16 0V200M732 200V186a8 8 0 0 1 16 0V200M764 200V186a8 8 0 0 1 16 0V200", tone: "gold", delay: 6 },
  { d: "M840 200V160H980V200", tone: "blue", delay: 6 },
  { d: "M852 200V182a10 10 0 0 1 20 0V200M895 200V182a10 10 0 0 1 20 0V200M938 200V182a10 10 0 0 1 20 0V200", tone: "blue", delay: 7 },
  { d: "M1002 200V90M1028 200V90M996 90H1034M1006 90V72M1024 90V72M1004 72Q1015 44 1026 72M1015 44V30", tone: "blue", delay: 7 },
  { d: "M1060 200V110H1140V200M1060 110V98H1070V106H1080V98H1090V106H1100V98H1110V106H1120V98H1130V106H1140V98V110", tone: "terra", delay: 8 },
  { d: "M1082 200V152C1082 136 1100 126 1100 126C1100 126 1118 136 1118 152V200", tone: "terra", delay: 9 },
  { d: "M1185 200Q1188 165 1183 136M1183 136Q1165 128 1153 138M1183 136Q1171 118 1155 118M1183 136Q1195 118 1211 122M1183 136Q1203 130 1215 142", tone: "green", delay: 9 },
];

// Original line-art skyline: domes, minarets, arches, a gate and palms; strokes draw in on load.
export function Skyline() {
  return (
    <Reveal fade={false} className="h-[clamp(120px,20vw,260px)]">
      <svg viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" className="sk h-full w-full" aria-hidden="true">
        {paths.map((p, i) => (
          <path key={i} d={p.d} pathLength={1} className={`draw sk-${p.tone}`} style={{ "--d": p.delay } as CSSProperties} />
        ))}
      </svg>
    </Reveal>
  );
}
```
Check visually: if the mosque crescent renders as a closed blob, replace its path with `M604 4a7 7 0 1 0 0 12 6 6 0 1 1 0-12z`.

- [ ] **Step 3: `lanterns.tsx`**

```tsx
import type { CSSProperties } from "react";
import { Reveal } from "@/components/site/reveal";

const xs = [150, 450, 750, 1050];

// A string of lanterns whose glow ripples along the line (like the reference site's lineWave).
export function Lanterns() {
  return (
    <Reveal fade={false} className="h-[clamp(50px,7vw,90px)]">
      <svg viewBox="0 0 1200 90" preserveAspectRatio="xMidYMin slice" className="sk h-full w-full" aria-hidden="true">
        <path pathLength={1} className="draw sk-ink" d="M0 10Q150 70 300 10Q450 70 600 10Q750 70 900 10Q1050 70 1200 10" />
        {xs.map((x, i) => (
          <g key={x} className="lantern sk-gold" transform={`translate(${x} 40)`}>
            <path d="M0 0V8M-7 8h14l4 8v12l-4 8h-14l-4-8V16z" />
            <circle className="glow" style={{ "--d": i } as CSSProperties} cx="0" cy="22" r="3" />
          </g>
        ))}
      </svg>
    </Reveal>
  );
}
```

- [ ] **Step 4: `hero.tsx`**

```tsx
import { ArchFrame } from "@/components/site/hero/arch-frame";
import { Lanterns } from "@/components/site/hero/lanterns";
import { Lattice } from "@/components/site/hero/lattice";
import { Skyline } from "@/components/site/hero/skyline";
import { Reveal } from "@/components/site/reveal";
import { TicketButton } from "@/components/site/ticket-button";

export function Hero() {
  return (
    <section
      id="top"
      className="hero-bg relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 text-center"
      style={{
        paddingTop: "clamp(6rem, 12vh, 8rem)",
        paddingBottom: "calc(clamp(120px, 20vw, 260px) + clamp(50px, 7vw, 90px) + 2rem)",
      }}
    >
      <Lattice />
      <ArchFrame />

      <div className="relative z-10 flex max-w-[640px] flex-col items-center gap-[clamp(1rem,2.6vh,1.75rem)] px-7">
        <Reveal>
          <svg className="size-[26px] fill-gold" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3a9 9 0 1 0 6 15A7.5 7.5 0 0 1 15 3z" /></svg>
        </Reveal>
        <Reveal delay={1}>
          <p className="mono-label !text-gold-text font-medium !tracking-[0.3em]">MSA at UC San Diego presents</p>
        </Reveal>
        <Reveal delay={2}>
          <h1 className="font-script text-[clamp(3.6rem,12vw,8.5rem)] font-normal leading-[0.95] tracking-normal pb-[0.12em]">
            <span className="block">Tarbiyyah</span>
            <span className="block text-gold">Conference</span>
          </h1>
        </Reveal>
        <Reveal delay={4}>
          <p className="font-mono text-[clamp(0.72rem,1.6vw,0.9rem)] uppercase tracking-[0.24em] text-muted-foreground">
            A gathering of knowledge &amp; community
          </p>
        </Reveal>
        <Reveal delay={5}>
          <TicketButton>Reserve your seat</TicketButton>
        </Reveal>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1]" aria-hidden="true">
        <Skyline />
        <Lanterns />
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Add to `app/page.tsx`**

Import `Hero` and replace the `{/* @hero ... */}` comment with `<Hero />` (keep the comment text updated to the remaining sections).

- [ ] **Step 6: Verify**

Run `npm run dev`. Expected: star lattice around the edges (drifting), gold double arch draws itself, "Tarbiyyah" (ink) / "Conference" (gold) in Pinyon Script fade up in sequence, skyline draws left to right, four lanterns glow in a ripple. Toggle dark mode: same scene in teal/gold. At 390px wide: text fits inside the arch, no horizontal scroll.
Reduced motion (DevTools → Rendering → emulate `prefers-reduced-motion: reduce`): everything visible immediately, lattice static.
No-JS (DevTools → disable JavaScript, reload): wordmark, arch, skyline and lanterns fully visible (noscript overrides).

- [ ] **Step 7: Commit**

```bash
git add app components
git commit -m "Add hero with lattice, arch frame, wordmark, skyline and lanterns

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- app components
```

---

### Task 6: HUD strip (countdown + medallion) and stat plates

**Files:**
- Create: `components/site/hud/countdown.tsx`, `components/site/hud/medallion.tsx`, `components/site/hud/hud.tsx`, `components/site/plate.tsx`, `components/site/stats.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `splitTime`, `useCountUp`, `Reveal`, `Section`, `SectionHead`, `TicketButton`, `siteConfig`, classes `.flicker-once`, `.plate`, `.spin-slow`, `.spin-slow-reverse`.
- Produces: `<Hud/>`, `<Stats/>`.

- [ ] **Step 1: `countdown.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { splitTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ target }: { target: string }) {
  const [t, setT] = useState<ReturnType<typeof splitTime> | null>(null);
  useEffect(() => {
    const end = new Date(target).getTime();
    const tick = () => setT(splitTime(end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells: [string, string][] = [
    ["Days", t ? String(t.days) : "--"],
    ["Hrs", t ? pad(t.hours) : "--"],
    ["Min", t ? pad(t.minutes) : "--"],
    ["Sec", t ? pad(t.seconds) : "--"],
  ];
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-lg border" role="timer" aria-label="Time until the conference">
      {cells.map(([label, value], i) => (
        <div key={label} className={cn("grid justify-items-center gap-0.5 px-1 py-3", i > 0 && "border-l")}>
          <span className="flicker-once font-mono text-[clamp(1.4rem,3.2vw,2rem)] tabular-nums">{value}</span>
          <span className="mono-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `medallion.tsx` (counter-rotating star rings, like the reference's dial)**

```tsx
export function Medallion() {
  return (
    <svg viewBox="0 0 120 120" className="size-24 text-gold" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <g className="spin-slow" fill="none" stroke="currentColor" strokeWidth="1">
        <polygon points="60,10.6 69.9,36 94.9,25.1 84,50.1 109.4,60 84,69.9 94.9,94.9 69.9,84 60,109.4 50.1,84 25.1,94.9 36,69.9 10.6,60 36,50.1 25.1,25.1 50.1,36" />
      </g>
      <g className="spin-slow-reverse" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.7">
        <rect x="38" y="38" width="44" height="44" />
        <rect x="38" y="38" width="44" height="44" transform="rotate(45 60 60)" />
      </g>
      <circle cx="60" cy="60" r="4" fill="currentColor" />
    </svg>
  );
}
```

- [ ] **Step 3: `hud.tsx`**

```tsx
import { Countdown } from "@/components/site/hud/countdown";
import { Medallion } from "@/components/site/hud/medallion";
import { Reveal } from "@/components/site/reveal";
import { TicketButton } from "@/components/site/ticket-button";
import { siteConfig } from "@/lib/site-config";

const panel = "grid content-start gap-2 rounded-xl border bg-card p-4";

export function Hud() {
  return (
    <section aria-label="Event details" className="mx-auto w-[var(--frame)] px-4 py-6 sm:px-8">
      <div className="grid items-stretch gap-4 md:grid-cols-[1.4fr_auto_1fr_auto]">
        <Reveal className={panel}>
          <p className="mono-label">Countdown to Tarbiyyah</p>
          <Countdown target={siteConfig.eventDate} />
        </Reveal>
        <Reveal delay={1} className={`${panel} place-items-center`}>
          <Medallion />
        </Reveal>
        <Reveal delay={2} className={panel}>
          <p className="mono-label">Date</p>
          <strong className="font-medium">{siteConfig.dateText}</strong>
          <p className="mono-label">Venue</p>
          <strong className="font-medium">{siteConfig.venueText}</strong>
        </Reveal>
        <Reveal delay={3} className="grid">
          <TicketButton className="h-full min-h-12">Get tickets</TicketButton>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: `plate.tsx` and `stats.tsx`**

`components/site/plate.tsx`:
```tsx
"use client";
import { useCountUp } from "@/hooks/use-count-up";
import { useInView } from "@/hooks/use-in-view";

export function Plate({ value, suffix = "+", label, delay = 0 }: { value: number; suffix?: string; label: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const shown = useCountUp(value, inView);
  return (
    <div
      ref={ref}
      data-reveal=""
      data-in-view={inView}
      style={{ "--d": delay } as React.CSSProperties}
      className="plate grid justify-items-center gap-1.5 rounded-xl border bg-card px-4 py-6 text-center"
    >
      <span className="font-mono text-[clamp(2rem,4.5vw,3rem)] tabular-nums">{shown.toLocaleString()}{suffix}</span>
      <span className="mono-label">{label}</span>
    </div>
  );
}
```

`components/site/stats.tsx`:
```tsx
import { Plate } from "@/components/site/plate";
import { Section, SectionHead } from "@/components/site/section";

export function Stats() {
  return (
    <Section id="stats">
      <SectionHead eyebrow="By the numbers" title="What we're building together" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <Plate value={500} label="Attendees" />
        <Plate value={12} label="Speakers" delay={1} />
        <Plate value={20} label="Sessions" delay={2} />
        <Plate value={30} label="Bazaar vendors" delay={3} />
      </div>
    </Section>
  );
}
```
(All numbers are placeholders.)

- [ ] **Step 5: Add `<Hud />` and `<Stats />` after `<Hero />` in `app/page.tsx`.**

- [ ] **Step 6: Verify**

Expected: below the skyline, a HUD row with a ticking D/H/M/S countdown (digits flicker on once when it scrolls in), a slowly counter-rotating star medallion, date/venue, and a Get tickets button; then four plates with screw dots whose numbers count up.
Review Focus 1 (browser): temporarily set `eventDate: "nope"` in `lib/site-config.ts` → countdown shows `0`, `00`, `00`, `00`, no `NaN`; restore.
Review Focus 2 (browser): Get tickets opens the Typeform URL in a new tab; set `ticketUrl: ""` → jumps to `#tickets`; restore.
Reduced motion emulation: plates show `500+`, `12+`, `20+`, `30+` immediately; medallion still (animations disabled).

- [ ] **Step 7: Commit**

```bash
git add app components
git commit -m "Add HUD countdown strip with star medallion and count-up stat plates

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- app components
```

---

### Task 7: About and schedule (from shared data, with "Show on map")

**Files:**
- Create: `components/site/about.tsx`, `components/site/schedule.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `sessions`, `venues`, `getVenue`, `roomLabel`, `formatTimeRange`, `siteConfig.timeZone`, shadcn `Card`, `Tabs`, `Reveal`, `Section`, `SectionHead`, `.spine`.
- Produces: `<About/>`, `<Schedule/>`. Session cards link to `/map?session=<id>`.

- [ ] **Step 1: `about.tsx`**

```tsx
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function About() {
  return (
    <Section id="about">
      <Reveal>
        <Card className="mx-auto max-w-[720px] gap-0 overflow-hidden py-0">
          <CardHeader className="flex-row justify-between border-b bg-secondary px-4 py-3">
            <span className="mono-label">About</span>
            <span className="mono-label">01</span>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 py-5">
            <h2 className="text-[clamp(1.6rem,3.6vw,2.4rem)] leading-[1.1]">A gathering rooted in knowledge</h2>
            <p className="font-mono text-sm leading-7 text-muted-foreground">
              Placeholder description of the conference: its purpose, who it is for, and what attendees can expect from a day of lectures, panels and community.
            </p>
            <p className="font-mono text-sm leading-7 text-muted-foreground">
              A few more sentences on the vision behind Tarbiyyah Conference and the community it brings together at UC San Diego.
            </p>
          </CardContent>
        </Card>
      </Reveal>
    </Section>
  );
}
```

- [ ] **Step 2: `schedule.tsx`**

```tsx
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { Section, SectionHead } from "@/components/site/section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sessions } from "@/data/sessions";
import { venues } from "@/data/venues";
import { formatTimeRange, getVenue, roomLabel, sessionsForDay } from "@/lib/map-data";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const days = [1, 2] as const;

export function Schedule() {
  return (
    <Section id="schedule">
      <SectionHead eyebrow="Schedule" title="A day at Tarbiyyah" />
      <Tabs defaultValue="1">
        <TabsList className="mx-auto mb-8 flex h-auto w-fit gap-2 bg-transparent p-0">
          {days.map((d) => (
            <TabsTrigger
              key={d}
              value={String(d)}
              className="mono-label rounded-lg border px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:!text-primary-foreground"
            >
              Day {d} · TBD
            </TabsTrigger>
          ))}
        </TabsList>
        {days.map((d) => (
          <TabsContent key={d} value={String(d)} forceMount className="data-[state=inactive]:hidden">
            <Reveal fade={false} className="spine grid gap-8 py-4">
              {sessionsForDay(sessions, d).map((s, i) => {
                const venue = getVenue(venues, s.venueId)!;
                return (
                  <article key={s.id} className={cn("relative flex", i % 2 === 1 && "md:justify-end")}>
                    <span aria-hidden="true" className="absolute left-[10px] top-6 size-3.5 -translate-x-1/2 rounded-full border border-gold bg-background md:left-1/2" />
                    <Card className="ml-9 w-full gap-0 overflow-hidden py-0 md:ml-0 md:w-[calc(50%-2rem)]">
                      <CardHeader className="flex-row justify-between gap-4 border-b bg-secondary px-4 py-3">
                        <span className="mono-label">{formatTimeRange(s.start, s.end, siteConfig.timeZone)}</span>
                        <span className="mono-label">{venue.shortName}</span>
                      </CardHeader>
                      <CardContent className="grid gap-2 px-4 py-5">
                        <h3 className="text-xl">{s.title}</h3>
                        <p className="font-mono text-sm leading-7 text-muted-foreground">{s.description}</p>
                        <p className="mono-label">{roomLabel(venue, s.roomId)}</p>
                        <Link href={`/map?session=${s.id}`} className="mono-label text-gold-text underline-offset-4 hover:underline">
                          Show on map →
                        </Link>
                      </CardContent>
                    </Card>
                  </article>
                );
              })}
            </Reveal>
          </TabsContent>
        ))}
      </Tabs>
    </Section>
  );
}
```

- [ ] **Step 3: Add `<About />` and `<Schedule />` to `app/page.tsx` after `<Stats />`.**

- [ ] **Step 4: Verify**

Expected: About card fades in; Day 1 / Day 2 tabs (click or arrow keys) swap the spine; the gold double line grows down the page; cards alternate sides at ≥768px and sit right of a left-hand line below that; "Show on map →" links point at `/map?session=…`. No-JS: both days visible stacked. `npm run build` passes.

- [ ] **Step 5: Commit**

```bash
git add app components
git commit -m "Add about card and data-driven schedule spine with map links

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- app components
```

---

### Task 8: Speakers with bio dialog

**Files:**
- Create: `data/speakers.ts`, `components/site/speakers.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: shadcn `Dialog`, `Card`; `.portrait`; `Reveal`; `Section`/`SectionHead`.
- Produces: `speakers: Speaker[]`; `<Speakers/>`.

- [ ] **Step 1: `data/speakers.ts`**

```ts
export type Speaker = { id: string; name: string; role: string; bio: string };

const bio = "Placeholder biography for this speaker: background, current work, and what they will be sharing at the conference.";

export const speakers: Speaker[] = [
  { id: "s1", name: "Speaker Name", role: "Title / Affiliation", bio },
  { id: "s2", name: "Speaker Name", role: "Title / Affiliation", bio },
  { id: "s3", name: "Speaker Name", role: "Title / Affiliation", bio },
  { id: "s4", name: "Speaker Name", role: "Title / Affiliation", bio },
];
```

- [ ] **Step 2: `components/site/speakers.tsx`**

```tsx
import { Reveal } from "@/components/site/reveal";
import { Section, SectionHead } from "@/components/site/section";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { speakers } from "@/data/speakers";

export function Speakers() {
  return (
    <Section id="speakers">
      <SectionHead eyebrow="Speakers" title="Voices of the conference" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
        {speakers.map((s, i) => (
          <Reveal key={s.id} delay={i}>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="grid w-full gap-2.5 rounded-xl border bg-card p-4 text-left transition-[transform,border-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-gold"
                >
                  <span className="portrait" aria-hidden="true" />
                  <span className="text-base font-medium">{s.name}</span>
                  <span className="mono-label">{s.role}</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{s.name}</DialogTitle>
                  <DialogDescription>{s.role}</DialogDescription>
                </DialogHeader>
                <p className="font-mono text-sm leading-7 text-muted-foreground">{s.bio}</p>
              </DialogContent>
            </Dialog>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
```
Note: `Reveal` is a client component and `Dialog` (Radix) is client-only; `Speakers` stays a server component that composes them, which is fine.

- [ ] **Step 3: Add `<Speakers />` after `<Schedule />` in `app/page.tsx`.**

- [ ] **Step 4: Verify**

Expected: four arch-portrait cards with a gold star tint; hover lifts a card and turns the border gold; click opens a dialog with name, role and bio; Esc, the close button and an outside click close it and focus returns to the card.

- [ ] **Step 5: Commit**

```bash
git add app components data
git commit -m "Add speakers grid with bio dialog

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- app components data
```

---

### Task 9: Tickets and FAQ

**Files:**
- Create: `components/site/tickets.tsx`, `components/site/faq.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `TicketButton`, shadcn `Card`, `Accordion`; `Reveal`; `Section`/`SectionHead`.
- Produces: `<Tickets/>`, `<Faq/>`.

- [ ] **Step 1: `tickets.tsx`**

```tsx
import { Reveal } from "@/components/site/reveal";
import { Section, SectionHead } from "@/components/site/section";
import { TicketButton } from "@/components/site/ticket-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tiers = [
  { name: "General", perks: ["Full-day access", "Lectures & panels", "Bazaar entry"], featured: false },
  { name: "Student", perks: ["Full-day access", "Lectures & panels", "Bazaar entry"], featured: true },
  { name: "Supporter", perks: ["Everything in General", "Reserved seating", "Supporter recognition"], featured: false },
];

export function Tickets() {
  return (
    <Section id="tickets">
      <SectionHead eyebrow="Tickets" title="Reserve your seat" lede="Seats are limited. Registration happens on our Typeform." />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] items-stretch gap-5">
        {tiers.map((t, i) => (
          <Reveal key={t.name} delay={i} className="grid">
            <Card className={cn("gap-0 overflow-hidden py-0", t.featured && "border-gold")}>
              <CardHeader className="flex-row justify-between border-b bg-secondary px-4 py-3">
                <span className="mono-label">{t.name}</span>
                <span className="mono-label">TBD</span>
              </CardHeader>
              <CardContent className="grid gap-3 px-4 py-5">
                <p className="text-3xl tracking-tight">$—</p>
                <ul className="mb-2 grid gap-1.5 font-mono text-sm text-muted-foreground">
                  {t.perks.map((p) => (
                    <li key={p}><span className="text-gold">+ </span>{p}</li>
                  ))}
                </ul>
                <TicketButton variant={t.featured ? "default" : "outline"}>Register</TicketButton>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: `faq.tsx`**

```tsx
import { Reveal } from "@/components/site/reveal";
import { Section, SectionHead } from "@/components/site/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const items = [
  { q: "Is this event free?", a: "Placeholder answer about ticket pricing." },
  { q: "Is there parking available?", a: "Placeholder answer about parking and directions." },
  { q: "Will food be provided?", a: "Placeholder answer about food and refreshments." },
  { q: "Who can attend?", a: "Placeholder answer about who the event is open to." },
];

export function Faq() {
  return (
    <Section id="faq">
      <SectionHead eyebrow="FAQ" title="Common questions" />
      <Reveal className="mx-auto max-w-[720px]">
        <Accordion type="single" collapsible className="border-t">
          {items.map((it, i) => (
            <AccordionItem key={it.q} value={`item-${i}`}>
              <AccordionTrigger className="py-5 text-base font-medium">{it.q}</AccordionTrigger>
              <AccordionContent className="font-mono text-sm leading-7 text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </Section>
  );
}
```
The accordion animation uses `--animate-accordion-down/up` defined in Task 2 (0.3s, `cubic-bezier(.16,1,.3,1)`), matching the reference.

- [ ] **Step 3: Add `<Tickets />` and `<Faq />` after `<Speakers />` in `app/page.tsx` and delete the leftover placeholder comment.**

- [ ] **Step 4: Verify**

Expected: three ticket cards (Student is gold-bordered with a solid button); every Register button opens the Typeform URL in a new tab; accordion opens and closes with the springy ease and the chevron rotates. Check both themes. `npm run build` passes.

- [ ] **Step 5: Commit**

```bash
git add app components
git commit -m "Add tickets and FAQ sections

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- app components
```

---

### Task 10: Map style theming (`lib/map-style.ts`, tested)

**Files:**
- Create: `lib/map-style.ts`, `tests/map-style.test.ts`

**Interfaces:**
- Consumes: `StyleSpecification` from `maplibre-gl`.
- Produces: `MapPalette`, `palettes: {light: MapPalette; dark: MapPalette}`, `themeStyle(base, palette) -> StyleSpecification` (pure; never mutates `base`).

- [ ] **Step 1: Write the failing tests**

`tests/map-style.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { StyleSpecification } from "maplibre-gl";
import { palettes, themeStyle } from "@/lib/map-style";

const base = {
  version: 8,
  sources: {},
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#ffffff" } },
    { id: "water", type: "fill", source: "s", "source-layer": "water", paint: { "fill-color": "#000000" } },
    { id: "park", type: "fill", source: "s", "source-layer": "park", paint: { "fill-color": "#000000" } },
    { id: "building", type: "fill", source: "s", "source-layer": "building", paint: { "fill-color": "#000000" } },
    { id: "road_casing", type: "line", source: "s", "source-layer": "transportation", paint: { "line-color": "#000000" } },
    { id: "road_minor", type: "line", source: "s", "source-layer": "transportation", paint: { "line-color": "#000000" } },
    { id: "label", type: "symbol", source: "s", "source-layer": "place", layout: {}, paint: {} },
  ],
} as unknown as StyleSpecification;

const paint = (style: StyleSpecification, id: string) =>
  (style.layers.find((l) => l.id === id) as { paint: Record<string, unknown> }).paint;

describe("themeStyle", () => {
  it("recolours layers by type and source layer", () => {
    const p = palettes.dark;
    const out = themeStyle(base, p);
    expect(paint(out, "background")["background-color"]).toBe(p.land);
    expect(paint(out, "water")["fill-color"]).toBe(p.water);
    expect(paint(out, "park")["fill-color"]).toBe(p.park);
    expect(paint(out, "building")["fill-color"]).toBe(p.building);
    expect(paint(out, "road_casing")["line-color"]).toBe(p.roadCasing);
    expect(paint(out, "road_minor")["line-color"]).toBe(p.road);
    expect(paint(out, "label")["text-color"]).toBe(p.label);
    expect(paint(out, "label")["text-halo-color"]).toBe(p.labelHalo);
  });

  it("does not mutate the base style", () => {
    const snapshot = JSON.stringify(base);
    themeStyle(base, palettes.light);
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  it("gives light and dark different land colours", () => {
    expect(palettes.light.land).not.toBe(palettes.dark.land);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/map-style`.

- [ ] **Step 3: Implement `lib/map-style.ts`**

```ts
import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

export type MapPalette = {
  land: string; water: string; park: string; landuse: string;
  building: string; buildingLine: string; extrusion: string;
  road: string; roadCasing: string; path: string; boundary: string;
  label: string; labelHalo: string;
  pin: string; pinStroke: string; halo: string; accent: string;
};

export const palettes: { light: MapPalette; dark: MapPalette } = {
  light: {
    land: "#f4efe3", water: "#c5d6d2", park: "#dfe3c9", landuse: "#efe9da",
    building: "#e3dbc6", buildingLine: "#c9c2b0", extrusion: "#d8ceb4",
    road: "#fbf8f0", roadCasing: "#c9c2b0", path: "#d9d1bd", boundary: "#b9b19a",
    label: "#12403b", labelHalo: "#f4efe3",
    pin: "#f4efe3", pinStroke: "#12403b", halo: "#a87a26", accent: "#a87a26",
  },
  dark: {
    land: "#0b2f2c", water: "#082421", park: "#0f3a36", landuse: "#0d3531",
    building: "#124a45", buildingLine: "#1c5a54", extrusion: "#175a54",
    road: "#1c5a54", roadCasing: "#0b2f2c", path: "#2a6b64", boundary: "#3b6f68",
    label: "#f3ede0", labelHalo: "#0b2f2c",
    pin: "#f3ede0", pinStroke: "#0b2f2c", halo: "#e3c380", accent: "#e3c380",
  },
};

type Layer = LayerSpecification & { "source-layer"?: string; paint?: Record<string, unknown> };

function recolor(layer: Layer, p: MapPalette): Layer {
  const sl = layer["source-layer"];
  const paint = { ...(layer.paint ?? {}) };
  switch (layer.type) {
    case "background":
      paint["background-color"] = p.land;
      break;
    case "fill":
      if (sl === "water") paint["fill-color"] = p.water;
      else if (sl === "park" || sl === "landcover") paint["fill-color"] = p.park;
      else if (sl === "building") {
        paint["fill-color"] = p.building;
        paint["fill-outline-color"] = p.buildingLine;
      } else paint["fill-color"] = p.landuse;
      break;
    case "line":
      if (sl === "waterway") paint["line-color"] = p.water;
      else if (sl === "boundary") paint["line-color"] = p.boundary;
      else if (layer.id.includes("casing")) paint["line-color"] = p.roadCasing;
      else if (layer.id.includes("path")) paint["line-color"] = p.path;
      else paint["line-color"] = p.road;
      break;
    case "symbol":
      paint["text-color"] = p.label;
      paint["text-halo-color"] = p.labelHalo;
      break;
    default:
      return layer;
  }
  return { ...layer, paint } as Layer;
}

// Recolours an OpenMapTiles-schema style (OpenFreeMap "positron") to our palette. Pure.
export function themeStyle(base: StyleSpecification, palette: MapPalette): StyleSpecification {
  const style = structuredClone(base);
  style.layers = style.layers.map((l) => recolor(l as Layer, palette) as LayerSpecification);
  return style;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: all test files pass.

- [ ] **Step 5: Commit**

```bash
git add lib tests
git commit -m "Add tested map style theming for light and dark

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- lib tests
```

---

### Task 11: Map UI (`/map`)

**Files:**
- Create: `components/map/map-view.tsx`, `components/map/day-tabs.tsx`, `components/map/session-list.tsx`, `components/map/venue-card.tsx`, `components/map/map-experience.tsx`, `app/map/page.tsx`

**Interfaces:**
- Consumes: `venues`, `sessions`, `getVenue`, `sessionsForDay`, `venuesToGeoJSON`, `directionsUrls`, `formatTimeRange`, `roomLabel`, `resolveVenueId`, `VenueProps` (lib/map-data); `palettes`, `themeStyle` (lib/map-style); `CAMPUS_VIEW`; `siteConfig.timeZone`; `ThemeToggle`; shadcn `Tabs`, `ScrollArea`, `Sheet`, `Card`, `Button`, `Badge`.
- Produces: `<MapView data selectedId onSelect/>`, `<DayTabs day onChange/>`, `<SessionList sessions selectedSessionId onPick/>`, `<VenueCard venue sessions onClose/>`, `<MapExperience/>`; route `/map` (state in URL: `?day=1|2`, `?venue=<id>`, `?session=<id>`).

- [ ] **Step 1: `map-view.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Point } from "geojson";
import { useTheme } from "next-themes";
import { CAMPUS_VIEW } from "@/lib/map-config";
import type { VenueProps } from "@/lib/map-data";
import { palettes, themeStyle, type MapPalette } from "@/lib/map-style";

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

type VenueData = FeatureCollection<Point, VenueProps>;
type Props = { data: VenueData; selectedId: string | null; onSelect: (id: string | null) => void };

function addLayers(map: MapLibreMap, p: MapPalette, data: VenueData, selectedId: string | null) {
  const firstSymbol = map.getStyle().layers.find((l) => l.type === "symbol")?.id;
  map.addLayer({
    id: "buildings-3d", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", minzoom: 15,
    paint: {
      "fill-extrusion-color": p.extrusion,
      "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6],
      "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
      "fill-extrusion-opacity": ["interpolate", ["linear"], ["zoom"], 15, 0, 16, 0.85],
    },
  }, firstSymbol);
  map.addSource("venues", { type: "geojson", data });
  map.addLayer({ id: "venue-halo", type: "circle", source: "venues", paint: { "circle-radius": 18, "circle-color": p.halo, "circle-opacity": 0.35 } });
  map.addLayer({ id: "venue-point", type: "circle", source: "venues", paint: { "circle-radius": 10, "circle-color": p.pin, "circle-stroke-width": 2, "circle-stroke-color": p.pinStroke } });
  map.addLayer({
    id: "venue-count", type: "symbol", source: "venues",
    layout: { "text-field": ["to-string", ["get", "count"]], "text-font": ["Noto Sans Bold"], "text-size": 11, "text-allow-overlap": true, "text-ignore-placement": true },
    paint: { "text-color": p.pinStroke },
  });
  map.addLayer({
    id: "venue-label", type: "symbol", source: "venues",
    layout: { "text-field": ["get", "shortName"], "text-font": ["Noto Sans Bold"], "text-size": 12, "text-offset": [0, 1.7], "text-anchor": "top" },
    paint: { "text-color": p.label, "text-halo-color": p.labelHalo, "text-halo-width": 1.5 },
  });
  map.addLayer({
    id: "venue-selected", type: "circle", source: "venues",
    filter: ["==", ["get", "id"], selectedId ?? ""],
    paint: { "circle-radius": 16, "circle-color": "rgba(0,0,0,0)", "circle-stroke-width": 2.5, "circle-stroke-color": p.accent },
  });
}

function focus(map: MapLibreMap, data: VenueData, id: string) {
  const feature = data.features.find((f) => f.properties.id === id);
  if (!feature) return;
  map.flyTo({ center: feature.geometry.coordinates as [number, number], zoom: Math.max(map.getZoom(), 17), pitch: 45, speed: 0.8 });
}

export function MapView({ data, selectedId, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const baseStyle = useRef<StyleSpecification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  // Latest values for map callbacks (created once, must not go stale).
  const latest = useRef({ data, selectedId, onSelect, theme });
  latest.current = { data, selectedId, onSelect, theme };

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;
    (async () => {
      try {
        const res = await fetch(STYLE_URL);
        if (!res.ok) throw new Error(`Map style request failed (${res.status})`);
        baseStyle.current = (await res.json()) as StyleSpecification;
        if (cancelled || !container.current) return;
        map = new maplibregl.Map({
          container: container.current,
          style: themeStyle(baseStyle.current, palettes[latest.current.theme]),
          ...CAMPUS_VIEW,
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
        map.on("style.load", () => {
          const l = latest.current;
          addLayers(map!, palettes[l.theme], l.data, l.selectedId);
          if (l.selectedId) focus(map!, l.data, l.selectedId);
        });
        map.on("click", "venue-point", (e) => {
          const id = e.features?.[0]?.properties?.id;
          if (id) latest.current.onSelect(String(id));
        });
        map.on("click", (e) => {
          if (!map!.queryRenderedFeatures(e.point, { layers: ["venue-point"] }).length) latest.current.onSelect(null);
        });
        map.on("mouseenter", "venue-point", () => { map!.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "venue-point", () => { map!.getCanvas().style.cursor = ""; });
      } catch (err) {
        setError(err instanceof Error ? err.message : "The map could not be loaded.");
      }
    })();
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // Restyle on theme change (setStyle wipes custom layers; style.load re-adds them).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !baseStyle.current) return;
    map.setStyle(themeStyle(baseStyle.current, palettes[theme]), { diff: false });
  }, [theme]);

  // Pins follow the day filter.
  useEffect(() => {
    const source = mapRef.current?.getSource("venues") as GeoJSONSource | undefined;
    source?.setData(data);
  }, [data]);

  // Selection ring + camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("venue-selected")) return;
    map.setFilter("venue-selected", ["==", ["get", "id"], selectedId ?? ""]);
    if (selectedId) focus(map, data, selectedId);
  }, [selectedId, data]);

  // Pulse the selected ring (skipped for reduced motion).
  useEffect(() => {
    if (!selectedId || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = (t: number) => {
      const map = mapRef.current;
      if (map?.getLayer("venue-selected")) {
        const k = (Math.sin(t / 400) + 1) / 2;
        map.setPaintProperty("venue-selected", "circle-radius", 14 + k * 8);
        map.setPaintProperty("venue-selected", "circle-stroke-opacity", 1 - k * 0.6);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selectedId]);

  return (
    <>
      <div ref={container} className="absolute inset-0" role="region" aria-label="Campus map" />
      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-background p-6 text-center">
          <div className="grid max-w-sm gap-3">
            <p className="font-medium">The map couldn&apos;t load.</p>
            <p className="text-sm text-muted-foreground">{error}. The session list still works; you can also use the official campus map.</p>
            <a className="mono-label text-gold-text underline" href="https://campusmap.ucsd.edu/" target="_blank" rel="noopener noreferrer">
              Open UC San Diego Campus Map
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
```
Note: constructing `maplibregl.Map` without WebGL throws inside the `try`, which shows the same fallback message.

- [ ] **Step 2: `day-tabs.tsx`**

```tsx
"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DayFilter } from "@/data/types";

export function DayTabs({ day, onChange }: { day: DayFilter; onChange: (day: DayFilter) => void }) {
  return (
    <Tabs value={String(day)} onValueChange={(v) => onChange(v === "all" ? "all" : (Number(v) as 1 | 2))}>
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-transparent p-0">
        {(["all", "1", "2"] as const).map((v) => (
          <TabsTrigger
            key={v}
            value={v}
            className="mono-label rounded-lg border py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:!text-primary-foreground"
          >
            {v === "all" ? "All" : `Day ${v}`}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
```

- [ ] **Step 3: `session-list.tsx`**

```tsx
"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { venues } from "@/data/venues";
import type { Session } from "@/data/types";
import { formatTimeRange, getVenue, roomLabel } from "@/lib/map-data";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type Props = { sessions: Session[]; selectedSessionId: string | null; onPick: (session: Session) => void };

export function SessionList({ sessions, selectedSessionId, onPick }: Props) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <ul className="divide-y">
        {sessions.map((s) => {
          const venue = getVenue(venues, s.venueId)!;
          const selected = s.id === selectedSessionId;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onPick(s)}
                aria-current={selected}
                className={cn("grid w-full gap-1 px-5 py-4 text-left transition-colors hover:bg-secondary", selected && "bg-secondary")}
              >
                <span className="mono-label">Day {s.day} · {formatTimeRange(s.start, s.end, siteConfig.timeZone)}</span>
                <span className="text-base font-medium leading-snug">{s.title}</span>
                <span className="text-sm text-muted-foreground">{roomLabel(venue, s.roomId)} · {venue.shortName}</span>
                <span className="mono-label text-gold-text">View on map →</span>
              </button>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
```

- [ ] **Step 4: `venue-card.tsx`**

```tsx
"use client";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Session, Venue } from "@/data/types";
import { directionsUrls, formatTimeRange, roomLabel } from "@/lib/map-data";
import { siteConfig } from "@/lib/site-config";

type Props = { venue: Venue; sessions: Session[]; onClose: () => void };

export function VenueCard({ venue, sessions, onClose }: Props) {
  const { google, apple } = directionsUrls(venue);
  const rooms = venue.rooms.filter((r) => r.howToFind);
  return (
    <Card className="absolute inset-x-3 bottom-3 z-10 max-h-[55dvh] gap-0 overflow-y-auto py-0 md:inset-x-auto md:bottom-4 md:left-4 md:w-[380px]">
      <CardHeader className="flex-row items-center justify-between gap-2 border-b bg-secondary px-4 py-3">
        <h2 className="text-base font-medium">{venue.name}</h2>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose} aria-label="Close venue details">
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 px-4 py-4">
        {!venue.verified ? <Badge variant="outline" className="w-fit">Location not yet verified</Badge> : null}
        {venue.address ? <p className="text-sm text-muted-foreground">{venue.address}</p> : null}
        <ul className="grid gap-3">
          {sessions.map((s) => (
            <li key={s.id} className="grid gap-0.5">
              <span className="mono-label">Day {s.day} · {formatTimeRange(s.start, s.end, siteConfig.timeZone)}</span>
              <span className="font-medium">{s.title}</span>
              <span className="text-sm text-muted-foreground">{roomLabel(venue, s.roomId)}</span>
            </li>
          ))}
        </ul>
        {rooms.length ? (
          <div className="grid gap-1">
            <p className="mono-label">How to find it</p>
            {rooms.map((r) => <p key={r.id} className="text-sm text-muted-foreground"><strong className="text-foreground">{r.name}:</strong> {r.howToFind}</p>)}
          </div>
        ) : null}
        {venue.entrance ? (
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Entrance{venue.entrance.accessible ? " (accessible)" : ""}:</strong> {venue.entrance.note}
          </p>
        ) : null}
        {venue.parkingNote ? <p className="text-sm text-muted-foreground"><strong className="text-foreground">Parking:</strong> {venue.parkingNote}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm"><a href={google} target="_blank" rel="noopener noreferrer">Directions</a></Button>
          <Button asChild size="sm" variant="outline"><a href={apple} target="_blank" rel="noopener noreferrer">Apple Maps</a></Button>
          <Button asChild size="sm" variant="outline"><a href="https://campusmap.ucsd.edu/" target="_blank" rel="noopener noreferrer">UCSD Campus Map</a></Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: `map-experience.tsx`**

```tsx
"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, List } from "lucide-react";
import { DayTabs } from "@/components/map/day-tabs";
import { MapView } from "@/components/map/map-view";
import { SessionList } from "@/components/map/session-list";
import { VenueCard } from "@/components/map/venue-card";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { sessions } from "@/data/sessions";
import type { DayFilter, Session } from "@/data/types";
import { venues } from "@/data/venues";
import { getVenue, resolveVenueId, sessionsForDay, venuesToGeoJSON } from "@/lib/map-data";

const parseDay = (v: string | null): DayFilter => (v === "1" ? 1 : v === "2" ? 2 : "all");

export function MapExperience() {
  const params = useSearchParams();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  // URL is the single source of truth for day / venue / session.
  const day = parseDay(params.get("day"));
  const sessionParam = params.get("session");
  const venueId = resolveVenueId(venues, sessions, { venue: params.get("venue"), session: sessionParam });
  const selectedSessionId = sessions.some((s) => s.id === sessionParam) ? sessionParam : null;

  const daySessions = useMemo(() => sessionsForDay(sessions, day), [day]);
  const data = useMemo(() => venuesToGeoJSON(venues, daySessions), [daySessions]);
  const venue = venueId ? getVenue(venues, venueId) ?? null : null;
  const venueSessions = venue ? daySessions.filter((s) => s.venueId === venue.id) : [];

  const update = (patch: { day?: DayFilter; venue?: string | null; session?: string | null }) => {
    const q = new URLSearchParams(params.toString());
    if (patch.day !== undefined) patch.day === "all" ? q.delete("day") : q.set("day", String(patch.day));
    if (patch.venue !== undefined) patch.venue ? q.set("venue", patch.venue) : q.delete("venue");
    if (patch.session !== undefined) patch.session ? q.set("session", patch.session) : q.delete("session");
    const qs = q.toString();
    router.replace(qs ? `/map?${qs}` : "/map", { scroll: false });
  };

  const pick = (s: Session) => {
    update({ venue: s.venueId, session: s.id });
    setSheetOpen(false);
  };

  const sidebar = (
    <>
      <div className="grid gap-3 border-b p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="mono-label inline-flex items-center gap-1.5 hover:text-foreground"><ArrowLeft className="size-3.5" /> Tarbiyyah</Link>
          <ThemeToggle />
        </div>
        <h1 className="text-xl">Campus guide</h1>
        <DayTabs day={day} onChange={(d) => update({ day: d })} />
      </div>
      <SessionList sessions={daySessions} selectedSessionId={selectedSessionId} onPick={pick} />
    </>
  );

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background">
      <aside className="hidden w-[340px] shrink-0 flex-col border-r md:flex">{sidebar}</aside>
      <div className="relative flex-1">
        <MapView data={data} selectedId={venue?.id ?? null} onSelect={(id) => update({ venue: id, session: null })} />
        {venue ? <VenueCard venue={venue} sessions={venueSessions} onClose={() => update({ venue: null, session: null })} /> : null}
        <div className="absolute left-3 top-3 z-10 md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild><Button size="sm"><List className="size-4" /> Sessions</Button></SheetTrigger>
            <SheetContent side="bottom" className="flex h-[75dvh] flex-col gap-0 p-0">
              <SheetHeader className="sr-only"><SheetTitle>Sessions</SheetTitle></SheetHeader>
              {sidebar}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: `app/map/page.tsx` (with a no-JS fallback list)**

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { MapExperience } from "@/components/map/map-experience";
import { sessions } from "@/data/sessions";
import { venues } from "@/data/venues";
import { formatTimeRange, getVenue, roomLabel, sessionsForDay } from "@/lib/map-data";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Campus map — Tarbiyyah Conference" };

export default function MapPage() {
  return (
    <>
      <Suspense fallback={null}>
        <MapExperience />
      </Suspense>
      <noscript>
        <div style={{ padding: "1.5rem", maxWidth: 640, margin: "0 auto" }}>
          <h1>Campus guide</h1>
          <p>The interactive map needs JavaScript. Session locations:</p>
          <ul>
            {sessionsForDay(sessions, "all").map((s) => {
              const v = getVenue(venues, s.venueId)!;
              return (
                <li key={s.id}>
                  Day {s.day}, {formatTimeRange(s.start, s.end, siteConfig.timeZone)} — {s.title} — {roomLabel(v, s.roomId)}, {v.name}
                </li>
              );
            })}
          </ul>
          <p><a href="https://campusmap.ucsd.edu/">Open the UC San Diego Campus Map</a></p>
        </div>
      </noscript>
    </>
  );
}
```

- [ ] **Step 7: Verify in the browser (`npm run dev`, open `/map`)**

- Map shows UCSD, tilted, parchment basemap, three pins with session counts and labels; buildings rise in 3D when zoomed in past 15.
- Clicking a pin flies to it, draws a pulsing gold ring and opens the venue card; clicking empty map or × closes it. The URL updates (`?venue=…`).
- The sidebar lists sessions; DayTabs filter both the list and the pins (Geisel disappears on Day 1); clicking a session focuses its venue and highlights the row.
- `/map?session=d1-bazaar` opens focused on RIMAC. **Review Focus 3:** `/map?venue=nope` and `/map?session=nope` open the default campus view, no crash, no card.
- **Review Focus 5:** toggle the theme while a venue is selected — the basemap restyles to teal, pins and the selection ring come back, no console errors.
- **Review Focus 4:** in DevTools → Network, block `tiles.openfreemap.org`, reload — the "The map couldn't load" panel appears with the campus-map link and the sidebar list still works.
- Mobile (390px): the sidebar is hidden; the "Sessions" button opens a bottom sheet; picking a session closes it and focuses the pin; the venue card sits above the bottom edge.
- Reduced motion: the ring does not pulse; `flyTo` jumps.
- From the home page, "Show on map →" on a schedule card opens `/map?session=…` focused on that venue.
- `npm run build` passes (static export with `useSearchParams` inside `Suspense`).

- [ ] **Step 8: Commit**

```bash
git add app components
git commit -m "Add /map campus guide with MapLibre, day tabs, session list and venue card

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- app components
```

---

### Task 12: Verify exact venue and room locations against UCSD sources

**Files:**
- Modify: `data/venues.ts`, `data/sessions.ts`

**Interfaces:**
- Consumes: `Venue`, `Session` types from Task 3.
- Produces: real (organiser-confirmed) venues/rooms/sessions with `verified: true`, `entrance`, `howToFind`, `parkingNote`, `sources`.

The seed data is a placeholder: coordinates come from Wikipedia and rooms are guesses. This task makes locations exact.

- [ ] **Step 1: Get the real programme from the organisers**

Ask the MSA organisers for: every session's title, time, building and room (as booked with UCSD), and where check-in and the bazaar happen. Replace the placeholder sessions in `data/sessions.ts` and add/remove venues in `data/venues.ts` to match. Do not keep rooms that are not actually booked.

- [ ] **Step 2: Look each venue up on the official UC San Diego Campus Map**

Open `https://campusmap.ucsd.edu/` in the browser (it is an ArcGIS Experience with building and room search). For each venue: search the building/room, note its floor, the nearest entrance, the accessible entrance, and the nearest parking structure or shuttle stop. Record the page URL(s) in `sources`.

- [ ] **Step 3: Cross-check coordinates against OpenStreetMap footprints**

For each venue name run (adjust the name):
```bash
curl -s --data-urlencode 'data=[out:json];(way["building"]["name"~"Price Center"](32.86,-117.26,32.90,-117.21););out center;' https://overpass-api.de/api/interpreter
```
Use the returned `center` as `coordinates` (`[lon, lat]`) if it differs noticeably (> ~15 m) from the seed. Put the building entrance point in `entrance.coordinates` when known.

- [ ] **Step 4: Write "how to find it" text**

For each room used, add `howToFind` (one or two sentences, e.g. which side to enter, stairs/elevator, floor) and set `entrance.note` / `entrance.accessible` and `parkingNote`. Keep sentences plain; guests read these on their phones.

- [ ] **Step 5: Mark verified**

Set `verified: true` only for venues checked in Step 2. Unverified venues keep `verified: false` (the UI shows a "Location not yet verified" badge).

- [ ] **Step 6: Check pins on the map**

Run `npm test` (the seed-integrity test must still pass), then `npm run dev`, open `/map`, zoom to 18 on each pin. The pin must sit on the correct building. Click each venue and confirm room, floor and directions read correctly. Open the Google Directions link and confirm it routes to the right building.

- [ ] **Step 7: Commit**

```bash
git add data
git commit -m "Replace placeholder venues and rooms with verified UCSD locations

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- data
```

---

### Task 13: Polish, README, remove legacy, final verification

**Files:**
- Create: `README.md`
- Delete: `legacy/`
- Modify: fixes found during verification only

**Interfaces:** none new.

- [ ] **Step 1: README**

`README.md`:
```markdown
# Tarbiyyah Conference site

Next.js (App Router, static export) + Tailwind + shadcn/ui. Includes a `/map` campus guide (MapLibre + OpenFreeMap).

## Run
    npm install
    npm run dev        # http://localhost:3000
    npm test           # unit tests (Vitest)
    npm run build      # static site in out/

## Edit
- Event date, date text, venue text, ticket link: `lib/site-config.ts`
- Venues, rooms, sessions (home schedule and map both read these): `data/`
- Speakers: `data/speakers.ts`
- Page copy: `components/site/*.tsx`
- Colours: CSS variables at the top of `app/globals.css`

## Structure
    app/         routes (home, /map) and global CSS
    components/  ui/ (shadcn), site/ (home page), map/ (map page)
    hooks/       use-in-view, use-count-up, use-hide-on-scroll
    lib/         pure helpers (tested) and config
    data/        venues, sessions, speakers
    tests/       Vitest tests for lib/

## Deploy
Static files in `out/`. Deploy at a domain root (Netlify, Vercel, Cloudflare Pages, or GitHub Pages with a custom domain); assets such as `/star.svg` assume the site is not served from a sub-path.
```

- [ ] **Step 2: Remove the legacy prototype**

Run: `git rm -r legacy`
Expected: `legacy/` removed (its content lives in git history).

- [ ] **Step 3: Full verification**

Run `npm test && npm run build`, then check manually with `npm run dev`:
- 1440px and 390px, light and dark, home and `/map`: no horizontal scroll, nothing overlapping, nav readable, hero content inside the arch.
- Keyboard: Tab reaches skip link, nav links, theme toggle, tickets, tabs (arrow keys), speaker cards, accordion, map sidebar and session buttons; focus rings visible; Esc closes dialogs and the mobile sheet.
- **Review Focus 4 (home):** DevTools → disable JavaScript → reload `/`: hero, skyline, sections, both schedule days and stats are visible; `/map` shows the plain session list and the campus-map link.
- Reduced motion emulated: no drift, flicker, pulse or spin; numbers final; strokes drawn.
- Console clean on `/` and `/map`; theme choice persists across reload; ticket buttons (nav, hero, HUD, tiers) open the configured URL in a new tab.
- Optional: Chrome Lighthouse on `/` — accessibility ≥ 95; fix any contrast failures on `text-muted-foreground` or `text-gold-text`.

- [ ] **Step 4: Commit**

```bash
git add -A -- . ':!node_modules' ':!.next' ':!out'
git status --short -- . | head -30
git commit -m "Add README, remove legacy prototype, final verification fixes

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- .
```
