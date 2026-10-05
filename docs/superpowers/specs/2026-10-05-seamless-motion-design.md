# Seamless motion: one scroll system for the Tarbiyyah Conference site

Date: 2026-10-05 · Status: approved in brainstorming, awaiting spec review

## Goal

The page's animations feel separate from each other. Rebuild all scroll motion as one connected system, modelled on
how times-event.de ties its sections together, **without changing the site's look**. Replace the schedule's spine
timeline with a scroll-driven "cards on a path" component.

Success means:
- One clock and one easing language drive all scroll motion; sections hand off to each other with no dead stops.
- The look (palette, fonts, engravings, Geisel scenes, copy, section order) is unchanged.
- Tickets stay quick to reach: the page grows by about 1.5 screens at most (desktop ~6,700 px → ~8,000 px).
- Phones scroll at least as smoothly as today; reduced-motion and no-JS visitors get a fully readable static page.

## Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Visual direction | Keep our look; rebuild motion only. No new photo sections. |
| Extra scroll length | One sticky stage only: the timeline (~1.5 screens). |
| Timeline | Option B, "cards on a path". |
| Smooth scrolling (Lenis) | Desktop with a fine pointer only. Phones/tablets keep native scroll. Off with reduced motion. |
| Engine | GSAP + ScrollTrigger + Lenis, one orchestrator (not CSS scroll-driven animations, not Motion). |
| Marquee band before the footer | Yes (the one new visual element). |
| Day tabs in the schedule | Removed; it is a one-day event. |

## Reference analysis: times-event.de

Measured on 2026-10-05 (GSAP 3.12, ScrollTrigger, MotionPathPlugin, CustomEase, Observer, Lenis 1.0, Swiper, Barba):

1. **One clock.** `new Lenis({ duration: 1.25 })`, `lenis.on("scroll", ScrollTrigger.update)`,
   `gsap.ticker.add(t => lenis.raf(t * 1000))`, `gsap.ticker.lagSmoothing(0)`.
2. **Scrubbed, not triggered.** 35 ScrollTriggers, most with `scrub` (true / 0.5 / 1 / 2); text reveals are the
   exception (play once at `top 90%`).
3. **No `pin`.** Sticky stages are tall wrappers (`sec-4-scroll-wrap` 3,150 px, `sec-5` 4,050 px) with a sticky inner
   frame; timelines are mapped to fractions of the wrapper (`top+=33.33% center` … ).
4. **Handoffs.** Sections overlap: the next one slides over the previous; a marquee leads into the footer.
5. **One ease.** `CustomEase.create("custom-ease", ".9, .1, .1, .9")`.
6. **Cards on a curve.** Six service cards placed on `#motionPath` with `autoRotate`, offset by 1/6 each, moved by one
   scrubbed timeline.

## What we have today (why it feels disconnected)

Six independent motion systems with their own clocks and timings: `ScrollFocus` (scroll listener: blur + fade),
`Reveal` / `hooks/use-in-view.ts` (IntersectionObserver → CSS transitions, play once), `hooks/use-scroll-progress.ts`
(a listener per schedule stop), `HeroMotion` (scroll + pointer → CSS variables), the gallery's own scroll listener,
and CSS keyframe loops (lanterns, hero reel, clouds). Triggered and scrubbed motion are mixed with different easings,
and sections are stacked blocks with no handoffs.

## Design

### 1. Motion foundation — `components/motion/`

- **Dependencies:** `gsap` (ScrollTrigger, MotionPathPlugin, SplitText — all free since GSAP 3.13), `@gsap/react`,
  `lenis`. Nothing else.
- **`motion-root.tsx`** (client, mounted once in `app/page.tsx`):
  - registers the plugins;
  - `gsap.matchMedia()` with three conditions used by every scene:
    `desktop` = `(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)`,
    `touch` = `(pointer: coarse) and (prefers-reduced-motion: no-preference)`,
    `reduce` = `(prefers-reduced-motion: reduce)`;
  - in `desktop` only: creates Lenis and wires it to `gsap.ticker` and `ScrollTrigger.update` as above;
  - in-page anchor links (nav, menu, tickets while `ticketUrl` is empty, back to top) scroll through Lenis on desktop,
    offset by the fixed bar's height; native elsewhere. `ticketLink()` behaviour is unchanged.
- **`tokens.ts`:** the shared motion language — `ease.main` (custom S-curve near `.9,.1,.1,.9`), `ease.settle`
  (soft ease-out for text), `ease.scrub` (`none`), durations, stagger, standard `scrub: 0.6`, and the text-reveal
  start (`top 85%`).
- **`use-scene.ts`:** wraps `useGSAP` — takes a root ref and a builder `(root, conditions) => void`; scopes selectors,
  reverts on unmount, refreshes on resize/font load.

Replaced and deleted: `components/site/qe/scroll-focus.tsx`, `components/site/reveal.tsx`, `hooks/use-in-view.ts`,
`hooks/use-scroll-progress.ts`, the gallery's scroll listener (its parallax moves onto the shared ticker), the scroll
half of `HeroMotion` (pointer effects stay), and the CSS rules that only served them (`[data-reveal]`,
`[data-in-view]` states, `.draw`/`.etch.draw` transitions, `.hatch-in`, spine styles). `data-focus` attributes are
removed. Ambient CSS loops (lantern sway, reel, clouds) stay, paused when off screen.

**Rules for every scene**
- Animate only `transform`, `opacity` and `clip-path` (plus `stroke-dashoffset` for line drawing). No `filter: blur`.
- Initial (hidden) states are set by JS inside matchMedia contexts only, so no-JS and reduced-motion pages show
  everything as today.
- No `pin: true`. Sticky stages are a tall wrapper + `position: sticky` frame.
- Text plays once when it reaches `top 85%` (masked line rise via SplitText, headings only); decoration and depth are
  scrubbed. Each section's entry starts while the previous one is still leaving.

### 2. Choreography

| Section | Motion |
|---|---|
| Hero → Theme | The cream theme block rises over the hero as a curtain with an arched top edge. Hero reel and title drift up and dim; Geisel and palms sink slower (depth). The nav's transparent→cream switch uses the same trigger. |
| Theme (`#about`) | Masked line reveals: title → date line → countdown digits tick in; the palm draws (scrubbed); paragraph lines fade in. |
| Venue (`#find-us`) | Statement lines reveal; postcard and map slide in from opposite sides (scrubbed) and settle. |
| Lantern band | Cord draws across (scrubbed), lanterns lower into place, then hand straight into the timeline stage. |
| Schedule | Sticky "cards on a path" stage (section 3). |
| Speakers | Cards rise at slightly different speeds (layered). |
| Gallery | Carousel glides in from the right as the section enters, then hands control to the visitor (behaviour unchanged). |
| Sponsors, FAQ | Tiles reveal staggered; FAQ row borders draw left to right. |
| Closing | New marquee band in ink: "Sunday, Nov 1 · Tarbiyyah Conference · Get tickets ·" (the "Get tickets" item uses `ticketLink()`), drifting with scroll and reversing on scroll up (one real, focusable link; the repeated copies are `aria-hidden` and not focusable); then the engraved Geisel and palms rise onto the footer band in layers. |

Phones: same choreography with shorter distances and no slow parallax on large layers.

### 3. Timeline: cards on a path — `components/site/schedule.tsx`

- Header (label, "The day at a glance", date line) reveals like other headings.
- Sticky stage: wrapper ~250 vh desktop / ~200 svh phone; frame 100 vh / 100 svh.
- An engraved dashed SVG curve (our etch style) dips across the frame. Every session is a card placed on it with
  MotionPathPlugin `autoRotate`, tilt clamped to ±18°. One scrubbed timeline moves the train right → left; spacing is
  1/n of the path for n sessions. The card at the lowest point is the current session: upright, scale ~1.08.
- Card content: time (mono), title (serif), `summary` (≤ 60 characters).
- Under the curve, the current session's full description cross-fades as each card arrives (no tap needed).
- A thin gold progress line along the bottom marks 12 PM → 8 PM.
- Markup is an ordered list of all sessions with full descriptions (screen readers, keyboard). Focusing a card
  scrolls to the position where it is centred.
- No-JS / reduced motion: the same list renders as a plain vertical stack of cards; the tall wrapper only exists when
  the stage is active (class set by JS).
- `data/sessions.ts` gains a `summary` field (and `data/types.ts` the type). Day tabs and the two-day code paths in
  the schedule are removed; `lib/event-data.ts` helpers stay if still used elsewhere.

Pure helpers (in `lib/`, unit-tested): path offset for card i of n at progress p; progress → current session index.

### 4. Performance, testing, verification

- **Budget:** about +50 KB gzipped of JS (measured in the plan); deploy stays ≈ 2.6–2.8 MB; no new images.
- **Phones:** no continuously repainting effects, no blur, hero's lighter phone layers unchanged.
- **Tests (Vitest, test-first):** path-offset and current-session helpers; every `summary` ≤ 60 chars; tokens sanity.
- **Each step:** screenshots at 1440 and 390 px mid-handoff; no horizontal overflow; no console errors; keyboard
  focus and tab-to-card; reduced-motion and no-JS pages readable; `npx tsc --noEmit`, `npx eslint .`, `npm test`,
  `npm run build`.
- **Scroll trace:** headless Chrome trace at 390 and 1440 px before and after (dropped frames, long tasks). Headless
  cannot reproduce a phone GPU; the final check is on a real phone.

## Out of scope

- Visual redesign, copy changes, section order. The co-heads' theme paragraph and the FAQ/closing Luma copy are
  separate tasks.
- The hero's top half (reel + drawn title) keeps its look; only its scroll exit is rebuilt.
- The "Gilded shimmer" ticket button (queued separately; independent of this work).

## Notes for implementation

- Builds on the current uncommitted work (theme block, menu order, parallax carousel).
- Read the relevant Next.js 16 guide in `node_modules/next/dist/docs/` before touching framework behaviour
  (client components, `app/page.tsx`).
- Do not commit, stage or push; the owner runs git.
