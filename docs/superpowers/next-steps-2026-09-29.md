# Next steps — round 2 handoff

For the next session (Opus). **Start each item with `/superpowers:brainstorming`** (each is a bounded change: present a short design in chat, get a yes, then build). Suggested order is at the bottom.

## Where things stand

- Branch `tarbiyaah-site`, folder `/Users/zahir/tarbiyaah`. The git root is `/Users/zahir` (home), so **always `git add <paths>` and `git commit -- <paths>`** — other projects there have unrelated staged/uncommitted files.
- Last commit: `8c5168ad` (real event content). Working tree clean. `npm test` → 23 passing. `npm run build` → OK (static export).
- Run: `npm run dev` → http://localhost:3000 (home) and `/map`.
- Stack: Next 16.3.7, React 19, Tailwind v4, shadcn (radix-nova), maplibre-gl 6.11.2, Vitest 4, Node 20.18. Next 16 ships its own docs in `node_modules/next/dist/docs/` — read them before changing framework behaviour.
- Built and committed: hero (arch, lattice, wordmark, skyline, lanterns), countdown + medallion HUD, "what to expect" plates, About + Theme cards, single-day schedule spine, speakers (+ bio dialog), sponsors and gallery placeholders, "Find the MPR" card, Typeform ticket card, FAQ, footer, and `/map` (MapLibre + OpenFreeMap, 3D buildings, session list, venue card, deep links).
- Event facts (in `lib/site-config.ts`, `data/`): Sunday Nov 1 2026, 12 PM–8 PM, Multipurpose Room (MPR) in the Student Services Center at UC San Diego. Theme: Ibad al-Rahman — Servants of the Most Merciful. Tickets via Typeform.

## Done in round 2 (commit after 840a8dde)
- Items 2, 3, 4, 6: hero no longer states the theme; light/dark switcher and next-themes removed; one light palette (cream #f4efe3, ink #1f4f5c, primary MSA blue-green #307060, accent blue #2f5f8f, gold #a87a26 as ornament only); TTW-style navbar (links left, script wordmark centred, Map + divider + Get tickets right, phone menu sheet).
- User change: the `/map` MapLibre page was REMOVED and replaced by an inline Google Maps embed (no API key) in "Find the MPR"; maplibre-gl, map style/palette code and the worker copy script are gone. `lib/map-data.ts` → `lib/event-data.ts` (+ tested `mapEmbedUrl`, place-name query so Google pins the Student Services Center, 9460 Russell Ln). Ignore the map-related notes below.

## Requested changes (this round)

### 1. Timeline / scroll animation — redo, re-referencing torontotechweek.com
**Problem now:** the schedule spine (`components/site/schedule.tsx`, `.spine` in `app/globals.css`) does not connect. The cards float 2rem away from the line, the stop dots sit at a fixed `top-6` and don't line up with the cards, and the line grows once (a `scaleY` reveal) instead of following the scroll.

**What torontotechweek.com does (re-inspect it live with Playwright/DOM before designing):**
- A continuous **double vertical line** runs down the centre of the page between blocks. It is **scroll-linked**: gold up to the point reached, muted grey below.
- **Round stop nodes sit on the line**, vertically aligned with each card; cards butt up to the line, alternating left and right. A **V-shaped branch line with small terminal circles** joins a featured card to the spine.
- A **medallion at the top** of the timeline (a circle with an icon) starts it; the line meets the cards' edges.
- Card borders **draw themselves** (their `animate-draw-border`: SVG stroke-dashoffset with `--path-length`); they also use `flickerOpacity`/`lineWave`.

**Target:** the line visibly connects first node → last node on desktop and phone; nodes align to card headers and fill gold once reached; a short connector runs from each node to its card; start medallion and end cap; card borders draw in; progress follows scroll (new `hooks/use-scroll-progress.ts`); reduced-motion = fully drawn; no-JS = fully visible (see the noscript block in `app/layout.tsx`); must still work if a second day/tabs returns. Consider extending the spine between page sections as TTW does (About → Sponsors → …) — decide in brainstorming.

### 2. Hero copy
Remove the "Theme: …" line from the hero. **Keep "Transforming knowledge into action."** Keep the date/time/MPR line and "Get tickets". The theme stays in the About/Theme card. File: `components/site/hero/hero.tsx` (`siteConfig.theme` is still used by `tests/site-config.test.ts` — keep it).

### 3. Remove the light/dark switcher
Remove `ThemeToggle` from the nav and from the `/map` sidebar; delete the component if unused. Remove `next-themes`/`ThemeProvider` (or force one theme), delete the unused theme tokens, collapse the map palettes to one (`lib/map-style.ts`, `tests/map-style.test.ts`), and drop the `themeReady`/restyle logic in `components/map/map-view.tsx`. **Decision needed (brainstorm): which single theme?** Earlier answer was light parchment as the default; the dark teal look was the "toggle". Combine with item 6.

### 4. Navbar like torontotechweek.com
TTW's nav: a floating tab centred at the top (width `min(1280px, 92vw)`, curved/slanted bottom corners), hides on scroll down. Left: text links (About · Partners · FAQ), sans-serif, normal weight. **Centre: the wordmark.** Right: a text link, a thin divider, then the toggle. Ours today: brand left, mono links centre, toggle + button right. **Target:** links left (About, Schedule, Speakers), wordmark centred (script "Tarbiyyah" or sans — decide), right side = Map link + divider + Get tickets (no toggle). Match the tab's curve (compare with a screenshot; ours is a `clip-path` polygon with 26px slants, `.nav-notch`). Phone: collapse to wordmark + Get tickets + a menu (Sheet). Files: `components/site/nav.tsx`, `.nav-notch` in `globals.css`.

### 5. Geisel Library and plant SVGs — redo
Current version (`components/site/hero/skyline.tsx`, commit `39fda308`) is a rough draft and looks wrong; the trees look like lollipops.
- **Reference:** the user's architectural elevation drawing (please save it in the repo, e.g. `docs/reference/geisel-elevation.jpg`). Geometry from it (≈2000×1030 px drawing): a small top box; three glass tiers stepping wider downward, each with a thin overhanging slab; a wide flared concrete "platter" slab with two tapering outer supports having triangular cut-outs, coming down into two piers; two narrower glass tiers hanging below the slab; four slim tapered columns in the middle; a central core block; a podium with a sunken dark rounded window; planter walls at the sides; the ground line dips under the podium. Symmetric.
- **Trees — decision made:** use **public-domain (CC0) Openclipart SVGs**. Candidates found: 213774 "tree - lineart" (frankes; downloaded OK, 38 KB), 226781 Leafless tree, 282737 Sparse tree, 7413 bare tree, 3290 Simple flowering tree outline, 16953 arbre-modern-bw, 301070 Palm tree 7 (outline). URL pattern `https://openclipart.org/download/<id>`; the second download stalled and the user stopped the retry — **ask before re-downloading**, or use another source (FreeSVG, SVG Repo). Most of these are filled shapes: convert to outline/stroke so the `.draw` animation works, or use them as static faded silhouettes. Record ids/authors/licence in a credits file. Also add lamp posts/planters like the drawing.
- **Acceptance:** reads as Geisel at 390 px and 1440 px, symmetric, sits under the arch without touching the CTA, trees/plants match the line style.

### 6. Palette: MSA Instagram blue / blue-green (not started)
The brief says the site should use the MSA Instagram colours (blue, blue-green). The logo's dominant colour is `#307060`. Get an Instagram screenshot to confirm, then decide the roles (is gold kept only as ornament on the arch/lattice/medallion?). Files: token blocks in `app/globals.css`, map palette in `lib/map-style.ts`.

## Still to do from the original plan

- **Task 12 — exact MPR location:** floor and entrance are unverified (the campus map's ArcGIS UI wouldn't reveal room data; UCSD's room page says floor "not specified"). Get them from the organisers' booking, then set `verified: true` in `data/venues.ts` and fill `entrance`, `howToFind`, `parkingNote`. Building location is from OpenStreetMap way 31842124.
- **Task 13:** `README.md`, delete `legacy/`, full verification (1440 and 390 px, keyboard, reduced motion, no-JS, console clean).
- Final whole-branch review → fix pass → `superpowers:finishing-a-development-branch` (merge/rename branch; mind the home-dir repo).
- Replace placeholders: the Typeform URL (`lib/site-config.ts`), the real programme (`data/sessions.ts`), speakers, sponsors, and the photos from previous years (the user will send a Drive; put them in `public/gallery/`).
- Confirm: the **contact phone number is published in the footer** (an earlier ledger note said not to, then it went in per the brief); the Instagram/website URLs came from a web search; the brief says "Saturday" but Nov 1 2026 is a **Sunday** (Sunday is used); ticket price/service fee unknown.

## Cleanup owed on the user's machine
- `brew uninstall libredwg` (installed to read the CAD file; then abandoned).
- Scratch in `~/.superpowers/sdd/2026-09-29-nextjs-site-and-map/`: DWG copy, 24 MB DXF, tree downloads, an npm cache. That folder also holds the run's ledger (`progress.md`); delete it when done — the key decisions are summarised below.

## Decisions taken so far (short list)
- Plain static prototype replaced by Next.js + Tailwind + shadcn (Radix) after the user allowed a stack change.
- shadcn re-initialised on Radix (default was Base UI); `cn` comes from shadcn's `cn` package.
- `next.config.ts`: static export, unoptimized images; deploy at a domain root (assets like `/star.svg`).
- MapLibre 6: named imports (no default export); its worker is served from `public/maplibre` via `npm run copy-maplibre-worker` (runs in `predev`/`prebuild`; folder gitignored) because Turbopack can't bundle it; the map container is wrapped because MapLibre's CSS overrides Tailwind positioning; on phones the camera is offset so the pin clears the venue card.
- Single-day event → no day tabs (`hasMultipleDays`); floors optional in data (`Room.floor?`).
- Unrelated pre-staged files in the home repo left alone.

## How to verify (tips)
- Playwright MCP screenshots: the first capture right after load is often blank/half-animated in this headless browser (software GL) — wait and capture again. The Chrome-extension tool cannot capture WebGL maps at all. The browser window can't shrink below the display; test 390 px with Playwright's `browser_resize`.
- No-JS check: sandboxed iframe (`sandbox="allow-same-origin"`) so `<noscript>` styles apply.

## Suggested order
1. Items 3 + 4 + 6 together (they share the nav, tokens and map palette): theme decision, remove the toggle, TTW-style navbar, blue/blue-green palette.
2. Item 2 (hero copy) — tiny.
3. Item 1 (timeline) — biggest.
4. Item 5 (Geisel + trees).
5. Tasks 12–13, final review, finish the branch.
