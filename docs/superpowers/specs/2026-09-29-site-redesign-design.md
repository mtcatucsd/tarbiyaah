> **SUPERSEDED** by the Next.js + map spec/plan (`2026-09-29-nextjs-site-and-map`). Kept for history only; do not implement.

# Tarbiyyah Conference site redesign — design spec

## Goal
Redesign the whole conference site so it feels like torontotechweek.com (blueprint line-art, mono labels, floating nav, HUD countdown, timeline spine, animated details) translated to an Islamic/Arabic visual language. Ticket sales stay a redirect to a Typeform link. All content is placeholder for now.

## Constraints (from the user)
- Light parchment theme by default, dark teal/gold theme via a toggle (today's dark hero becomes dark mode).
- Keep the stack as simple and readable as possible. A framework is allowed only if needed; it is not.
- Do not copy the reference site's artwork or fonts. Draw original Islamic equivalents; use free fonts.

## Decision: plain HTML/CSS/JS, no build step
No npm, framework, or bundler. Served by any static server (ES modules need http, not file://). Native elements replace library components: `<details>` for the FAQ, `<dialog>` for the modal.

## File structure
```
index.html          semantic sections only; no inline CSS or JS
css/tokens.css      colours (light + dark), fonts, spacing, radii
css/base.css        reset, typography, page frame rules
css/components.css  nav, button, card, stat plate, tabs, accordion, modal, countdown
css/sections.css    hero, about, schedule, speakers, tickets, faq, footer
js/config.js        event date, Typeform URL, placeholder stats (the one file to edit)
js/theme.js         light/dark toggle, remembered in localStorage, respects prefers-color-scheme
js/nav.js           floating nav hides on scroll down, returns on scroll up
js/countdown.js     live D/H/M/S countdown to config date
js/reveal.js        scroll fade-in, stat count-up, SVG line-drawing (IntersectionObserver)
js/tabs.js          schedule day tabs
js/main.js          imports and starts modules
assets/             logo, SVG artwork
```
Each file has one job. No module depends on another except `main.js` and `config.js`.

## Visual system
- Light: paper `#f4efe3`, deep-teal ink, hairline borders, darker gold accent, terracotta and blue skyline accents.
- Dark: current teal `#0b2f2c` / gold `#e3c380` / cream.
- Colours are CSS variables in `tokens.css`; dark values live under `[data-theme="dark"]` (and `prefers-color-scheme` when the user has not chosen).
- Type: Geist (text) and Geist Mono (uppercase labels, buttons, nav) from Google Fonts. The hero script wordmark stays, loaded as a web font (Pinyon Script) so it renders the same everywhere.
- Page frame: thin vertical rules down both sides.

## Sections (in order)
1. **Nav** — floating notched tab: links, theme toggle, Tickets button.
2. **Hero** — existing star lattice and arch frame, plus an original line-art skyline (domes, minarets, arches) that draws itself, and a lantern string.
3. **HUD strip** — countdown, date and venue, Get Tickets button.
4. **Stat plates** — plates with 8-point-star "screws"; numbers count up (placeholders).
5. **About** — card with heading strip and mono body.
6. **Schedule** — day tabs above a vertical gold spine with stop circles; session cards alternate left/right.
7. **Speakers** — card grid with arch-shaped portrait placeholders.
8. **Tickets** — placeholder tier cards; button redirects to the Typeform URL in `config.js`.
9. **FAQ** — animated `<details>` accordion.
10. **Footer** — minimal, mono.

## Motion
Scroll fade-ins, SVG line-drawing, flicker-on countdown, stat count-up, eased accordion. All disabled under `prefers-reduced-motion`.

## Data flow
`config.js` exports constants (event date, ticket URL, stats). `countdown.js` and the ticket buttons read from it; content text lives in `index.html`. No network calls other than fonts and the external Typeform link.

## Error handling
- localStorage access wrapped in try/catch; theme falls back to system preference.
- Countdown shows zeros once the date has passed.
- Without JS the page still reads correctly: sections are visible, FAQ and modal work natively; only motion and countdown are absent.

## Testing (manual)
Check at 1440px and 390px in both themes; keyboard navigation and visible focus; reduced-motion on; browser console clean; ticket button opens the configured URL; theme choice persists across reloads.

## Out of scope
CMS, build tooling, backend, real content, analytics.
