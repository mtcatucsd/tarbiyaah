# Tarbiyyah Conference — Next.js site + campus map: design spec

Supersedes `2026-09-29-site-redesign-design.md` (plain HTML/CSS/JS). The user chose a major stack revamp to match how torontotechweek.com (site) and torontotechweek.github.io (map) are built, while keeping our Islamic parchment/teal/gold theme.

## Goal
1. A conference site that copies the *animations and UI components* of torontotechweek.com, restyled in our theme.
2. A guest map (`/map`) modelled on torontotechweek.github.io that shows where each session is at UC San Diego, down to building, floor and room, with directions.
3. Ticket sales remain a redirect to a Typeform link. All copy is placeholder until the organisers supply real content.

## What the references do (findings)
**torontotechweek.com** — Next.js (Turbopack) + Tailwind + shadcn/ui tokens, light/dark toggle. No GSAP/Lenis/Three: all motion is CSS keyframes + SVG stroke drawing. Fonts: volksans (sans) + Decima Mono (labels). Palette: `#f3f3f3` paper, `#3c4b59` slate ink, hairline `#c2c6ca` borders, small colour accents.
Components/motion to copy (renamed for our theme):
| Reference pattern | Our version |
|---|---|
| Floating notched nav tab that hides on scroll down | same, `useHideOnScroll` |
| Two vertical page-frame rules | same |
| Line-art city skyline that draws itself, streetcar on dashed road | Islamic skyline (domes, minarets, arches, gate, palms) + lantern string with `lineWave`-style sequential glow |
| Instrument-panel HUD: countdown D/H/M/S, spinning dial, sponsor strip | HUD: countdown, counter-rotating star medallion (their `dial-clockwise/counterclockwise`), date/venue, Get Tickets |
| Stat "plates" with screws, numbers count up | same, screw dots, count-up |
| Vertical double "transit line" with stop circles, cards alternating sides, `draw-border` strokes | schedule spine (gold double line), stop circles, stroke-draw on scroll |
| Card = heading strip + mono body, thin border | same |
| Accordion, `cubic-bezier(.16,1,.3,1)` | shadcn Accordion with that easing |
| `flickerOpacity` neon flicker on | countdown digits flicker on |
| Newsletter modal, ASCII art, impact report | out of scope |

**torontotechweek.github.io (map)** — MapLibre GL 5 with a custom dark style, GeoJSON of events, clustered circle layers with halo, pitch 20, `maxBounds`, left sidebar with date tabs (All / day / day, with arrows) and an event list with "View event" buttons, sponsor logos in corners, dark-mode CSS.
We copy: MapLibre + GeoJSON pins with halo, sidebar day tabs + session list, click-to-focus, tilted 3D view, theme-aware style.

## Stack
- **Next.js (App Router), TypeScript strict, `output: 'export'`** → static files; deploy anywhere (GitHub Pages, Netlify, Vercel).
- **Tailwind CSS v4** + **shadcn/ui** (Radix): Button, Card, Tabs, Accordion, Dialog, Sheet, ScrollArea, Badge, Tooltip.
- **next-themes** (class strategy) for light/dark; **lucide-react** icons.
- **maplibre-gl** (raw, no wrapper) with **OpenFreeMap** vector tiles (no API key; verified: TileJSON `https://tiles.openfreemap.org/planet`, glyphs `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`, style `https://tiles.openfreemap.org/styles/positron`, source id `openmaptiles`, font `Noto Sans Regular`, building layer has `render_height`).
- Fonts via `next/font/google`: Geist, Geist Mono, Pinyon Script (hero wordmark).
- No animation library. Reveal, count-up and hide-on-scroll are three small hooks; everything else is CSS.
- **Vitest** for pure `lib/` logic. Everything else verified in the browser.
- Package manager: npm. Node ≥ 20.

Readability rule (from the user): as simple as possible. One component per file, one job per hook, no state library, no CMS, no data fetching except the map style/tiles.

## Repository layout
```
app/
  layout.tsx            fonts, ThemeProvider, <noscript> overrides, frame
  page.tsx              home: composes sections
  map/page.tsx          map route (Suspense around client experience)
  globals.css           tokens, keyframes, frame, lattice
components/
  ui/                   shadcn generated (do not hand-edit beyond token tweaks)
  site/                 nav, footer, hero/*, hud/*, stats, about, schedule, speakers, tickets, faq
  map/                  map-experience, map-view, venue-card, session-list, day-tabs
hooks/                  use-in-view, use-count-up, use-hide-on-scroll
lib/                    format.ts, map-data.ts, map-style.ts, site-config.ts, utils.ts (shadcn cn)
data/                   venues.ts, sessions.ts
tests/                  format.test.ts, map-data.test.ts, map-style.test.ts
legacy/                 previous static prototype (deleted at end of Task 13)
docs/superpowers/       specs and plans
```

## Visual system
Tokens are shadcn variables remapped to our palette.
- Light (default): background `#f4efe3`, foreground/ink `#12403b`, card `#f4efe3`, secondary/muted/accent `#ece5d4`, muted-foreground `#4a6b66`, border/input `#c9c2b0`, ring/gold `#a87a26`, gold-text `#7d5a1a`, terracotta `#b5573a`, blue `#3a6a99`, green `#3f7a5a`.
- Dark: background `#0b2f2c`, foreground `#f3ede0`, card/secondary `#0f3a36`, muted-foreground `#b9c6bd`, border `rgba(227,195,128,.3)`, ring/gold `#e3c380`, terracotta `#e08a6a`, blue `#8fb3dc`, green `#7fc29b`.
- Sans = Geist; mono = Geist Mono (uppercase, tracked labels, buttons, nav); script = Pinyon Script (hero wordmark only).
- Page frame: two 1px vertical rules at the edges of `--frame: min(1280px, 92vw)`.
- Motif: 8-point star lattice (`public/star.svg` used as a CSS mask), pointed arch frame, Islamic line-art skyline.

## Home page sections (order)
Nav → Hero (lattice, arch frame, wordmark, skyline, lanterns) → HUD strip (countdown, medallion, date/venue, tickets) → Stats plates → About card → Schedule (day Tabs + spine; each session has "Show on map") → Speakers (cards + Dialog) → Tickets tiers → FAQ (Accordion) → Footer.

## Map route `/map`
**Layout:** desktop = 340px sidebar + full-height map; mobile = full-screen map with a "Sessions" button that opens a bottom `Sheet`.
**Sidebar:** logo/back link, theme toggle, `DayTabs` (All · Day 1 · Day 2), scrollable `SessionList` (title, time, room · building, "View on map"). Selecting a session focuses its venue.
**Map:** centre `[-117.2340, 32.8801]`, zoom 15.2, pitch 30, bearing -10, minZoom 13.5, maxZoom 19, `maxBounds` `[[-117.27, 32.85],[-117.20, 32.91]]`. Base = OpenFreeMap positron recoloured to our palette per theme; 3D building extrusion from zoom 15; one pin per *venue* with halo, a session-count label, a gold selected ring that pulses (static under reduced motion); cursor pointer on hover.
**Venue card** (overlay, bottom-left on desktop, above the Sheet on mobile): venue name, sessions there (time, room, floor), "How to find it" text, accessible-entrance note, parking/shuttle note, buttons: Directions (Google Maps + Apple Maps by lat/lng), Open UCSD Campus Map (`https://campusmap.ucsd.edu/`).
**Deep links:** `/map?venue=<id>` and `/map?session=<id>`; schedule cards link to them; selection and day are mirrored in the URL.
**Theme:** map restyles on theme toggle (`setStyle` then re-add layers).

## Data model (`data/`)
```ts
type Venue = {
  id: string; name: string; shortName: string;
  coordinates: [lng: number, lat: number];
  address?: string;
  rooms: { id: string; name: string; floor: number; howToFind?: string }[];
  entrance?: { coordinates: [number, number]; note: string; accessible: boolean };
  parkingNote?: string;
  verified: boolean;          // true only after checking campusmap.ucsd.edu
  sources: string[];          // URLs used to verify
};
type Session = {
  id: string; title: string; description: string;
  day: 1 | 2; start: string; end: string;   // ISO 8601 with offset, America/Los_Angeles
  venueId: string; roomId: string;
};
```
Seed venues use coordinates from public sources and are all `verified: false` until Task 12: Price Center (32.8800, -117.2369; Theater floor 1; East and West Ballrooms floor 2), Geisel Library (32.88116, -117.237651), RIMAC Arena (32.885278, -117.239223). Sessions are placeholders.

## Exact room locations (how we get them right)
Rooms are not in OpenStreetMap, so accuracy comes from: building pin + entrance pin + floor + `howToFind` walking text, each checked against the official **UC San Diego Campus Map** (`campusmap.ucsd.edu`, an ArcGIS Experience with building/room search) and recorded in `sources`. `verified` flips to true only after that check. Indoor floor plans are a possible later phase; the data model already carries `floor` and `rooms`.

## Error handling
- Map tiles/style fail → the map area shows a message and the list still works.
- WebGL unsupported → same fallback message with a link to the UCSD campus map.
- Unknown `venue`/`session` in the URL → ignored, map opens at the default view.
- No JS → home page fully readable (noscript overrides show revealed content and drawn strokes); `/map` shows the session list as static text with the campus-map link.
- Countdown date invalid/past → zeros. Ticket URL empty/invalid → buttons link to `#tickets`.
- `prefers-reduced-motion` → no flicker/drift/pulse, numbers and strokes appear immediately.

## Testing
- Vitest: `format.ts` (splitTime, ticketHref, countValue), `map-data.ts` (day filter, group by venue, GeoJSON, directions URLs, time formatting in Los Angeles time), `map-style.ts` (recolours by layer type, does not mutate input).
- `npm run build` must pass with zero type errors (static export).
- Manual: 1440px and 390px, light and dark, keyboard navigation, reduced motion, console clean, map pin selection and deep links, theme switch restyles map.

## Out of scope
CMS, backend, auth, ticketing beyond the redirect, indoor floor plans, newsletter modal, ASCII art, analytics, search on the map.
