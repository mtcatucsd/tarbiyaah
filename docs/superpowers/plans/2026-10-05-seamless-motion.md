# Seamless Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's six separate motion systems with one GSAP + ScrollTrigger + Lenis system whose sections hand off seamlessly, and replace the schedule spine with a scroll-driven "cards on a path" timeline — without changing the site's look.

**Architecture:** One client component, `MotionRoot`, registers GSAP plugins, runs Lenis on desktop from GSAP's ticker, and inside a single `gsap.matchMedia()` context runs a list of plain "scene" functions (`components/motion/scenes/*`). Scenes find their sections by `data-anim` / `data-scene` attributes, so section components stay Server Components. Everything a scene creates is reverted when the media context changes (e.g. reduced motion switched on), and hidden starting states exist only while `html.motion` is set, so no-JS and reduced-motion visitors see a static, fully visible page.

**Tech Stack:** Next.js 16.3 (App Router, static export), React 19.2, Tailwind CSS v4, GSAP 3.15 (ScrollTrigger, SplitText, MotionPathPlugin, CustomEase), `@gsap/react` 2.1, Lenis 1.3, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-05-seamless-motion-design.md`

## Global Constraints

- **Never run `git add`, `git commit` or `git push`.** The owner runs git. Each task ends with a checkpoint (`git status --short`), not a commit.
- Before changing framework behaviour, read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (Next.js 16 differs from older versions).
- Dependencies allowed: `gsap`, `@gsap/react`, `lenis`. Nothing else.
- Animate only `transform`, `opacity`, `clip-path` (and `stroke-dashoffset` for drawing). No `filter: blur`. No `pin: true`; sticky stages are a tall wrapper + `position: sticky`.
- Lenis only when `(hover: hover) and (pointer: fine)` and motion is allowed. Phones keep native scroll. Reduced motion: no scrubbing, no Lenis, nothing hidden.
- Text plays once at `top 85%`; decoration/depth is scrubbed with `scrub: 0.6`.
- SplitText on headings/statements only (`data-anim="lines"`), never on body paragraphs.
- The look (palette, fonts, engravings, Geisel scenes, copy, section order) does not change. The hero's top half keeps its look; only its scroll exit changes.
- Page growth: only the timeline stage adds height (~250 vh desktop / ~200 svh phone).
- `ticketLink(siteConfig.ticketUrl)` stays the only source of ticket hrefs.
- Session `summary`: 1–60 characters.
- After every task: `npx tsc --noEmit`, `npx eslint .`, `npm test`, `npm run build` all pass.
- Screenshots and scroll checks use the Playwright script in Task 1 (`playwright-core` from `/Users/zahir/.npm-cache-tmp/_npx/e78b33305587cb7c/node_modules/playwright-core`, `channel: "chrome"`), against the dev server on http://localhost:3000 (check `lsof -iTCP:3000 -sTCP:LISTEN` before starting one with `npm run dev`). Write scratch files to the session scratchpad, never the repo root.

## Deviations from the spec (flagged for the owner)

1. **No `use-scene.ts` hook.** Scenes are plain functions run by `MotionRoot` inside its one `gsap.matchMedia()` context, and they find their sections by `data-anim` / `data-scene`. This keeps every section a Server Component (only `MotionRoot` is client-side) and gives one place where everything reverts. Same behaviour as the spec, less client JS.
2. **The gallery's sideways parallax keeps its own listener.** It follows the carousel row's *horizontal* scroll, not the page scroll, so the shared page clock doesn't drive it. Only its entry glide joins the page choreography (Task 4).

## Review Focus

1. **Live switch to reduced motion** (OS setting toggled while the page is open): every scene reverts — no `html.motion`, no inline transforms left on timeline cards, timeline back to a plain list. Pinned in Task 6, Step 9.
2. **Arriving mid-page** (reload while scrolled, or opening `/#faq`): content above and at the landing point is visible, not stuck hidden by a `once` reveal. Pinned in Task 2, Step 9.
3. **Anchor links through Lenis and the tall timeline** (menu "Schedule", "FAQ", "Tickets"): the target lands just under the 56 px bar, not inside the sticky stage's middle. Pinned in Task 1, Step 8 and Task 6, Step 9.
4. **Resize / rotate while inside the timeline**: the curve and cards re-lay out to the new frame (no cards off-path or outside the frame). Pinned in Task 6, Step 9.
5. **Late font load re-wrapping split headings at 390 px**: lines re-split, nothing clipped by the mask. Pinned in Task 2, Step 9.

---

### Task 1: Motion foundation (dependencies, tokens, MotionRoot, Lenis)

**Files:**
- Create: `components/motion/tokens.ts`, `components/motion/lenis.ts`, `components/motion/scenes/index.ts`, `components/motion/motion-root.tsx`
- Modify: `package.json` (via npm), `app/page.tsx`
- Test: `tests/motion-tokens.test.ts`
- Scratch: `<scratchpad>/trace.mjs`, `<scratchpad>/shots.mjs`

**Interfaces:**
- Produces:
  - `EASE: { main: "tarb-main"; settle: "power3.out"; scrub: "none" }`, `MAIN_EASE_CURVE: string`, `DUR: { text: 0.9; block: 1.1 }`, `STAGGER: 0.08`, `SCRUB: 0.6`, `TEXT_START: "top 85%"`, `NAV_H: 56`, `MEDIA: { motion: string; desktop: string }` from `@/components/motion/tokens`
  - `type SceneEnv = { desktop: boolean }`, `type Scene = (env: SceneEnv) => void | (() => void)`, `scenes: Scene[]` from `@/components/motion/scenes`
  - `setLenis(l: Lenis | null): void`, `scrollToY(y: number): void` from `@/components/motion/lenis`
  - `<MotionRoot />` (client) from `@/components/motion/motion-root`

- [ ] **Step 1: Record the baseline (before any change)**

Write `<scratchpad>/trace.mjs`:

```js
// Scroll the page top to bottom with the mouse wheel and report frame times and page/JS size.
import { chromium } from "/Users/zahir/.npm-cache-tmp/_npx/e78b33305587cb7c/node_modules/playwright-core/index.mjs";
const [w, h] = (process.argv[2] ?? "1440x900").split("x").map(Number);
const b = await chromium.launch({ channel: "chrome" });
const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 700, isMobile: w < 700 });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push(e.message));
await p.goto("http://localhost:3000"); await p.waitForTimeout(3000);
await p.evaluate(() => { window.__f = []; let t = performance.now(); const loop = (n) => { window.__f.push(n - t); t = n; requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
const H = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 120) { await p.mouse.wheel(0, 120); await p.waitForTimeout(16); }
await p.waitForTimeout(1500);
const f = await p.evaluate(() => window.__f.slice(2));
const long = f.filter((d) => d > 25).length;
console.log(JSON.stringify({ viewport: `${w}x${h}`, height: H, frames: f.length, over25ms: long, worst: Math.round(Math.max(...f)), overflow: await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), errors }));
await b.close();
```

Run (dev server up):
```bash
node <scratchpad>/trace.mjs 1440x900; node <scratchpad>/trace.mjs 390x844
npm run build >/dev/null && find out/_next/static/chunks -name '*.js' -exec gzip -c {} \; | wc -c && du -sh out
```
Expected: two JSON lines and two numbers. Save them in the task notes as **baseline** (height, over25ms, worst, gzipped JS bytes, `out` size).

- [ ] **Step 2: Install dependencies**

```bash
npm install gsap@^3.15.0 @gsap/react@^2.1.2 lenis@^1.3.26
```
Expected: `package.json` dependencies gain the three packages; no peer-dependency errors.

- [ ] **Step 3: Write the failing tokens test**

`tests/motion-tokens.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { DUR, EASE, MAIN_EASE_CURVE, MEDIA, NAV_H, SCRUB, STAGGER, TEXT_START } from "@/components/motion/tokens";

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
    expect(NAV_H).toBe(56);
  });
});
```

- [ ] **Step 4: Run it to see it fail**

Run: `npx vitest run tests/motion-tokens.test.ts`
Expected: FAIL — `Failed to resolve import "@/components/motion/tokens"`.

- [ ] **Step 5: Implement tokens, the Lenis handle, the scene list and MotionRoot**

`components/motion/tokens.ts`:
```ts
// The site's one motion language (docs/superpowers/specs/2026-10-05-seamless-motion-design.md).
// Text plays once as it reaches TEXT_START; decoration and depth follow the scroll with SCRUB seconds of catch-up.
export const MAIN_EASE_CURVE = "M0,0 C0.9,0.1 0.1,0.9 1,1"; // cubic-bezier(.9,.1,.1,.9), as on times-event.de
export const EASE = { main: "tarb-main", settle: "power3.out", scrub: "none" } as const;
export const DUR = { text: 0.9, block: 1.1 } as const;
export const STAGGER = 0.08;
export const SCRUB = 0.6;
export const TEXT_START = "top 85%";
export const NAV_H = 56; // the fixed bar (h-14); anchor targets land just below it
export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  desktop: "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
} as const;
```

`components/motion/lenis.ts`:
```ts
import type Lenis from "lenis";

// The page's Lenis instance while smooth scrolling is on (desktop only), so scenes can scroll through it.
let current: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  current = lenis;
}

/** Scroll the page to `y` px: through Lenis on desktop, natively elsewhere. */
export function scrollToY(y: number) {
  if (current) current.scrollTo(y);
  else window.scrollTo({ top: y, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
```

`components/motion/scenes/index.ts`:
```ts
// Every scene runs inside MotionRoot's matchMedia context, only when motion is allowed. Tweens, ScrollTriggers and
// SplitTexts a scene creates are reverted automatically; a scene returns a cleanup only for anything else
// (event listeners, classes, attributes).
export type SceneEnv = { desktop: boolean };
export type Scene = (env: SceneEnv) => void | (() => void);

export const scenes: Scene[] = [];
```

`components/motion/motion-root.tsx`:
```tsx
"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { setLenis } from "@/components/motion/lenis";
import { scenes } from "@/components/motion/scenes";
import { EASE, MAIN_EASE_CURVE, MEDIA, NAV_H } from "@/components/motion/tokens";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, MotionPathPlugin, CustomEase);
CustomEase.create(EASE.main, MAIN_EASE_CURVE);

// The one clock for all scroll motion. On desktop Lenis smooths the wheel and is driven by GSAP's ticker, feeding
// ScrollTrigger, so every scene reads the same scroll position. `html.motion` marks that motion is on; the
// stylesheet only hides things (strokes to draw, hatching) under it, so without JS or with reduced motion the
// page is simply visible. Mount once, after the page content.
export function MotionRoot() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: MEDIA.motion, desktop: MEDIA.desktop }, (context) => {
      const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
      if (!motion) return;
      const html = document.documentElement;
      html.classList.add("motion");

      let lenis: Lenis | null = null;
      const tick = (time: number) => lenis?.raf(time * 1000);
      if (desktop) {
        lenis = new Lenis({ autoRaf: false, anchors: { offset: -NAV_H } });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        setLenis(lenis);
      }

      const cleanups = scenes.map((scene) => scene({ desktop })).filter((c): c is () => void => typeof c === "function");
      ScrollTrigger.refresh();

      return () => {
        cleanups.forEach((c) => c());
        html.classList.remove("motion");
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis?.destroy();
        setLenis(null);
      };
    });
    return () => mm.revert();
  });
  return null;
}
```

In `app/page.tsx` add the import and mount it as the last child of the fragment, after `</main>`:
```tsx
import { MotionRoot } from "@/components/motion/motion-root";
// ...
      </main>
      <MotionRoot />
    </>
```

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: all pass, including the 3 new token tests.

- [ ] **Step 7: Type-check, lint, build**

Run: `npx tsc --noEmit && npx eslint . && npm run build`
Expected: no errors; build ends with "prerendered as static content".

- [ ] **Step 8: Verify the foundation in the browser**

Write `<scratchpad>/shots.mjs` (reused by later tasks):
```js
// Usage: node shots.mjs <name> <WxH> <scrollY|#id> [reduce]  → <name>.png, plus a JSON line of checks.
import { chromium } from "/Users/zahir/.npm-cache-tmp/_npx/e78b33305587cb7c/node_modules/playwright-core/index.mjs";
const [name, size = "1440x900", where = "0", reduce] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const b = await chromium.launch({ channel: "chrome" });
const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 700, isMobile: w < 700, reducedMotion: reduce ? "reduce" : "no-preference" });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push(e.message));
await p.goto("http://localhost:3000"); await p.waitForTimeout(2500);
if (where.startsWith("#")) await p.evaluate((id) => document.querySelector(id).scrollIntoView(), where);
else { const y = Number(where); for (let s = 0; s < y; s += 150) { await p.mouse.wheel(0, Math.min(150, y - s)); await p.waitForTimeout(20); } }
await p.waitForTimeout(1800);
await p.screenshot({ path: `${process.cwd()}/${name}.png` });
console.log(JSON.stringify({ name, motionClass: await p.evaluate(() => document.documentElement.classList.contains("motion")), lenis: await p.evaluate(() => document.documentElement.classList.contains("lenis")), scrollY: await p.evaluate(() => scrollY), overflow: await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), errors }));
await b.close();
```

Run from the scratchpad directory:
```bash
node shots.mjs t1-desk 1440x900 1500; node shots.mjs t1-phone 390x844 1500; node shots.mjs t1-rm 1440x900 1500 reduce
```
Expected: desk `motionClass: true, lenis: true`; phone `motionClass: true, lenis: false`; reduced `motionClass: false, lenis: false`; no overflow, no errors. Open the PNGs: the page looks exactly as before.

Anchor check (Review Focus 3): in a desktop page, click the bar's "Get tickets" pill (it links to `#tickets` while `ticketUrl` is empty) and confirm with `getBoundingClientRect().top` that `#tickets` lands at 56 ± 4 px.

- [ ] **Step 9: Checkpoint**

Run: `git status --short`. Expected: `package.json`, `package-lock.json`, `app/page.tsx` modified; `components/motion/` and `tests/motion-tokens.test.ts` new. Do not commit.

---

### Task 2: Declarative reveals replace ScrollFocus, Reveal and useInView

**Files:**
- Create: `components/motion/scenes/reveals.ts`
- Modify: `components/motion/scenes/index.ts`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `components/site/qe/blocks.tsx`, `components/site/find-us.tsx`, `components/site/speakers.tsx`, `components/site/sponsors.tsx`, `components/site/faq.tsx`, `components/site/closing.tsx`, `components/site/gallery.tsx`, `components/site/schedule.tsx`, `components/site/hero/geisel-scene.tsx`
- Delete: `components/site/qe/scroll-focus.tsx`, `components/site/reveal.tsx`, `hooks/use-in-view.ts`

**Interfaces:**
- Consumes: `Scene`, `scenes` (Task 1); `EASE`, `DUR`, `STAGGER`, `TEXT_START` (Task 1).
- Produces: the attribute contract every later task uses —
  - `data-anim="lines"` — heading/statement; lines rise out of a mask once.
  - `data-anim="rise"` — block; short rise + fade once.
  - `data-anim="stagger"` — container; its children rise in turn once.
  - `data-anim="draw"` — engraving container; gets `data-in-view="true"` once, and the stylesheet draws its `.draw` strokes, fades its `.hatch-in` hatching and runs `.flicker-once`.
  - CSS: hidden starting states for `.draw` / `.hatch-in` exist only under `html.motion`.

- [ ] **Step 1: Write the reveals scene**

`components/motion/scenes/reveals.ts`:
```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { Scene } from "@/components/motion/scenes";
import { DUR, EASE, STAGGER, TEXT_START } from "@/components/motion/tokens";

// The page's text and engraving reveals, declared in markup with data-anim (see the plan's attribute contract).
// Each plays once as it reaches TEXT_START; arriving below that point plays it at once, so nothing stays hidden.
export const reveals: Scene = ({ desktop }) => {
  const once = (trigger: Element) => ({ trigger, start: TEXT_START, once: true });

  gsap.utils.toArray<HTMLElement>("[data-anim='lines']").forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true, // re-splits when fonts load or the width changes, keeping the animation's progress
      onSplit: (self) =>
        gsap.from(self.lines, { yPercent: 110, duration: DUR.text, ease: EASE.settle, stagger: STAGGER, scrollTrigger: once(el) }),
    });
  });

  gsap.utils.toArray<HTMLElement>("[data-anim='rise']").forEach((el) => {
    gsap.from(el, { y: desktop ? 24 : 12, autoAlpha: 0, duration: DUR.block, ease: EASE.settle, scrollTrigger: once(el) });
  });

  gsap.utils.toArray<HTMLElement>("[data-anim='stagger']").forEach((el) => {
    gsap.from(el.children, { y: desktop ? 28 : 14, autoAlpha: 0, duration: DUR.block, ease: EASE.settle, stagger: STAGGER, scrollTrigger: once(el) });
  });

  const drawn = gsap.utils.toArray<HTMLElement>("[data-anim='draw']");
  drawn.forEach((el) => {
    ScrollTrigger.create({ ...once(el), onEnter: () => { el.dataset.inView = "true"; } });
  });
  return () => drawn.forEach((el) => { delete el.dataset.inView; });
};
```

In `components/motion/scenes/index.ts` replace the empty list:
```ts
import { reveals } from "@/components/motion/scenes/reveals";
// ...types unchanged...
export const scenes: Scene[] = [reveals];
```
(Keep the type declarations above the import-free list; put the `import` at the top of the file. `reveals.ts` imports only the *type* `Scene`, so there is no runtime cycle.)

- [ ] **Step 2: Gate hidden states on `html.motion` in `app/globals.css`**

Replace the block from `/* ---------- reveal + stroke drawing (driven by data-in-view) ---------- */` through `[data-in-view="true"] .etch.draw { stroke-dashoffset: 0; }` with:
```css
/* ---------- stroke drawing (driven by data-in-view, set by the reveals scene) ---------- */
/* Strokes and hatching are only hidden while motion is on (html.motion), so no-JS and reduced-motion pages show them. */
.draw { stroke-dasharray: 1; stroke-dashoffset: 0; transition: stroke-dashoffset 1.3s var(--ease-out-expo); transition-delay: calc(var(--d, 0) * 0.12s + 0.1s); }
html.motion .draw { stroke-dashoffset: 1; }
html.motion [data-in-view="true"] .draw { stroke-dashoffset: 0; }
/* Engraved strokes use non-scaling-stroke, so their dashes are measured in screen pixels and pathLength
   normalisation would cut long outlines short on big screens. Use a pixel length longer than any outline. */
.etch.draw { stroke-dasharray: 6000; transition-duration: 1.9s; }
html.motion .etch.draw { stroke-dashoffset: 6000; }
html.motion [data-in-view="true"] .etch.draw { stroke-dashoffset: 0; }
```

Replace the `.hatch-in` rules with:
```css
/* Hatching fades in after its outline has started drawing. */
.hatch-in { transition: opacity 0.8s var(--ease-out-expo); transition-delay: calc(var(--d, 0) * 0.1s + 0.35s); }
html.motion .hatch-in { opacity: 0; }
html.motion [data-in-view="true"] .hatch-in { opacity: 1; }
```

Delete `[data-focus] { will-change: opacity; }` and, inside `@media (max-width: 640px)`, the `[data-reveal] { … }` line.

- [ ] **Step 3: Trim the no-JS stylesheet in `app/layout.tsx`**

Replace `noscriptCss` with (the spine lines go in Task 6):
```ts
// Without JS nothing may stay hidden: the hero intro and title, and all tab panels. (Scroll reveals only hide
// things while html.motion is set, which needs JS.)
const noscriptCss =
  ".spine-fill{transform:translateX(-50%)!important}" +
  ".spine-node{background:var(--ink)!important}.spine-connector{border-color:var(--ink)!important}" +
  ".intro{opacity:1!important;transform:none!important}.night-reel-wrap{opacity:1!important}.glyph{stroke-dashoffset:0!important;fill-opacity:1!important}" +
  "[role=tabpanel][hidden]{display:block!important}";
```

- [ ] **Step 4: Migrate markup**

Make these exact replacements (`data-focus=""` → the attribute shown; `<Reveal …>` → a plain element):

- `components/site/qe/blocks.tsx` (Intro): the `<h2 data-focus="">` → `data-anim="lines"`; the date `<p data-focus="">` → `data-anim="lines"`; the countdown wrapper `<div data-focus="" …>` → `data-anim="draw"` (triggers the digits' `.flicker-once`); `<Reveal className="w-[clamp(110px,12vw,160px)]">…</Reveal>` → `<div data-anim="rise" className="w-[clamp(110px,12vw,160px)]">…</div>`; the paragraph `<p data-focus="" …>` → `data-anim="rise"`. In `LanternBand`, `<Reveal fade={false} className="relative h-[160px] …">…</Reveal>` → `<div data-anim="draw" className="relative h-[160px] …">…</div>`. Remove the `Reveal` import.
- `components/site/find-us.tsx`: lead `<p data-focus="">` → `data-anim="lines"`; postcard `<Reveal fade={false} className="qe-print w-full max-w-[480px]">` → `<div data-anim="draw" className="qe-print w-full max-w-[480px]">`; body `<p data-focus="">` → `data-anim="rise"`; map `<Reveal className="qe-print w-full">` → `<div data-anim="rise" className="qe-print w-full">`. Close tags accordingly; remove the import.
- `components/site/speakers.tsx`: `<h2 data-focus="">` → `data-anim="lines"`; `<ul className="grid w-full …">` gains `data-anim="stagger"`; `<Reveal as="li" key={s.id} delay={i}>` → `<li key={s.id}>`, `</Reveal>` → `</li>`; remove the import.
- `components/site/sponsors.tsx`: `<p data-focus="">` → `data-anim="lines"`; the `<ul …>` gains `data-anim="stagger"`.
- `components/site/faq.tsx`: `<h2 data-focus="">` → `data-anim="lines"`; `<Reveal className="w-full max-w-[720px] text-left">` → `<div data-anim="rise" className="w-full max-w-[720px] text-left">`; remove the import.
- `components/site/closing.tsx`: `<p data-focus="" className="qe-lead-sm …">` → `data-anim="lines"`.
- `components/site/gallery.tsx`: `<p data-focus="" className="qe-lead-sm …">` → `data-anim="lines"`.
- `components/site/schedule.tsx`: `<h2 data-focus="">` → `data-anim="lines"`.
- `components/site/hero/geisel-scene.tsx`: `<Reveal fade={false} className="flex h-[var(--sky-h)] items-end justify-center">` → `<div data-anim="draw" className="flex h-[var(--sky-h)] items-end justify-center">`, `</Reveal>` → `</div>`; remove the import.
- `app/page.tsx`: remove `import { ScrollFocus } …` and `<ScrollFocus />`.

`components/site/schedule.tsx` still uses `useInView` in `Stop`; replace its two lines so the spine keeps working until Task 6:
```tsx
// before: const { ref: cardRef, inView } = useInView<HTMLDivElement>(0.3);
// after (the card draws its border as soon as it is rendered; the whole spine is replaced in Task 6):
const inView = true;
```
and remove `ref={cardRef}` from `<Card …>` and the `useInView` import.

- [ ] **Step 5: Delete the old systems**

```bash
rm components/site/qe/scroll-focus.tsx components/site/reveal.tsx hooks/use-in-view.ts
grep -rn "data-focus\|<Reveal\|from \"@/components/site/reveal\"\|useInView\|ScrollFocus\|data-reveal" app components hooks lib
```
Expected: the grep prints nothing.

- [ ] **Step 6: Type-check, lint, test, build**

Run: `npx tsc --noEmit && npx eslint . && npm test && npm run build`
Expected: all pass.

- [ ] **Step 7: Screenshots mid-reveal and settled**

From the scratchpad: `node shots.mjs t2-desk 1440x900 900; node shots.mjs t2-phone 390x844 900; node shots.mjs t2-rm 390x844 900 reduce`
Expected: theme title/date visible with clean line breaks (no clipped descenders), countdown, palm, paragraph; reduced-motion shot identical in content. No errors or overflow.

- [ ] **Step 8: No-JS check**

In Playwright with `javaScriptEnabled: false` (add `javaScriptEnabled: false` to `newContext` in a copy of `shots.mjs`), screenshot `#find-us` and `#faq`. Expected: headings, postcard strokes, hatching and map all visible.

- [ ] **Step 9: Review Focus 2 and 5**

- Open `http://localhost:3000/#faq` (desktop and 390 px), wait 2 s, screenshot. Expected: the FAQ heading and list are visible (not stuck at `opacity: 0`); scroll up 600 px — the sponsors line above is visible too.
- At 390 px, throttle fonts: `await p.route(/\.woff2$/, r => setTimeout(() => r.continue(), 1500))` before `goto`, then scroll to `#about`. Expected: after fonts land, the title re-splits; no line is cut off by the mask (compare against a non-throttled shot).

- [ ] **Step 10: Checkpoint**

Run: `git status --short` and confirm the three deleted files show as `D`. Do not commit.

---

### Task 3: Hero exit, curtain into the theme, nav tied to the curtain

**Files:**
- Create: `components/motion/scenes/hero.ts`
- Modify: `components/motion/scenes/index.ts`, `components/site/hero/hero.tsx`, `components/site/hero/hero-motion.tsx`, `components/site/qe/blocks.tsx` (Intro), `components/site/nav.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `Scene`, `EASE`, `SCRUB`, `NAV_H`.
- Produces: `data-curtain` on the theme section (`#about`); classes `.hero-copy`, `.hero-ground` in the hero; `.curtain` CSS.

- [ ] **Step 1: Mark the hero layers**

In `components/site/hero/hero.tsx`: add `hero-copy` to the copy wrapper's className (`"hero-copy relative z-10 flex w-full max-w-[1500px] …"`) and `hero-ground` to the Geisel wrapper (`"hero-ground pointer-events-none absolute inset-x-0 bottom-0 z-[2]"`). Update the comment's last sentence to: `HeroMotion adds the pointer and intro behaviour; its scroll exit is the hero scene (components/motion/scenes/hero.ts).`

- [ ] **Step 2: Remove the scroll half of HeroMotion**

In `components/site/hero/hero-motion.tsx`: delete `scrollTargets`, the `p` computation and `set(scrollTargets, "--p", …)`, the `window` scroll and resize listeners and their removal, and the initial `schedule()` call. Keep `data-ready`, pointer tracking and `onLeave`. Update the header comment: `Drives the hero's intro and pointer effects without re-rendering: it marks the hero ready (starting the intro) and writes the pointer position into CSS variables. Scroll motion lives in the hero scene.`

- [ ] **Step 3: The curtain markup and CSS**

In `blocks.tsx` `Intro`, change the section to `<section id="about" data-curtain="" className="curtain qe-section grid justify-items-center gap-6 md:gap-7">`.

Append to `app/globals.css` (after the hero rules):
```css
/* The cream page rises over the hero as an arch with the hero's gold ground line on its edge (hero scene). */
.curtain { --arch: clamp(40px, 7vw, 110px); position: relative; z-index: 5; margin-top: calc(var(--arch) * -1);
  padding-top: calc(var(--arch) + 2rem); background: var(--background); border-top: 3px solid var(--gold-bright);
  border-radius: 50% 50% 0 0 / var(--arch) var(--arch) 0 0; }
```

- [ ] **Step 4: Write the hero scene**

`components/motion/scenes/hero.ts`:
```ts
import gsap from "gsap";
import type { Scene } from "@/components/motion/scenes";
import { EASE, SCRUB } from "@/components/motion/tokens";

// Hero → theme: as the hero scrolls away its reel and title drift up and dim (their CSS reads --p), the copy fades,
// and the Geisel ground sinks more slowly; meanwhile the cream curtain rises over it a little faster than the scroll.
export const hero: Scene = ({ desktop }) => {
  const top = document.getElementById("top");
  const curtain = document.querySelector<HTMLElement>("[data-curtain]");
  if (!top) return;
  const exit = { trigger: top, start: "top top", end: "bottom top", scrub: SCRUB };
  gsap.to(top.querySelectorAll(".night-title, .reel-row"), { "--p": 1, ease: EASE.scrub, scrollTrigger: exit });
  gsap.to(top.querySelector(".hero-copy"), { y: desktop ? -40 : -20, autoAlpha: 0.15, ease: EASE.scrub, scrollTrigger: exit });
  gsap.to(top.querySelector(".hero-ground"), { yPercent: desktop ? 18 : 8, ease: EASE.scrub, scrollTrigger: exit });
  if (curtain) {
    gsap.from(curtain, { y: desktop ? 120 : 60, ease: EASE.scrub, scrollTrigger: { trigger: curtain, start: "top bottom", end: "top 35%", scrub: SCRUB } });
  }
};
```
Register it first in `scenes/index.ts`: `export const scenes: Scene[] = [hero, reveals];` (with `import { hero } from "@/components/motion/scenes/hero";`).

- [ ] **Step 5: Nav switches when the curtain reaches the bar**

In `components/site/nav.tsx`, inside `check`, replace the `setSolid(...)` line with:
```ts
      // Cream once the curtain (the theme section's arched top) has reached the bar; before that, over the hero.
      const curtain = document.querySelector("[data-curtain]");
      setSolid(curtain ? curtain.getBoundingClientRect().top <= 56 : window.scrollY > 120);
```
(Lenis scrolls the window, so the existing scroll listener stays in step with it.)

- [ ] **Step 6: Type-check, lint, test, build**

Run: `npx tsc --noEmit && npx eslint . && npm test && npm run build`. Expected: pass.

- [ ] **Step 7: Screenshots of the handoff**

`node shots.mjs t3-0 1440x900 0; node shots.mjs t3-mid 1440x900 450; node shots.mjs t3-end 1440x900 900; node shots.mjs t3-phone-mid 390x844 420; node shots.mjs t3-rm 1440x900 450 reduce`
Expected: at 0 the hero looks exactly as before except a cream arch edge with the gold line peeking at the very bottom; mid: title/reel dimmed and lifted, curtain arch over the Geisel base; end: nav cream, theme title readable under the bar. Reduced motion: no drift, curtain static (arch visible). Hero top half unchanged at 0.

- [ ] **Step 8: Checkpoint** — `git status --short`. Do not commit.

---

### Task 4: Section scenes — palm, venue, lanterns, speakers, FAQ, gallery entry

**Files:**
- Create: `components/motion/scenes/sections.ts`
- Modify: `components/motion/scenes/index.ts`, `components/site/qe/blocks.tsx`, `components/site/find-us.tsx`, `components/site/speakers.tsx`, `components/site/faq.tsx`, `components/site/gallery.tsx`

**Interfaces:**
- Consumes: `Scene`, `EASE`, `DUR`, `STAGGER`, `SCRUB`, `TEXT_START`; `data-anim` contract (Task 2).
- Produces: `data-scene` hooks `palm`, `venue-postcard`, `venue-map`, `lanterns`, `speakers`, `faq`, `gallery`.

- [ ] **Step 1: Add the hooks to the markup**

- `blocks.tsx` Intro: the palm wrapper becomes `<div data-scene="palm" className="w-[clamp(110px,12vw,160px)]">` (drop `data-anim="rise"`).
- `blocks.tsx` LanternBand: the cord `<svg …>` gains `className="lantern-cordline absolute inset-0 size-full"` (keep its other props); the cord `<path … className="etch etch-hair draw" />` → `className="etch etch-hair"`; the lanterns' wrapper `<div className="hatch-in" style={{ "--d": 3 } as CSSProperties}>` → `<div>`, and each `<SwingingLantern … />` is wrapped as `<div key={x} className="lantern-drop absolute inset-0"><SwingingLantern … /></div>` (move the `key` to the wrapper). The outer `<div data-anim="draw" …>` becomes `<div data-scene="lanterns" …>`. Remove the now-unused `CSSProperties` import if nothing else uses it.
- `find-us.tsx`: the postcard div keeps `data-anim="draw"` and gains `data-scene="venue-postcard"`; the map div's `data-anim="rise"` → `data-scene="venue-map"`.
- `speakers.tsx`: the `<ul>`'s `data-anim="stagger"` → `data-scene="speakers"`.
- `faq.tsx`: the list wrapper's `data-anim="rise"` → `data-scene="faq"`.
- `gallery.tsx`: the `<section id="gallery" …>` gains `data-scene="gallery"`.

- [ ] **Step 2: Write the sections scene**

`components/motion/scenes/sections.ts`:
```ts
import gsap from "gsap";
import type { Scene } from "@/components/motion/scenes";
import { DUR, EASE, SCRUB, STAGGER, TEXT_START } from "@/components/motion/tokens";

const one = (sel: string) => document.querySelector<HTMLElement>(sel);
const all = (sel: string, root?: Element | null) => gsap.utils.toArray<HTMLElement>(sel, root ?? document);
const scrubbed = (trigger: Element, start = "top bottom", end = "top 45%") => ({ trigger, start, end, scrub: SCRUB });

// The middle of the page: each section's depth follows the scroll and begins while the previous one is leaving.
export const sections: Scene = ({ desktop }) => {
  const palm = one("[data-scene='palm']");
  if (palm) gsap.fromTo(palm, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: EASE.scrub, scrollTrigger: scrubbed(palm, "top 95%", "top 55%") });

  const card = one("[data-scene='venue-postcard']");
  const map = one("[data-scene='venue-map']");
  if (card) gsap.from(card, { x: desktop ? -60 : -24, autoAlpha: 0, ease: EASE.scrub, scrollTrigger: scrubbed(card, "top bottom", "top 55%") });
  if (map) gsap.from(map, { x: desktop ? 60 : 24, autoAlpha: 0, ease: EASE.scrub, scrollTrigger: scrubbed(map, "top bottom", "top 55%") });

  const band = one("[data-scene='lanterns']");
  if (band) {
    const cord = band.querySelector(".lantern-cordline");
    if (cord) gsap.fromTo(cord, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: EASE.scrub, scrollTrigger: scrubbed(band, "top bottom", "top 50%") });
    gsap.from(all(".lantern-drop", band), { y: desktop ? -90 : -50, autoAlpha: 0, ease: EASE.scrub, stagger: 0.06, scrollTrigger: scrubbed(band, "top 95%", "top 35%") });
  }

  const speakers = one("[data-scene='speakers']");
  if (speakers) {
    all(":scope > li", speakers).forEach((li, i) => {
      gsap.from(li, { y: (desktop ? 90 : 40) + (i % 4) * (desktop ? 30 : 12), autoAlpha: 0, ease: EASE.scrub, scrollTrigger: scrubbed(speakers, "top bottom", "top 40%") });
    });
  }

  const faq = one("[data-scene='faq']");
  if (faq) {
    gsap.fromTo(all("[data-slot='accordion-item']", faq), { clipPath: "inset(0% 100% 0% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", duration: DUR.block, ease: EASE.main, stagger: STAGGER, clearProps: "clipPath",
      scrollTrigger: { trigger: faq, start: TEXT_START, once: true },
    });
  }

  const gallery = one("[data-scene='gallery']");
  const row = gallery?.querySelector(".pcar");
  if (gallery && row) gsap.from(row, { x: desktop ? "25vw" : "12vw", ease: EASE.scrub, scrollTrigger: scrubbed(gallery, "top bottom", "top 40%") });
};
```
Register: `export const scenes: Scene[] = [hero, reveals, sections];`.

- [ ] **Step 3: Type-check, lint, test, build** — `npx tsc --noEmit && npx eslint . && npm test && npm run build`. Expected: pass.

- [ ] **Step 4: Screenshots mid-handoff**

For each id, take a desktop and a phone shot with the section's top at ~70% of the viewport (scroll to its offset minus 0.7 × height) and one settled (`#id`): `#about` (palm half-grown), `#find-us` (postcard/map converging), the lantern band (cord half-drawn, lanterns lowering), `#speakers` (cards at staggered heights), `#gallery` (row gliding in), `#faq` (rows wiping in). Extend `shots.mjs` with a `#id@0.7` form: `const [sel, at] = where.split("@"); await p.evaluate(([s, a]) => scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY - innerHeight * Number(a)), [sel, at]);`.
Expected: each shows the in-between state; settled shots match the pre-change layout; no overflow (the gallery's `25vw` offset must not cause page scroll — `.pcar` is `overflow-x: auto` inside a full-width section; confirm `overflow: false`).

- [ ] **Step 5: Checkpoint** — `git status --short`. Do not commit.

---

### Task 5: Timeline helpers and session summaries (pure, test-first)

**Files:**
- Create: `lib/timeline.ts`, `tests/timeline.test.ts`
- Modify: `data/types.ts`, `data/sessions.ts`, `tests/event-data.test.ts`

**Interfaces:**
- Produces (from `@/lib/timeline`):
  - `cardOffset(i: number, n: number, p: number, spacing: number): number` — position of card i along the path (0 left end … 1 right end); the current card is at 0.5.
  - `currentIndex(p: number, n: number): number`
  - `curvePath(w: number, h: number): string` — SVG path `d` for a frame w × h.
  - `clampTilt(deg: number, max?: number): number` (default max 18)
  - `cardScale(u: number, spacing: number): number` — 1.08 at the centre, 1 from one spacing away.
  - `cardAlpha(u: number): number` — 0 off the path, fading in over the outer 0.08.
- Produces: `Session.summary: string`.

- [ ] **Step 1: Write the failing helper tests**

`tests/timeline.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { cardAlpha, cardOffset, cardScale, clampTilt, currentIndex, curvePath } from "@/lib/timeline";

describe("cardOffset", () => {
  it("puts the first card at the centre at the start and the last at the end", () => {
    expect(cardOffset(0, 6, 0, 0.2)).toBe(0.5);
    expect(cardOffset(5, 6, 1, 0.2)).toBe(0.5);
  });
  it("spaces the train by `spacing` and moves it right to left", () => {
    expect(cardOffset(1, 6, 0, 0.2)).toBeCloseTo(0.7);
    expect(cardOffset(0, 6, 1, 0.2)).toBeCloseTo(-0.5);
  });
  it("keeps a single card centred", () => {
    expect(cardOffset(0, 1, 0.7, 0.2)).toBe(0.5);
  });
});

describe("currentIndex", () => {
  it("maps progress to the nearest card", () => {
    expect(currentIndex(0, 6)).toBe(0);
    expect(currentIndex(0.09, 6)).toBe(0);
    expect(currentIndex(0.5, 6)).toBe(3);
    expect(currentIndex(1, 6)).toBe(5);
  });
  it("clamps progress outside 0..1 and handles one card", () => {
    expect(currentIndex(-1, 6)).toBe(0);
    expect(currentIndex(2, 6)).toBe(5);
    expect(currentIndex(0.3, 1)).toBe(0);
  });
});

describe("curvePath", () => {
  it("is a dip wider than the frame, lowest in the middle", () => {
    expect(curvePath(1000, 800)).toBe("M -100 64 C 300 576, 700 576, 1100 64");
  });
  it("scales with the frame", () => {
    expect(curvePath(390, 844)).toBe("M -39 67.5 C 117 607.7, 273 607.7, 429 67.5");
  });
});

describe("clampTilt", () => {
  it("limits tilt to ±18° by default", () => {
    expect(clampTilt(30)).toBe(18);
    expect(clampTilt(-40)).toBe(-18);
    expect(clampTilt(5)).toBe(5);
    expect(clampTilt(30, 10)).toBe(10);
  });
});

describe("cardScale and cardAlpha", () => {
  it("enlarges only the card near the centre", () => {
    expect(cardScale(0.5, 0.2)).toBeCloseTo(1.08);
    expect(cardScale(0.6, 0.2)).toBeCloseTo(1.04);
    expect(cardScale(0.7, 0.2)).toBe(1);
    expect(cardScale(-3, 0.2)).toBe(1);
  });
  it("fades cards at the ends of the path and hides them beyond", () => {
    expect(cardAlpha(0.5)).toBe(1);
    expect(cardAlpha(0.04)).toBeCloseTo(0.5);
    expect(cardAlpha(0)).toBe(0);
    expect(cardAlpha(1.2)).toBe(0);
    expect(cardAlpha(-0.3)).toBe(0);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/timeline.test.ts`
Expected: FAIL — cannot resolve `@/lib/timeline`.

- [ ] **Step 3: Implement the helpers**

`lib/timeline.ts`:
```ts
// Pure geometry for the schedule's "cards on a path" (components/motion/scenes/timeline.ts).
// u is a card's position along the curve: 0 = left end, 1 = right end, 0.5 = the bottom of the dip (the current card).

/** Where card i of n sits along the path when the train is at progress p (0..1). The train moves right to left. */
export function cardOffset(i: number, n: number, p: number, spacing: number) {
  const lead = n > 1 ? p * (n - 1) : 0;
  return 0.5 + (i - lead) * spacing;
}

/** The session the train is on at progress p. */
export function currentIndex(p: number, n: number) {
  if (n <= 1) return 0;
  return Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))));
}

/** The dip the cards ride, in the frame's pixels: wider than the frame so cards enter and leave at the sides. */
export function curvePath(w: number, h: number) {
  const r = (v: number) => Math.round(v * 10) / 10;
  return `M ${r(-0.1 * w)} ${r(0.08 * h)} C ${r(0.3 * w)} ${r(0.72 * h)}, ${r(0.7 * w)} ${r(0.72 * h)}, ${r(1.1 * w)} ${r(0.08 * h)}`;
}

/** Cards lean with the curve, but never so far that their text is hard to read. */
export function clampTilt(deg: number, max = 18) {
  return Math.max(-max, Math.min(max, deg));
}

/** 1.08 for the card at the centre, easing to 1 one spacing away. */
export function cardScale(u: number, spacing: number) {
  return 1 + 0.08 * Math.max(0, 1 - Math.abs(u - 0.5) / spacing);
}

/** Fully visible along the path, fading over its outer 8%, hidden beyond its ends. */
export function cardAlpha(u: number) {
  return Math.min(1, Math.max(0, Math.min(u, 1 - u) / 0.08));
}
```

- [ ] **Step 4: Run the helper tests**

Run: `npx vitest run tests/timeline.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Write the failing summary test**

Append to `tests/event-data.test.ts`:
```ts
import { sessions } from "@/data/sessions";

describe("session summaries", () => {
  it("every session has a one-line summary of 1–60 characters", () => {
    for (const s of sessions) {
      expect(s.summary.trim().length, s.id).toBeGreaterThan(0);
      expect(s.summary.length, s.id).toBeLessThanOrEqual(60);
    }
  });
});
```
(If `describe`/`expect`/`it` are already imported at the top of the file, don't import them again; put the `sessions` import with the other imports.)

Run: `npx vitest run tests/event-data.test.ts`
Expected: FAIL — `s.summary` is undefined (TypeScript errors too).

- [ ] **Step 6: Add the field and placeholder summaries**

`data/types.ts`, in `Session`, after `description: string;`:
```ts
  summary: string;     // one line for the timeline cards, at most 60 characters
```

`data/sessions.ts` — add a `summary` to each session (placeholders, like the titles):
```ts
  { ...base, id: "checkin", title: "Doors & check-in", summary: "Pick up your badge and find a seat.", start: …, end: … },
  { ...base, id: "opening", title: "Opening session", summary: "Welcome, recitation and the day's intention.", … },
  { ...base, id: "lecture", title: "Lecture", summary: "On the traits of Ibad al-Rahman.", … },
  { ...base, id: "workshops", title: "Workshops", summary: "Small groups turning knowledge into practice.", … },
  { ...base, id: "panel", title: "Panel discussion", summary: "Speakers in conversation, and your questions.", … },
  { ...base, id: "closing", title: "Closing session", summary: "Reflections to carry home.", … },
```
(Keep each existing `start`/`end` exactly as it is.) Update the file's comment: `Titles, summaries, times and descriptions are placeholders until the programme is final.`

- [ ] **Step 7: Run all tests, type-check**

Run: `npm test && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Checkpoint** — `git status --short`. Do not commit.

---

### Task 6: The "cards on a path" timeline

**Files:**
- Create: `components/motion/scenes/timeline.ts`
- Modify (rewrite): `components/site/schedule.tsx`
- Modify: `components/motion/scenes/index.ts`, `app/globals.css`, `app/layout.tsx`, `lib/event-data.ts`, `tests/event-data.test.ts`
- Delete: `hooks/use-scroll-progress.ts`, `lib/scroll-progress.ts`, `tests/scroll-progress.test.ts`

**Interfaces:**
- Consumes: `cardOffset`, `currentIndex`, `curvePath`, `clampTilt`, `cardScale`, `cardAlpha` (Task 5); `scrollToY` (Task 1); `Scene`, `EASE`, `SCRUB`.
- Produces: markup classes `.tl`, `.tl-frame`, `.tl-path`, `.tl-curve`, `.tl-list`, `.tl-card`, `.tl-summary`, `.tl-full`, `.tl-now`, `.tl-now-text`, `.tl-progress`, `.tl-bar`; state class `.is-staged` (set by the scene).

- [ ] **Step 1: Rewrite the schedule as static markup**

`components/site/schedule.tsx` (no `"use client"`; it becomes a Server Component):
```tsx
import { Section } from "@/components/site/section";
import { sessions } from "@/data/sessions";
import { formatTimeRange, sessionsForDay } from "@/lib/event-data";
import { siteConfig } from "@/lib/site-config";

const hour = (iso: string) => new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone: siteConfig.timeZone }).format(new Date(iso));

// The day as cards riding an engraved curve (after times-event.de). This is the plain list: without JS or with
// reduced motion it is a readable stack of cards. The timeline scene (components/motion/scenes/timeline.ts) stages
// it: a tall wrapper with a sticky frame, the cards placed on the curve and moved by the scroll, the current
// session's full description under the curve and a gold line marking the hour.
// Session titles, summaries and times are placeholders until the programme is final (see data/sessions.ts).
export function Schedule() {
  const list = sessionsForDay(sessions, "all");
  return (
    <Section id="schedule">
      <div className="mb-8 grid justify-items-center gap-3 text-center">
        <p className="mono-label">Schedule</p>
        <h2 data-anim="lines" className="qe-lead">The day at a glance</h2>
        <p data-anim="rise" className="qe-body">{siteConfig.dateText} · {siteConfig.timeText} · {siteConfig.venueText}</p>
      </div>
      <div className="tl" data-scene="timeline">
        <div className="tl-frame">
          <svg className="tl-path" aria-hidden="true"><path className="etch etch-hair tl-curve" /></svg>
          <ol className="tl-list">
            {list.map((s) => (
              <li key={s.id} className="tl-card">
                <span className="mono-label">{formatTimeRange(s.start, s.end, siteConfig.timeZone)}</span>
                <h3 className="font-display text-2xl leading-tight text-ink-deep">{s.title}</h3>
                <p className="tl-summary text-sm leading-snug text-ink-deep/80">{s.summary}</p>
                <p className="tl-full font-mono text-sm leading-7 text-muted-foreground">{s.description}</p>
              </li>
            ))}
          </ol>
          <div className="tl-now" aria-hidden="true">
            {list.map((s) => <p key={s.id} className="tl-now-text qe-body">{s.description}</p>)}
          </div>
          {list.length > 0 ? (
            <div className="tl-progress" aria-hidden="true">
              <span className="mono-label">{hour(list[0].start)}</span>
              <span className="tl-bar"><i /></span>
              <span className="mono-label">{hour(list[list.length - 1].end)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Replace the spine CSS**

In `app/globals.css`, delete everything from `/* ---------- schedule spine ---------- */` through the last `.spine-*` rule (including `.spine-border` and its `[data-in-view]` rules), and add:
```css
/* ---------- schedule: cards on a path (components/site/schedule.tsx + the timeline scene) ---------- */
/* Static (no JS, reduced motion): a plain stack of cards. */
.tl-list { display: grid; gap: 1rem; max-width: 640px; margin-inline: auto; padding: 0; list-style: none; }
.tl-card { display: grid; gap: 0.35rem; padding: 1rem 1.1rem; text-align: left; background: #fbf8f0; border: 1.5px solid var(--ink);
  border-radius: 14px; box-shadow: 0 12px 26px -16px rgb(31 79 92 / 0.45); }
.tl-card:focus-visible { outline: 2px solid var(--ink-deep); outline-offset: 3px; }
.tl-path, .tl-now, .tl-progress { display: none; }
/* Staged: a tall wrapper whose frame sticks to the screen while the cards travel. */
.tl.is-staged { height: 250vh; }
.tl.is-staged .tl-frame { position: sticky; top: 0; height: 100vh; height: 100svh; overflow: hidden; }
.tl.is-staged .tl-path { display: block; position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.tl.is-staged .tl-curve { stroke-dasharray: 3 7; }
.tl.is-staged .tl-list { display: block; max-width: none; }
.tl.is-staged .tl-card { position: absolute; left: 0; top: 0; width: clamp(200px, 22vw, 280px); will-change: transform, opacity; }
.tl.is-staged .tl-full { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.tl.is-staged .tl-now { display: grid; position: absolute; left: 50%; bottom: 13%; width: min(560px, 88%); transform: translateX(-50%); text-align: center; }
.tl-now-text { grid-area: 1 / 1; opacity: 0; visibility: hidden; }
.tl.is-staged .tl-progress { display: flex; align-items: center; gap: 0.75rem; position: absolute; left: 6%; right: 6%; bottom: 5%; }
.tl-bar { position: relative; flex: 1; height: 1px; background: color-mix(in srgb, var(--ink) 30%, transparent); }
.tl-bar i { position: absolute; inset: -1px 0; background: var(--gold-bright); transform-origin: left; transform: scaleX(0); }
@media (max-width: 640px) {
  .tl.is-staged { height: 200svh; }
  .tl.is-staged .tl-card { width: 62vw; }
  .tl.is-staged .tl-now { bottom: 14%; }
}
```

- [ ] **Step 3: Write the timeline scene**

`components/motion/scenes/timeline.ts`:
```ts
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { scrollToY } from "@/components/motion/lenis";
import type { Scene } from "@/components/motion/scenes";
import { EASE, SCRUB } from "@/components/motion/tokens";
import { cardAlpha, cardOffset, cardScale, clampTilt, currentIndex, curvePath } from "@/lib/timeline";

// Stages the schedule (components/site/schedule.tsx): the wrapper grows tall and its frame sticks; the curve is drawn
// to the frame's size; one scrubbed tween moves the train of cards along it (right to left), enlarging the one at the
// bottom of the dip, cross-fading its full description and filling the gold hour line. Focusing a card scrolls to
// where it is centred. Reverting (e.g. reduced motion switched on) returns the plain list.
export const timeline: Scene = ({ desktop }) => {
  const root = document.querySelector<HTMLElement>("[data-scene='timeline']");
  const frame = root?.querySelector<HTMLElement>(".tl-frame");
  const svg = root?.querySelector<SVGSVGElement>(".tl-path");
  const curve = root?.querySelector<SVGPathElement>(".tl-curve");
  const bar = root?.querySelector<HTMLElement>(".tl-bar i");
  if (!root || !frame || !svg || !curve) return;
  const cards = gsap.utils.toArray<HTMLElement>(".tl-card", root);
  const texts = gsap.utils.toArray<HTMLElement>(".tl-now-text", root);
  const n = cards.length;
  if (!n) return;
  const spacing = desktop ? 0.2 : 0.34;

  root.classList.add("is-staged");
  cards.forEach((c) => { c.tabIndex = 0; });
  gsap.set(cards, { xPercent: -50, yPercent: -50 });

  let raw = MotionPathPlugin.getRawPath(curve);
  const layout = () => {
    const { width: w, height: h } = frame.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    curve.setAttribute("d", curvePath(w, h));
    raw = MotionPathPlugin.cacheRawPathMeasurements(MotionPathPlugin.getRawPath(curve));
  };

  const state = { p: 0 };
  let current = -1;
  const render = () => {
    cards.forEach((card, i) => {
      const u = cardOffset(i, n, state.p, spacing);
      const pos = MotionPathPlugin.getPositionOnPath(raw, Math.min(1, Math.max(0, u)), true);
      gsap.set(card, { x: pos.x, y: pos.y, rotation: clampTilt(pos.angle ?? 0), scale: cardScale(u, spacing), autoAlpha: cardAlpha(u) });
    });
    if (bar) gsap.set(bar, { scaleX: state.p });
    const idx = currentIndex(state.p, n);
    if (idx !== current) {
      current = idx;
      texts.forEach((t, i) => gsap.to(t, { autoAlpha: i === idx ? 1 : 0, duration: 0.4, ease: "power1.out", overwrite: true }));
    }
  };

  layout();
  const tween = gsap.to(state, {
    p: 1,
    ease: EASE.scrub,
    onUpdate: render,
    scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: SCRUB, onRefresh: () => { layout(); render(); } },
  });
  render();

  const onFocus = (e: FocusEvent) => {
    const st = tween.scrollTrigger;
    const i = cards.indexOf(e.currentTarget as HTMLElement);
    if (st && i >= 0) scrollToY(st.start + (n > 1 ? i / (n - 1) : 0) * (st.end - st.start));
  };
  cards.forEach((c) => c.addEventListener("focus", onFocus));

  return () => {
    cards.forEach((c) => { c.removeEventListener("focus", onFocus); c.removeAttribute("tabindex"); });
    gsap.set([...cards, ...texts, ...(bar ? [bar] : [])], { clearProps: "all" });
    root.classList.remove("is-staged");
  };
};
```
Register after `sections`: `export const scenes: Scene[] = [hero, reveals, sections, timeline];`.

Note: `getPositionOnPath(rawPath, progress, includeAngle)` returns `{ x, y, angle }` in the path's own units, which equal the frame's pixels because the viewBox is set to the frame size. If `tsc` reports `angle` as possibly undefined, the `?? 0` above covers it.

- [ ] **Step 4: Remove the spine's leftovers**

```bash
rm hooks/use-scroll-progress.ts lib/scroll-progress.ts tests/scroll-progress.test.ts
grep -rn "spine\|useScrollProgress\|scroll-progress\|hasMultipleDays\|Tabs" components app lib hooks tests
```
- In `app/layout.tsx` `noscriptCss`, delete the two `.spine-…` string lines and `"[role=tabpanel][hidden]{display:block!important}"` (no tabs remain; check with the grep). Keep the `.intro…` line.
- If the grep shows `hasMultipleDays` is used only in `lib/event-data.ts` and its test, delete the function and its test cases (the event is one day; spec: day tabs removed).
- `components/ui/tabs.tsx` and `components/ui/card.tsx`: delete them only if the grep shows no remaining imports (`grep -rn "ui/tabs\|ui/card" components app`).
Expected after edits: the grep prints nothing except intentional matches you can explain.

- [ ] **Step 5: Type-check, lint, test, build**

Run: `npx tsc --noEmit && npx eslint . && npm test && npm run build`. Expected: pass (the scroll-progress tests are gone; timeline tests pass).

- [ ] **Step 6: Desktop screenshots through the stage**

Scroll so `#schedule .tl` top is at the viewport top, then take shots at 0%, 25%, 50%, 75%, 100% of `(wrapper height − viewport height)`. Expected: the curve spans the frame; one upright, slightly larger card sits at the dip with its full description under the curve; neighbours lean along the curve; the gold line grows; cards near the edges fade; nothing overlaps the 56 px bar badly (top-edge cards may pass under it at the sides).

- [ ] **Step 7: Phone screenshots** — same at 390 × 844. Expected: 62vw cards, one clearly centred, description readable above the hour line, no horizontal page overflow.

- [ ] **Step 8: Reduced motion and no-JS** — screenshots of `#schedule` with `reduce` and with JS disabled. Expected: a plain vertical stack of six cards with times, titles, summaries and full descriptions; no curve; page height back to normal for that section.

- [ ] **Step 9: Review Focus 1, 3, 4**

- *Live reduced-motion switch:* desktop page scrolled into the stage; run `await p.emulateMedia({ reducedMotion: "reduce" })`, wait 500 ms. Expected: `document.documentElement.classList.contains("motion") === false`; `.tl` lacks `is-staged`; every `.tl-card` has an empty `style` attribute; screenshot shows the plain list.
- *Anchor:* from the top, click the menu's "Schedule" item (open the sheet first). Expected: `#schedule` top lands at 56 ± 4 px; the section header is visible above the stage.
- *Resize:* inside the stage at 50%, `setViewportSize({ width: 1000, height: 700 })`, wait 800 ms, screenshot. Expected: curve redrawn to the new frame; the centred card still on the curve's lowest point.
- *Keyboard:* Tab from the schedule heading into the cards. Expected: focus ring on the first card; each Tab scrolls so the focused card moves to the dip.

- [ ] **Step 10: Checkpoint** — `git status --short`. Do not commit.

---

### Task 7: Marquee band and the closing scene

**Files:**
- Create: `components/site/marquee.tsx`, `components/motion/scenes/closing.ts`
- Modify: `components/site/closing.tsx`, `components/motion/scenes/index.ts`, `app/globals.css`

**Interfaces:**
- Consumes: `ticketLink`, `siteConfig`; `Scene`, `EASE`, `SCRUB`.
- Produces: `<Marquee />`; `data-scene="marquee"` and `data-scene="closing-scene"` hooks.

- [ ] **Step 1: The marquee component**

`components/site/marquee.tsx`:
```tsx
import { ticketLink } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

// A band of type leading into the closing; the closing scene moves it with the scroll (and back when scrolling up).
// The first copy is the real one; the repeats are hidden from assistive tech and the keyboard.
const COPIES = 4;
const date = siteConfig.dateText.replace(/, \d{4}$/, ""); // "Sunday, November 1"

export function Marquee() {
  const tickets = ticketLink(siteConfig.ticketUrl);
  return (
    <div className="marquee" data-scene="marquee">
      <div className="marquee-track">
        {Array.from({ length: COPIES }, (_, i) => (
          <p key={i} className="marquee-copy font-display" aria-hidden={i > 0 ? "true" : undefined}>
            <span>{date}</span>
            <span aria-hidden="true">·</span>
            <span>{siteConfig.name}</span>
            <span aria-hidden="true">·</span>
            <a {...tickets} tabIndex={i > 0 ? -1 : undefined}>Get tickets</a>
            <span aria-hidden="true">·</span>
          </p>
        ))}
      </div>
    </div>
  );
}
```

CSS (append to `app/globals.css`):
```css
/* Marquee into the closing (components/site/marquee.tsx): one line of large serif type between hairlines. */
.marquee { overflow: hidden; border-block: 1px solid color-mix(in srgb, var(--ink) 30%, transparent); padding-block: clamp(0.6rem, 1.4vw, 1.1rem); }
.marquee-track { display: flex; width: max-content; will-change: transform; }
.marquee-copy { display: flex; gap: 0.6em; padding-right: 0.6em; font-size: clamp(2rem, 6vw, 4.5rem); line-height: 1.05; color: var(--ink-deep); white-space: nowrap; }
.marquee-copy a { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 0.12em; }
.marquee-copy a:hover, .marquee-copy a:focus-visible { color: var(--ink); }
```

- [ ] **Step 2: Place it and mark the closing scene**

In `components/site/closing.tsx`: import `Marquee` and render `<Marquee />` as the first child of `<section id="tickets" …>`; add `data-scene="closing-scene"` to the `<div className="hero-vars relative z-0 mb-[…]" aria-hidden="true">` that holds `<GeiselScene />`.

- [ ] **Step 3: The closing scene**

`components/motion/scenes/closing.ts`:
```ts
import gsap from "gsap";
import type { Scene } from "@/components/motion/scenes";
import { EASE, SCRUB } from "@/components/motion/tokens";

// Into the footer: the marquee drifts one copy's width as it passes (reversing on the way up), then the engraved
// Geisel and its palms rise onto the footer band in layers — the building further than the planting beside it.
export const closing: Scene = ({ desktop }) => {
  const band = document.querySelector<HTMLElement>("[data-scene='marquee']");
  const track = band?.querySelector(".marquee-track");
  if (band && track) gsap.fromTo(track, { xPercent: 0 }, { xPercent: -25, ease: EASE.scrub, scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: SCRUB } });

  const scene = document.querySelector<HTMLElement>("[data-scene='closing-scene']");
  if (scene) {
    const rise = { trigger: scene, start: "top bottom", end: "bottom bottom", scrub: SCRUB };
    gsap.from(scene.querySelectorAll(".geisel-side"), { y: desktop ? 60 : 30, ease: EASE.scrub, scrollTrigger: rise });
    gsap.from(scene.querySelectorAll(".geisel"), { y: desktop ? 110 : 50, ease: EASE.scrub, scrollTrigger: rise });
  }
};
```
Register: `export const scenes: Scene[] = [hero, reveals, sections, timeline, closing];`.

- [ ] **Step 4: Type-check, lint, test, build** — `npx tsc --noEmit && npx eslint . && npm test && npm run build`. Expected: pass.

- [ ] **Step 5: Screenshots and checks**

- Desktop and phone: marquee at 80%, 50%, 20% of the viewport (it should be in visibly different positions); closing scene mid-rise and settled on the footer band (Geisel standing on the band exactly as before when settled).
- Scroll up 400 px: the marquee moves back the other way.
- Accessibility: `await p.evaluate(() => [...document.querySelectorAll('.marquee a')].map(a => a.tabIndex))` → `[0, -1, -1, -1]`; the copies 2–4 have `aria-hidden="true"`.
- With `ticketUrl` empty the marquee's link goes to `#tickets`; with a temporary `https://lu.ma/test` value it has `target="_blank"` and `rel="noopener noreferrer"`. Restore `""` afterwards.

- [ ] **Step 6: Checkpoint** — `git status --short`. Do not commit.

---

### Task 8: Ambient loops pause off screen, full verification, README

**Files:**
- Create: `components/motion/scenes/ambient.ts`
- Modify: `components/motion/scenes/index.ts`, `app/globals.css`, `README.md`

**Interfaces:**
- Consumes: `Scene`.
- Produces: `data-offscreen` attribute contract for ambient CSS loops.

- [ ] **Step 1: Pause ambient loops when their section is off screen**

`components/motion/scenes/ambient.ts`:
```ts
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Scene } from "@/components/motion/scenes";

// The hero's reel and clouds and the lanterns' sway are CSS loops; pause them while their section is off screen.
export const ambient: Scene = () => {
  const els = [document.getElementById("top"), document.querySelector<HTMLElement>("[data-scene='lanterns']")].filter((e): e is HTMLElement => !!e);
  els.forEach((el) => ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onToggle: (self) => { el.toggleAttribute("data-offscreen", !self.isActive); } }));
  return () => els.forEach((el) => el.removeAttribute("data-offscreen"));
};
```
CSS (append):
```css
[data-offscreen] .reel-track, [data-offscreen] .night-cloud, [data-offscreen] .lantern-swing, [data-offscreen] .lantern-light { animation-play-state: paused; }
```
Register last: `export const scenes: Scene[] = [hero, reveals, sections, timeline, closing, ambient];`.

- [ ] **Step 2: README**

Add under `## Design notes` (keep the README's tone; short):
```markdown
### Motion

All scroll motion runs through one system in `components/motion/`: `MotionRoot` (mounted in `app/page.tsx`) runs
Lenis smooth scrolling on desktop and the scenes in `components/motion/scenes/`. Sections opt in with attributes:
`data-anim="lines"` (heading lines rise once), `"rise"`, `"stagger"`, `"draw"` (engravings draw themselves), and
`data-scene="…"` for a section's own scene. Timings and eases live in `components/motion/tokens.ts`. With reduced
motion or without JavaScript nothing is hidden and nothing moves. The schedule's cards read `summary` from
`data/sessions.ts` (one line, at most 60 characters).
```
Also update the "Update the content" section's sessions line (if it lists session fields) to mention `summary`.

- [ ] **Step 3: Full checks**

Run: `npx tsc --noEmit && npx eslint . && npm test && npm run build`
Expected: pass. Record the test count.

- [ ] **Step 4: Trace and size, compared with the baseline**

```bash
node <scratchpad>/trace.mjs 1440x900; node <scratchpad>/trace.mjs 390x844
find out/_next/static/chunks -name '*.js' -exec gzip -c {} \; | wc -c && du -sh out
```
Expected: no errors, no overflow; page height ≈ baseline + 1.5 screens desktop (≤ ~8,200 px) and phone; `over25ms` not worse than baseline by more than a few frames; gzipped JS growth ≈ 50 KB (report the exact number). If `over25ms` is clearly worse on 390 px, report it rather than tuning blindly; the owner checks on a real phone.

- [ ] **Step 5: Final screenshot pass**

Desktop 1440 and phone 390, one shot per handoff (hero→theme, theme, venue, lanterns→timeline, timeline mid, speakers, gallery, sponsors, FAQ, marquee, closing→footer), plus reduced-motion top-to-bottom shots at both sizes. Look at each image; list anything that looks off.

- [ ] **Step 6: Final checkpoint and handoff**

Run `git status --short`. Report to the owner: files created/modified/deleted, baseline vs final numbers (height, frames over 25 ms, worst frame, gzipped JS, `out` size), what was verified and what was not (real-phone GPU, real VoiceOver). Remind them to review `git status` before committing. Do not commit.
