> **SUPERSEDED** by the Next.js + map spec/plan (`2026-09-29-nextjs-site-and-map`). Kept for history only; do not implement.

# Tarbiyyah Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the conference site as a light-parchment (dark-teal toggle) blueprint-style page with an Islamic line-art skyline, HUD countdown, stat plates, schedule spine, speaker cards, tickets and FAQ.

**Architecture:** Plain HTML + four small CSS files + small single-purpose ES modules. No build step, no npm dependencies. Native `<details>`, `<dialog>` and `[hidden]` replace component libraries. Pure logic lives in `js/utils.js` and is tested with Node's built-in test runner.

**Tech Stack:** HTML, CSS (custom properties, `color-mix`, `mask`), ES modules, Google Fonts (Geist, Geist Mono, Pinyon Script), Node `node --test` (dev only).

**Spec:** `docs/superpowers/specs/2026-09-29-site-redesign-design.md`

## Global Constraints

- Light theme is the default palette; dark teal/gold via `[data-theme="dark"]`; system preference honoured when the visitor has not chosen.
- No framework, bundler or npm dependencies. Serve with any static server (`python3 -m http.server 8765`); ES modules need http, not file://.
- `index.html` contains no inline CSS or JS; all styling in `css/`, all behaviour in `js/`.
- Each JS module has one job; only `main.js` imports other modules (plus `countdown.js`, `reveal.js` importing `utils.js`).
- Editable event values (date, date text, venue, ticket URL) live only in `js/config.js`.
- Ticket sales are a redirect to the Typeform URL in `config.js`; all page copy is placeholder.
- All motion is disabled under `prefers-reduced-motion`.
- Do not copy the reference site's artwork or fonts; skyline and lanterns are original SVG.
- Fonts: Geist (text), Geist Mono (labels/buttons/nav), Pinyon Script (hero wordmark).
- Commit with the trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. The git root is above this folder and has unrelated uncommitted changes: always `git add` explicit paths and `git commit -- <paths>`.

## Review Focus

1. Event date already passed or malformed → countdown shows zeros, never `NaN` (unit test in Task 1).
2. Ticket URL empty or not http(s) → ticket buttons link to `#tickets`, not a dead link (unit test in Task 1).
3. `localStorage` blocked (private mode) → theme toggle still works for the session with no console error (manual check in Task 2).
4. JavaScript disabled or failing → all content still visible; hiding rules are scoped under `.js` (manual check in Task 3 and Task 8).
5. `prefers-reduced-motion` → stat numbers show final values immediately, skyline fully drawn, lattice not drifting (manual check in Task 4).

## File Structure

```
index.html            semantic sections; @markers replaced task by task
package.json          {"type":"module"} so Node can run the ES-module tests
README.md             how to run, where to edit
assets/star.svg       8-point star lattice tile (used as a CSS mask)
assets/msalogo.jpg    existing logo
css/tokens.css        colours, fonts, spacing tokens (light + dark)
css/base.css          reset, typography, page frame, reveal, reduced motion
css/components.css    nav, buttons, cards, plates, tabs, dialog, faq
css/sections.css      hero, hud, stats, about, schedule, speakers, tickets, footer
js/config.js          event date, date text, venue, ticket URL
js/utils.js           pure functions: splitTime, ticketHref, countValue
js/theme-init.js      classic script in <head>: sets data-theme + .js before paint
js/theme.js           toggle button behaviour
js/nav.js             hide-on-scroll nav
js/countdown.js       live countdown
js/reveal.js          scroll reveal, count-up, SVG draw
js/tabs.js            schedule day tabs
js/dialog.js          speaker dialog open/close/fill
js/main.js            wires modules to config
tests/utils.test.mjs  unit tests for utils.js
```

Spec deviations (applied in Task 1 by editing the spec): `js/dialog.js` added for the speaker dialog; stat numbers live in HTML `data-count` attributes instead of `config.js`; stat "screws" are dots not stars; the hero date/venue bar is merged into the HUD strip to avoid duplication.

---

### Task 1: Foundations (tokens, base, utils + tests, theme bootstrap, page shell)

**Files:**
- Create: `package.json`, `assets/star.svg`, `css/tokens.css`, `css/base.css`, `css/components.css`, `css/sections.css`, `js/config.js`, `js/utils.js`, `js/theme-init.js`, `js/main.js`, `tests/utils.test.mjs`, new `index.html` (replaces the old file)
- Modify: `docs/superpowers/specs/2026-09-29-site-redesign-design.md`

**Interfaces:**
- Produces: `splitTime(ms) -> {days,hours,minutes,seconds}`, `ticketHref(url) -> string`, `countValue(target, progress) -> number` (all in `js/utils.js`); `config` object `{eventDate, dateText, venue, ticketUrl}`; CSS tokens (`--paper`, `--paper-2`, `--ink`, `--ink-soft`, `--line`, `--gold`, `--gold-text`, `--terracotta`, `--blue`, `--green`, `--radius`, `--frame`, `--ease`, `--font-sans`, `--font-mono`, `--font-script`); classes `.page`, `.section`, `.section-head`, `.mono-label`; attribute hooks `data-reveal` (with `--d` stagger), `.js` class on `<html>`.

- [ ] **Step 1: Confirm Node can run the built-in test runner**

Run: `node --version`
Expected: `v18` or higher.

- [ ] **Step 2: Write the failing tests**

Create `package.json`:
```json
{ "private": true, "type": "module" }
```

Create `tests/utils.test.mjs`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { splitTime, ticketHref, countValue } from '../js/utils.js';

test('splitTime breaks milliseconds into days/hours/minutes/seconds', () => {
  const ms = ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000;
  assert.deepEqual(splitTime(ms), { days: 2, hours: 3, minutes: 4, seconds: 5 });
});

test('splitTime returns zeros for past, zero, and invalid input', () => {
  const zeros = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  assert.deepEqual(splitTime(-5000), zeros);
  assert.deepEqual(splitTime(0), zeros);
  assert.deepEqual(splitTime(NaN), zeros);
  assert.deepEqual(splitTime(new Date('not a date').getTime() - Date.now()), zeros);
});

test('ticketHref only accepts http(s) urls', () => {
  assert.equal(ticketHref('https://typeform.com/to/abc'), 'https://typeform.com/to/abc');
  assert.equal(ticketHref('http://example.com'), 'http://example.com');
  assert.equal(ticketHref(''), '#tickets');
  assert.equal(ticketHref(undefined), '#tickets');
  assert.equal(ticketHref('javascript:alert(1)'), '#tickets');
  assert.equal(ticketHref('typeform.com/to/abc'), '#tickets');
});

test('countValue eases from 0 to target and clamps progress', () => {
  assert.equal(countValue(500, 0), 0);
  assert.equal(countValue(500, 1), 500);
  assert.equal(countValue(500, 2), 500);
  assert.equal(countValue(500, -1), 0);
  const mid = countValue(500, 0.5);
  assert.ok(mid > 250 && mid < 500, 'ease-out is ahead of linear at 50%');
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --test tests/`
Expected: FAIL — `Cannot find module '../js/utils.js'`.

- [ ] **Step 4: Write `js/utils.js`**

```js
// Pure helpers. No DOM access, so they can be unit-tested with `node --test tests/`.

export function splitTime(ms) {
  if (!(ms > 0)) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function ticketHref(url) {
  return typeof url === 'string' && /^https?:\/\//.test(url) ? url : '#tickets';
}

export function countValue(target, progress) {
  const p = Math.min(1, Math.max(0, progress));
  return Math.round(target * (1 - Math.pow(1 - p, 3)));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/`
Expected: 4 tests pass, 0 fail.

- [ ] **Step 6: Create the config, theme bootstrap and main entry**

`js/config.js`:
```js
// The one file to edit for event details.
// eventDate is a placeholder — replace with the real start time (ISO 8601 with timezone).
export const config = {
  eventDate: '2026-12-05T09:00:00-08:00',
  dateText: 'TBD 2026',
  venue: 'UC San Diego',
  ticketUrl: 'https://typeform.com/to/placeholder',
};
```

`js/theme-init.js` (classic script, runs in `<head>` before paint):
```js
// Sets the theme and the .js flag before first paint so there is no flash.
(function () {
  var theme = null;
  try { theme = localStorage.getItem('theme'); } catch (e) { /* storage blocked */ }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.add('js');
})();
```

`js/main.js`:
```js
import { config } from './config.js';
import { ticketHref } from './utils.js';

document.querySelectorAll('[data-config]').forEach((el) => {
  el.textContent = config[el.dataset.config] ?? el.textContent;
});

const href = ticketHref(config.ticketUrl);
document.querySelectorAll('[data-ticket-link]').forEach((a) => {
  a.href = href;
  if (href.startsWith('http')) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
});
```

- [ ] **Step 7: Create the lattice asset**

`assets/star.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g fill="none" stroke="#000" stroke-width="0.8"><polygon points="50,12 57.65,31.52 76.87,23.13 68.48,42.35 88,50 68.48,57.65 76.87,76.87 57.65,68.48 50,88 42.35,68.48 23.13,76.87 31.52,57.65 12,50 31.52,42.35 23.13,23.13 42.35,31.52"/><circle cx="50" cy="50" r="6"/><path d="M88 50H100M0 50H12M50 0V12M50 88V100"/><path d="M0 -12L12 0L0 12L-12 0ZM100 -12L112 0L100 12L88 0ZM0 88L12 100L0 112L-12 100ZM100 88L112 100L100 112L88 100Z"/></g></svg>
```

- [ ] **Step 8: Create the stylesheets**

`css/tokens.css`:
```css
:root {
  --font-sans: 'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  --font-script: 'Pinyon Script', 'Snell Roundhand', 'Brush Script MT', cursive;

  --paper: #f4efe3;
  --paper-2: #ece5d4;
  --ink: #12403b;
  --ink-soft: #4a6b66;
  --line: #c9c2b0;
  --gold: #a87a26;
  --gold-text: #7d5a1a;
  --terracotta: #b5573a;
  --blue: #3a6a99;
  --green: #3f7a5a;

  --radius: 10px;
  --frame: min(1280px, 92vw);
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme='dark'] {
  --paper: #0b2f2c;
  --paper-2: #0f3a36;
  --ink: #f3ede0;
  --ink-soft: #b9c6bd;
  --line: rgba(227, 195, 128, 0.3);
  --gold: #e3c380;
  --gold-text: #e3c380;
  --terracotta: #e08a6a;
  --blue: #8fb3dc;
  --green: #7fc29b;
}
```

`css/base.css`:
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; scroll-padding-top: 90px; -webkit-text-size-adjust: 100%; }
body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  line-height: 1.6;
  overflow-x: hidden;
  transition: background-color 0.3s, color 0.3s;
}
img, svg { display: block; max-width: 100%; }
a { color: inherit; }
button { font: inherit; color: inherit; cursor: pointer; }
h1, h2, h3 { line-height: 1.1; font-weight: 500; letter-spacing: -0.02em; }
h2 { font-size: clamp(1.9rem, 4.4vw, 3rem); }
h3 { font-size: 1.25rem; }
[hidden] { display: none !important; }

.mono-label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }

.skip {
  position: absolute; left: 1rem; top: -4rem; z-index: 100;
  background: var(--ink); color: var(--paper);
  padding: 0.6rem 1rem; border-radius: var(--radius);
}
.skip:focus { top: 1rem; }

/* Page frame: two hairline rules down the sides */
.page { position: relative; max-width: 2000px; margin-inline: auto; }
.page::before, .page::after {
  content: ''; position: absolute; top: 0; bottom: 0; width: 1px;
  background: var(--line); pointer-events: none; z-index: 1;
}
.page::before { left: calc((100% - var(--frame)) / 2); }
.page::after { right: calc((100% - var(--frame)) / 2); }

.section {
  width: var(--frame);
  margin-inline: auto;
  padding: clamp(4rem, 9vw, 7rem) clamp(1rem, 3vw, 2rem);
}
.section-head {
  display: grid; gap: 0.75rem; justify-items: center; text-align: center;
  margin-bottom: clamp(2rem, 5vw, 3.5rem);
}

/* Scroll reveal — only hides content when JS is running */
.js [data-reveal] {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.8s var(--ease), transform 0.8s var(--ease);
  transition-delay: calc(var(--d, 0) * 90ms);
}
.js [data-reveal].in-view { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
}
```

`css/components.css`:
```css
/* Components — nav, buttons, cards, plates, tabs, dialog, faq are appended by later tasks. */
```

`css/sections.css`:
```css
/* Sections — hero, hud, stats, about, schedule, speakers, tickets, footer are appended by later tasks. */
```

- [ ] **Step 9: Replace `index.html` with the shell**

Overwrite `index.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tarbiyyah Conference 2026 — MSA at UC San Diego</title>
  <meta name="description" content="Tarbiyyah Conference — a gathering of knowledge and community, presented by MSA at UC San Diego.">
  <link rel="icon" href="assets/msalogo.jpg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&family=Pinyon+Script&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/sections.css">
  <script src="js/theme-init.js"></script>
  <script type="module" src="js/main.js"></script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <!-- @nav -->
  <div class="page">
    <main id="main">
      <!-- @hero -->
      <!-- @hud -->
      <!-- @stats -->
      <!-- @about -->
      <!-- @schedule -->
      <!-- @speakers -->
      <!-- @tickets -->
      <!-- @faq -->
    </main>
    <!-- @footer -->
  </div>
  <!-- @dialog -->
</body>
</html>
```

- [ ] **Step 10: Amend the spec for the four deviations**

In `docs/superpowers/specs/2026-09-29-site-redesign-design.md`: after the `js/tabs.js` line in the file structure add `js/dialog.js         speaker dialog open/close/fill`; change `js/config.js        event date, Typeform URL, placeholder stats (the one file to edit)` to `js/config.js        event date, date text, venue, Typeform URL (the one file to edit)`; change `plates with 8-point-star "screws"; numbers count up (placeholders)` to `plates with corner screw dots; numbers (HTML data-count attributes) count up (placeholders)`; change `3. **HUD strip** — countdown, date and venue, Get Tickets button.` to `3. **HUD strip** — countdown, date and venue (the hero has no separate facts bar), Get Tickets button.`

- [ ] **Step 11: Verify in the browser**

Run: `python3 -m http.server 8765` (leave running), open `http://localhost:8765/index.html`.
Expected: parchment `#f4efe3` background, empty page, no console errors. In the console: `document.documentElement.dataset.theme` is `light` (or `dark` if your OS is dark), `document.documentElement.classList.contains('js')` is `true`.

- [ ] **Step 12: Commit**

```bash
git add package.json index.html assets/star.svg css js tests docs/superpowers/specs/2026-09-29-site-redesign-design.md
git commit -m "Add site foundations: tokens, base styles, utils with tests, theme bootstrap

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- package.json index.html assets/star.svg css js tests docs/superpowers/specs/2026-09-29-site-redesign-design.md
```

---

### Task 2: Nav, buttons, cards and theme toggle

**Files:**
- Create: `js/theme.js`, `js/nav.js`
- Modify: `css/components.css`, `js/main.js`, `index.html` (replace `<!-- @nav -->`)

**Interfaces:**
- Consumes: tokens and `.mono-label` from Task 1; `data-ticket-link` handling in `main.js`.
- Produces: `initTheme()` (theme.js), `initNav()` (nav.js); classes `.btn`, `.btn-solid`, `.btn-line`, `.btn-sm`, `.card`, `.card-head`, `.card-body`; `[data-theme-toggle]` button; `#nav`.

- [ ] **Step 1: Write `js/theme.js`**

```js
// Toggle button behaviour. The initial theme is set by theme-init.js before paint.
const root = document.documentElement;

export function initTheme() {
  const buttons = document.querySelectorAll('[data-theme-toggle]');
  const sync = () => buttons.forEach((b) => b.setAttribute('aria-pressed', String(root.dataset.theme === 'dark')));
  sync();
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked: keep for this session */ }
      sync();
    });
  });
}
```

- [ ] **Step 2: Write `js/nav.js`**

```js
// Floating nav: hides while scrolling down, returns on scroll up.
export function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  let last = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const goingDown = y > last && y > 120;
      nav.classList.toggle('nav--hidden', goingDown && !nav.contains(document.activeElement));
      last = y;
      ticking = false;
    });
  }, { passive: true });
}
```

- [ ] **Step 3: Wire into `js/main.js`**

Add after the existing imports:
```js
import { initTheme } from './theme.js';
import { initNav } from './nav.js';
```
Add at the end of the file:
```js
initTheme();
initNav();
```

- [ ] **Step 4: Replace `<!-- @nav -->` in `index.html`**

```html
<div class="nav" id="nav">
  <nav class="nav-inner" aria-label="Main">
    <a class="nav-brand" href="#top">
      <img src="assets/msalogo.jpg" alt="" width="28" height="28">
      <span>Tarbiyyah</span>
    </a>
    <ul class="nav-links">
      <li><a href="#about">About</a></li>
      <li><a href="#schedule">Schedule</a></li>
      <li><a href="#speakers">Speakers</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
    <div class="nav-actions">
      <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode" aria-pressed="false">
        <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>
      </button>
      <a class="btn btn-solid btn-sm" href="#tickets" data-ticket-link>Tickets</a>
    </div>
  </nav>
</div>
```

- [ ] **Step 5: Append to `css/components.css`**

```css
/* ===== Buttons ===== */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.85rem 1.6rem;
  border: 1px solid var(--ink); border-radius: 8px;
  background: transparent; color: var(--ink);
  font-family: var(--font-mono); font-size: 0.78rem; letter-spacing: 0.14em;
  text-transform: uppercase; text-decoration: none;
  transition: background-color 0.25s, color 0.25s, border-color 0.25s, transform 0.25s var(--ease);
}
.btn:hover { transform: translateY(-2px); }
.btn-solid { background: var(--ink); color: var(--paper); }
.btn-solid:hover { background: var(--gold); border-color: var(--gold); color: var(--paper); }
.btn-line:hover { background: var(--ink); color: var(--paper); }
.btn-sm { padding: 0.55rem 1rem; font-size: 0.7rem; }

/* ===== Cards ===== */
.card {
  border: 1px solid var(--line); border-radius: var(--radius);
  background: var(--paper); overflow: hidden;
}
.card-head {
  display: flex; justify-content: space-between; gap: 1rem;
  padding: 0.7rem 1.1rem;
  border-bottom: 1px solid var(--line); background: var(--paper-2);
}
.card-body { display: grid; gap: 0.6rem; padding: 1.2rem 1.1rem; }
.card-body p { font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.7; color: var(--ink-soft); }

/* ===== Nav ===== */
.nav {
  position: fixed; top: 0; left: 50%; z-index: 60;
  width: var(--frame);
  transform: translateX(-50%);
  filter: drop-shadow(0 1px 0 var(--line));
  transition: transform 0.35s var(--ease);
}
.nav--hidden { transform: translate(-50%, -120%); }
.nav-inner {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  height: 60px; padding-inline: clamp(1.25rem, 4vw, 2.5rem);
  background: var(--paper-2);
  clip-path: polygon(0 0, 100% 0, 100% 30%, calc(100% - 26px) 100%, 26px 100%, 0 30%);
}
.nav-brand { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; font-weight: 500; letter-spacing: -0.01em; }
.nav-brand img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.nav-links { display: flex; gap: 1.6rem; list-style: none; }
.nav-links a {
  font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.14em;
  text-transform: uppercase; text-decoration: none; color: var(--ink-soft);
  transition: color 0.2s;
}
.nav-links a:hover { color: var(--ink); }
.nav-actions { display: flex; align-items: center; gap: 0.75rem; }
.theme-toggle {
  display: grid; place-items: center; width: 34px; height: 34px;
  border: 1px solid var(--line); border-radius: 50%; background: transparent;
}
.theme-toggle svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; }
.theme-toggle .icon-moon { display: none; }
[data-theme='dark'] .theme-toggle .icon-sun { display: none; }
[data-theme='dark'] .theme-toggle .icon-moon { display: block; }
@media (max-width: 720px) { .nav-links { display: none; } }
```

- [ ] **Step 6: Verify**

Reload `http://localhost:8765/index.html`. Expected: a notched nav tab at the top centre; clicking the moon/sun switches the page between parchment and dark teal; reload keeps the choice; scrolling is not possible yet (page is empty) so check hide-on-scroll in Task 5.
Review Focus 3: in the console run `Storage.prototype.setItem = () => { throw new Error('blocked'); }` then click the toggle. Expected: theme still switches, no uncaught error.

- [ ] **Step 7: Commit**

```bash
git add index.html css/components.css js/theme.js js/nav.js js/main.js
git commit -m "Add nav, buttons, cards and theme toggle

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- index.html css/components.css js/theme.js js/nav.js js/main.js
```

---

### Task 3: Hero with lattice, arch frame, skyline and lanterns; reveal module

**Files:**
- Create: `js/reveal.js`
- Modify: `css/sections.css`, `js/main.js`, `index.html` (replace `<!-- @hero -->`)

**Interfaces:**
- Consumes: `countValue(target, progress)` from `js/utils.js`; `data-reveal`, `--d` from base.css.
- Produces: `initReveal()` — observes `[data-reveal], .draw-group, [data-count]`; adds `.in-view`; sets `pathLength="1"` on `.draw`; counts up `[data-count]` (uses `data-suffix`).

- [ ] **Step 1: Write `js/reveal.js`**

```js
import { countValue } from './utils.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initReveal() {
  document.querySelectorAll('.draw').forEach((el) => el.setAttribute('pathLength', '1'));
  const counters = document.querySelectorAll('[data-count]');
  if (!reduced) counters.forEach((el) => { el.textContent = '0' + (el.dataset.suffix || ''); });

  const targets = document.querySelectorAll('[data-reveal], .draw-group, [data-count]');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(show);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      show(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  targets.forEach((el) => observer.observe(el));
}

function show(el) {
  el.classList.add('in-view');
  if (el.dataset.count !== undefined) countUp(el);
}

function countUp(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  if (reduced) {
    el.textContent = target.toLocaleString() + suffix;
    return;
  }
  const start = performance.now();
  const duration = 1400;
  const step = (now) => {
    const progress = (now - start) / duration;
    el.textContent = countValue(target, progress).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
```

- [ ] **Step 2: Wire into `js/main.js`**

Add import `import { initReveal } from './reveal.js';` and at the end `initReveal();`.

- [ ] **Step 3: Replace `<!-- @hero -->` in `index.html`**

```html
<section class="hero" id="top">
  <div class="lattice-fade" aria-hidden="true"><div class="lattice"></div></div>

  <div class="arch-frame draw-group" aria-hidden="true">
    <svg viewBox="0 0 800 1000" preserveAspectRatio="none">
      <path class="draw-abs arch-line" d="M 20 1000 V 440 C 20 260 230 130 400 20 C 570 130 780 260 780 440 V 1000"/>
      <path class="draw-abs arch-line arch-inner" d="M 56 1000 V 450 C 56 285 250 170 400 68 C 550 170 744 285 744 450 V 1000"/>
    </svg>
  </div>

  <div class="hero-content">
    <svg class="crescent" viewBox="0 0 24 24" aria-hidden="true" data-reveal><path d="M15 3a9 9 0 1 0 6 15A7.5 7.5 0 0 1 15 3z"/></svg>
    <p class="mono-label eyebrow" data-reveal style="--d:1">MSA at UC San Diego presents</p>
    <h1 class="title" data-reveal style="--d:2"><span>Tarbiyyah</span><span class="accent">Conference</span></h1>
    <p class="subtitle" data-reveal style="--d:4">A gathering of knowledge &amp; community</p>
    <a class="btn btn-solid" href="#tickets" data-ticket-link data-reveal style="--d:5">Reserve your seat</a>
  </div>

  <div class="hero-base" aria-hidden="true">
    <div class="skyline draw-group">
      <svg viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice">
        <path class="draw sk-ink" style="--d:0" d="M0 200H1200"/>
        <path class="draw sk-terra" style="--d:1" d="M60 200V140H170V200"/>
        <path class="draw sk-terra" style="--d:2" d="M78 200V166a11 11 0 0 1 22 0V200M130 200V166a11 11 0 0 1 22 0V200"/>
        <path class="draw sk-blue" style="--d:2" d="M232 200V80M258 200V80M226 80H264M236 80V62M254 80V62M234 62Q245 34 256 62M245 34V20"/>
        <path class="draw sk-green" style="--d:3" d="M310 200Q313 160 308 128M308 128Q290 120 278 130M308 128Q296 110 280 110M308 128Q320 110 336 114M308 128Q328 122 340 134"/>
        <path class="draw sk-gold" style="--d:3" d="M380 200V150H820V200"/>
        <path class="draw sk-gold" style="--d:4" d="M490 150V132H710V150M490 132a110 110 0 0 1 220 0M600 22V12"/>
        <path class="draw sk-gold" style="--d:5" d="M604 4a7 7 0 1 0 0 12 5.5 5.5 0 1 1 0-12z"/>
        <path class="draw sk-gold" style="--d:5" d="M400 150a40 40 0 0 1 80 0M720 150a40 40 0 0 1 80 0"/>
        <path class="draw sk-gold" style="--d:5" d="M570 200V175C570 160 590 150 600 140C610 150 630 160 630 175V200"/>
        <path class="draw sk-gold" style="--d:6" d="M420 200V186a8 8 0 0 1 16 0V200M452 200V186a8 8 0 0 1 16 0V200M732 200V186a8 8 0 0 1 16 0V200M764 200V186a8 8 0 0 1 16 0V200"/>
        <path class="draw sk-blue" style="--d:6" d="M840 200V160H980V200"/>
        <path class="draw sk-blue" style="--d:7" d="M852 200V182a10 10 0 0 1 20 0V200M895 200V182a10 10 0 0 1 20 0V200M938 200V182a10 10 0 0 1 20 0V200"/>
        <path class="draw sk-blue" style="--d:7" d="M1002 200V90M1028 200V90M996 90H1034M1006 90V72M1024 90V72M1004 72Q1015 44 1026 72M1015 44V30"/>
        <path class="draw sk-terra" style="--d:8" d="M1060 200V110H1140V200M1060 110V98H1070V106H1080V98H1090V106H1100V98H1110V106H1120V98H1130V106H1140V98V110"/>
        <path class="draw sk-terra" style="--d:9" d="M1082 200V152C1082 136 1100 126 1100 126C1100 126 1118 136 1118 152V200"/>
        <path class="draw sk-green" style="--d:9" d="M1185 200Q1188 165 1183 136M1183 136Q1165 128 1153 138M1183 136Q1171 118 1155 118M1183 136Q1195 118 1211 122M1183 136Q1203 130 1215 142"/>
      </svg>
    </div>
    <div class="lanterns draw-group">
      <svg viewBox="0 0 1200 90" preserveAspectRatio="xMidYMin slice">
        <path class="draw sk-ink" d="M0 10Q150 70 300 10Q450 70 600 10Q750 70 900 10Q1050 70 1200 10"/>
        <g class="lantern sk-gold" transform="translate(150 40)"><path d="M0 0V8M-7 8h14l4 8v12l-4 8h-14l-4-8V16z"/><circle class="glow" style="--d:0" cx="0" cy="22" r="3"/></g>
        <g class="lantern sk-gold" transform="translate(450 40)"><path d="M0 0V8M-7 8h14l4 8v12l-4 8h-14l-4-8V16z"/><circle class="glow" style="--d:1" cx="0" cy="22" r="3"/></g>
        <g class="lantern sk-gold" transform="translate(750 40)"><path d="M0 0V8M-7 8h14l4 8v12l-4 8h-14l-4-8V16z"/><circle class="glow" style="--d:2" cx="0" cy="22" r="3"/></g>
        <g class="lantern sk-gold" transform="translate(1050 40)"><path d="M0 0V8M-7 8h14l4 8v12l-4 8h-14l-4-8V16z"/><circle class="glow" style="--d:3" cx="0" cy="22" r="3"/></g>
      </svg>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Append to `css/sections.css`**

```css
/* ===== Hero ===== */
.hero {
  position: relative;
  min-height: 100vh; min-height: 100dvh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; overflow: hidden; isolation: isolate;
  padding: clamp(6rem, 12vh, 8rem) clamp(1.25rem, 5vw, 3rem)
           calc(clamp(120px, 20vw, 260px) + clamp(50px, 7vw, 90px) + 2rem);
  background:
    radial-gradient(ellipse 70% 55% at 50% 42%, color-mix(in srgb, var(--gold) 16%, transparent), transparent 70%),
    var(--paper);
}

/* Islamic 8-point star lattice, tinted by --gold, faded out behind the content */
.lattice-fade {
  position: absolute; inset: 0; z-index: -2; pointer-events: none;
  -webkit-mask-image: radial-gradient(ellipse 60% 55% at 50% 48%, transparent 30%, #000 100%);
          mask-image: radial-gradient(ellipse 60% 55% at 50% 48%, transparent 30%, #000 100%);
}
.lattice {
  position: absolute; inset: 0; background: var(--gold); opacity: 0.22;
  -webkit-mask: url(../assets/star.svg) 0 0 / 160px 160px;
          mask: url(../assets/star.svg) 0 0 / 160px 160px;
  animation: drift 90s linear infinite;
}
@keyframes drift {
  to { -webkit-mask-position: 160px 160px; mask-position: 160px 160px; }
}

/* Pointed arch frame that holds the content */
.arch-frame {
  position: absolute; z-index: -1; bottom: 0; left: 50%; transform: translateX(-50%);
  width: min(860px, 94vw); height: min(94%, 1000px); pointer-events: none;
}
.arch-frame svg { width: 100%; height: 100%; overflow: visible; }
.arch-line {
  fill: none; stroke: var(--gold); stroke-width: 1.2;
  vector-effect: non-scaling-stroke; stroke-linecap: round;
}
.arch-inner { opacity: 0.55; }
.js .draw-abs {
  stroke-dasharray: 5000; stroke-dashoffset: 5000;
  transition: stroke-dashoffset 2.6s cubic-bezier(0.65, 0, 0.35, 1) 0.3s;
}
.js .arch-inner { transition-delay: 0.7s; }
.js .in-view .draw-abs, .js .draw-abs.in-view { stroke-dashoffset: 0; }

.hero-content {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center;
  gap: clamp(1rem, 2.6vh, 1.75rem);
  max-width: 640px; padding-inline: 1.75rem;
}
.crescent { width: 26px; height: 26px; fill: var(--gold); }
.eyebrow { color: var(--gold-text); font-weight: 500; letter-spacing: 0.3em; }
.title {
  font-family: var(--font-script); font-weight: 400;
  font-size: clamp(3.6rem, 12vw, 8.5rem);
  line-height: 0.95; padding-bottom: 0.12em; letter-spacing: 0;
  color: var(--ink);
}
.title span { display: block; }
.title .accent { color: var(--gold); }
.subtitle {
  font-family: var(--font-mono); font-size: clamp(0.72rem, 1.6vw, 0.9rem);
  letter-spacing: 0.24em; text-transform: uppercase; color: var(--ink-soft);
}

/* Skyline + lantern string along the bottom */
.hero-base { position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; pointer-events: none; }
.skyline { height: clamp(120px, 20vw, 260px); }
.lanterns { height: clamp(50px, 7vw, 90px); }
.hero-base svg { width: 100%; height: 100%; }
.hero-base path, .hero-base .lantern path {
  fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round;
}
.sk-ink { stroke: var(--ink-soft); }
.sk-gold { stroke: var(--gold); }
.sk-terra { stroke: var(--terracotta); }
.sk-blue { stroke: var(--blue); }
.sk-green { stroke: var(--green); }
.lantern.sk-gold .glow { fill: var(--gold); stroke: none; animation: glow 3s ease-in-out infinite; animation-delay: calc(var(--d, 0) * 0.6s); }
@keyframes glow { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }

/* SVG line drawing (pathLength is set to 1 by reveal.js) */
.js .draw {
  stroke-dasharray: 1; stroke-dashoffset: 1;
  transition: stroke-dashoffset 2.4s var(--ease);
  transition-delay: calc(var(--d, 0) * 0.25s + 0.3s);
}
.js .in-view .draw, .js .draw.in-view { stroke-dashoffset: 0; }
```

- [ ] **Step 5: Verify**

Reload. Expected: star lattice around the edges, gold arch draws itself, wordmark fades up in Pinyon Script (`Tarbiyyah` ink, `Conference` gold), skyline draws left-to-right ending with the gate and palm, four lanterns glow on the dashed-sag string. The mosque crescent renders as a crescent (if it looks like a closed blob, swap its path for `M604 4a7 7 0 1 0 0 12 6 6 0 1 1 0-12z`). Toggle dark mode: the same picture in teal/gold.
No-JS check (Review Focus 4): in the console run `document.documentElement.classList.remove('js')`. Expected: the wordmark, skyline and arch are all fully visible with no animation.
Narrow check: resize to 390px wide. Expected: content fits inside the arch, no horizontal scroll.

- [ ] **Step 6: Commit**

```bash
git add index.html css/sections.css js/reveal.js js/main.js
git commit -m "Add hero with star lattice, arch frame, skyline and lanterns

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- index.html css/sections.css js/reveal.js js/main.js
```

---

### Task 4: HUD strip (countdown) and stat plates

**Files:**
- Create: `js/countdown.js`
- Modify: `css/sections.css`, `css/components.css`, `js/main.js`, `index.html` (replace `<!-- @hud -->` and `<!-- @stats -->`)

**Interfaces:**
- Consumes: `splitTime` from utils; `config.eventDate`; `data-config` and `data-ticket-link` from main.js; `[data-count]`/`data-suffix` handling from reveal.js.
- Produces: `initCountdown(eventDate: string)` — fills `[data-cd="days|hours|minutes|seconds"]` inside `[data-countdown]` every second; `.plate` component.

- [ ] **Step 1: Write `js/countdown.js`**

```js
import { splitTime } from './utils.js';

const pad = (n) => String(n).padStart(2, '0');

export function initCountdown(eventDate) {
  const root = document.querySelector('[data-countdown]');
  if (!root) return;
  const cells = {};
  root.querySelectorAll('[data-cd]').forEach((el) => { cells[el.dataset.cd] = el; });
  const target = new Date(eventDate).getTime();

  const tick = () => {
    const t = splitTime(target - Date.now());
    cells.days.textContent = String(t.days);
    cells.hours.textContent = pad(t.hours);
    cells.minutes.textContent = pad(t.minutes);
    cells.seconds.textContent = pad(t.seconds);
  };
  tick();
  setInterval(tick, 1000);
}
```

- [ ] **Step 2: Wire into `js/main.js`**

Add `import { initCountdown } from './countdown.js';` and at the end `initCountdown(config.eventDate);`.

- [ ] **Step 3: Replace `<!-- @hud -->` and `<!-- @stats -->` in `index.html`**

```html
<section class="hud" aria-label="Event details">
  <div class="hud-inner">
    <div class="hud-panel" data-countdown data-reveal>
      <p class="mono-label">Countdown to Tarbiyyah</p>
      <div class="cd-row">
        <div class="cd-cell"><span class="cd-num" data-cd="days">0</span><span class="mono-label">Days</span></div>
        <div class="cd-cell"><span class="cd-num" data-cd="hours">00</span><span class="mono-label">Hrs</span></div>
        <div class="cd-cell"><span class="cd-num" data-cd="minutes">00</span><span class="mono-label">Min</span></div>
        <div class="cd-cell"><span class="cd-num" data-cd="seconds">00</span><span class="mono-label">Sec</span></div>
      </div>
    </div>
    <div class="hud-panel hud-facts" data-reveal style="--d:1">
      <p class="mono-label">Date</p>
      <strong data-config="dateText">TBD 2026</strong>
      <p class="mono-label">Venue</p>
      <strong data-config="venue">UC San Diego</strong>
    </div>
    <a class="btn btn-solid hud-cta" href="#tickets" data-ticket-link data-reveal style="--d:2">Get tickets</a>
  </div>
</section>
```
```html
<section class="section" id="stats" aria-labelledby="stats-title">
  <header class="section-head" data-reveal>
    <p class="mono-label">By the numbers</p>
    <h2 id="stats-title">What we're building together</h2>
  </header>
  <div class="plates">
    <div class="plate" data-reveal><span class="plate-num" data-count="500" data-suffix="+">500+</span><span class="mono-label">Attendees</span></div>
    <div class="plate" data-reveal style="--d:1"><span class="plate-num" data-count="12" data-suffix="+">12+</span><span class="mono-label">Speakers</span></div>
    <div class="plate" data-reveal style="--d:2"><span class="plate-num" data-count="20" data-suffix="+">20+</span><span class="mono-label">Sessions</span></div>
    <div class="plate" data-reveal style="--d:3"><span class="plate-num" data-count="30" data-suffix="+">30+</span><span class="mono-label">Bazaar vendors</span></div>
  </div>
</section>
```

- [ ] **Step 4: Append to `css/components.css` (plate)**

```css
/* ===== Stat plate: bordered box with four screw dots ===== */
.plate {
  --dot: radial-gradient(circle, transparent 1.5px, var(--ink-soft) 2px, var(--ink-soft) 2.5px, transparent 3px);
  display: grid; gap: 0.4rem; justify-items: center; text-align: center;
  padding: 1.6rem 1rem;
  border: 1px solid var(--line); border-radius: var(--radius);
  background-color: var(--paper);
  background-image: var(--dot), var(--dot), var(--dot), var(--dot);
  background-size: 10px 10px;
  background-repeat: no-repeat;
  background-position: 6px 6px, calc(100% - 6px) 6px, 6px calc(100% - 6px), calc(100% - 6px) calc(100% - 6px);
}
.plate-num { font-family: var(--font-mono); font-size: clamp(2rem, 4.5vw, 3rem); font-variant-numeric: tabular-nums; }
```

- [ ] **Step 5: Append to `css/sections.css` (HUD and plates layout)**

```css
/* ===== HUD strip ===== */
.hud { width: var(--frame); margin-inline: auto; padding: 1.5rem clamp(1rem, 3vw, 2rem); }
.hud-inner { display: grid; grid-template-columns: 1.4fr 1fr auto; gap: 1rem; align-items: stretch; }
.hud-panel {
  display: grid; gap: 0.6rem; align-content: start;
  padding: 1rem 1.2rem;
  border: 1px solid var(--line); border-radius: var(--radius); background: var(--paper);
}
.cd-row { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.cd-cell { display: grid; justify-items: center; gap: 0.1rem; padding: 0.6rem 0.25rem; }
.cd-cell + .cd-cell { border-left: 1px solid var(--line); }
.cd-num { font-family: var(--font-mono); font-size: clamp(1.4rem, 3.2vw, 2rem); font-variant-numeric: tabular-nums; }
.hud-facts strong { font-weight: 500; }
.js .hud-panel.in-view .cd-num { animation: flicker 0.6s steps(1) 1; }
@keyframes flicker {
  0% { opacity: 0; } 8% { opacity: 1; } 14% { opacity: 0; } 22% { opacity: 1; }
  30% { opacity: 0.2; } 44% { opacity: 1; } 100% { opacity: 1; }
}
@media (max-width: 820px) { .hud-inner { grid-template-columns: 1fr; } }

/* ===== Stats ===== */
.plates { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; }
```

- [ ] **Step 6: Verify**

Reload. Expected: below the skyline a HUD strip with a ticking D/H/M/S countdown (flickers on once when it scrolls in), date/venue panel, and a Get tickets button; then four plates whose numbers count up from 0 when scrolled into view.
Malformed date (Review Focus 1, browser side): temporarily set `eventDate: 'nope'` in `js/config.js`, reload. Expected: `0`, `00`, `00`, `00` and no `NaN`. Restore the date afterwards.
Reduced motion (Review Focus 5): in Chrome DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", reload. Expected: plates show `500+`, `12+`, `20+`, `30+` immediately, skyline fully drawn, lattice static.
Ticket link (Review Focus 2, browser side): the Get tickets button opens `https://typeform.com/to/placeholder` in a new tab; set `ticketUrl: ''`, reload → the button jumps to `#tickets`. Restore the URL.

- [ ] **Step 7: Commit**

```bash
git add index.html css js/countdown.js js/main.js
git commit -m "Add HUD countdown strip and count-up stat plates

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- index.html css js/countdown.js js/main.js
```

---

### Task 5: About card and schedule spine with day tabs

**Files:**
- Create: `js/tabs.js`
- Modify: `css/components.css`, `css/sections.css`, `js/main.js`, `index.html` (replace `<!-- @about -->` and `<!-- @schedule -->`)

**Interfaces:**
- Consumes: `.card`, `.card-head`, `.card-body`, `.mono-label`, `data-reveal`.
- Produces: `initTabs()` — for each `[data-tabs]`: `[role="tab"]` buttons with `aria-controls` toggle `hidden` on the matching `[role="tabpanel"]`; arrow keys move selection. `.tabs`/`.tab`, `.spine`, `.stop`, `.stop-dot`.

- [ ] **Step 1: Write `js/tabs.js`**

```js
// Accessible tabs: click or arrow keys switch panels; without JS all panels stay visible.
export function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

    const select = (index) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        select(next);
        tabs[next].focus();
      });
    });
    select(0);
  });
}
```

- [ ] **Step 2: Wire into `js/main.js`**

Add `import { initTabs } from './tabs.js';` and at the end `initTabs();`.

- [ ] **Step 3: Replace `<!-- @about -->` and `<!-- @schedule -->` in `index.html`**

```html
<section class="section" id="about">
  <article class="card about-card" data-reveal>
    <header class="card-head"><span class="mono-label">About</span><span class="mono-label">01</span></header>
    <div class="card-body">
      <h2>A gathering rooted in knowledge</h2>
      <p>Placeholder description of the conference: its purpose, who it is for, and what attendees can expect from a day of lectures, panels and community.</p>
      <p>A few more sentences on the vision behind Tarbiyyah Conference and the community it brings together at UC San Diego.</p>
    </div>
  </article>
</section>
```
```html
<section class="section" id="schedule">
  <header class="section-head" data-reveal>
    <p class="mono-label">Schedule</p>
    <h2>A day at Tarbiyyah</h2>
  </header>
  <div data-tabs>
    <div class="tabs" role="tablist" aria-label="Conference days">
      <button class="tab" role="tab" id="tab-day-1" aria-controls="day-1" aria-selected="true" type="button">Day 1 · TBD</button>
      <button class="tab" role="tab" id="tab-day-2" aria-controls="day-2" aria-selected="false" tabindex="-1" type="button">Day 2 · TBD</button>
    </div>
    <div class="spine" role="tabpanel" id="day-1" aria-labelledby="tab-day-1">
      <article class="stop" data-reveal>
        <span class="stop-dot" aria-hidden="true"></span>
        <div class="card"><header class="card-head"><span class="mono-label">TBD</span><span class="mono-label">Main Hall</span></header>
          <div class="card-body"><h3>Registration &amp; check-in</h3><p>Placeholder description of the session.</p></div></div>
      </article>
      <article class="stop" data-reveal>
        <span class="stop-dot" aria-hidden="true"></span>
        <div class="card"><header class="card-head"><span class="mono-label">TBD</span><span class="mono-label">Auditorium</span></header>
          <div class="card-body"><h3>Opening keynote</h3><p>Placeholder description of the session.</p></div></div>
      </article>
      <article class="stop" data-reveal>
        <span class="stop-dot" aria-hidden="true"></span>
        <div class="card"><header class="card-head"><span class="mono-label">TBD</span><span class="mono-label">Auditorium</span></header>
          <div class="card-body"><h3>Panel discussion</h3><p>Placeholder description of the session.</p></div></div>
      </article>
      <article class="stop" data-reveal>
        <span class="stop-dot" aria-hidden="true"></span>
        <div class="card"><header class="card-head"><span class="mono-label">TBD</span><span class="mono-label">Courtyard</span></header>
          <div class="card-body"><h3>Bazaar &amp; community time</h3><p>Placeholder description of the session.</p></div></div>
      </article>
    </div>
    <div class="spine" role="tabpanel" id="day-2" aria-labelledby="tab-day-2">
      <article class="stop" data-reveal>
        <span class="stop-dot" aria-hidden="true"></span>
        <div class="card"><header class="card-head"><span class="mono-label">TBD</span><span class="mono-label">Auditorium</span></header>
          <div class="card-body"><h3>Morning lecture</h3><p>Placeholder description of the session.</p></div></div>
      </article>
      <article class="stop" data-reveal>
        <span class="stop-dot" aria-hidden="true"></span>
        <div class="card"><header class="card-head"><span class="mono-label">TBD</span><span class="mono-label">Main Hall</span></header>
          <div class="card-body"><h3>Workshops</h3><p>Placeholder description of the session.</p></div></div>
      </article>
      <article class="stop" data-reveal>
        <span class="stop-dot" aria-hidden="true"></span>
        <div class="card"><header class="card-head"><span class="mono-label">TBD</span><span class="mono-label">Auditorium</span></header>
          <div class="card-body"><h3>Closing remarks</h3><p>Placeholder description of the session.</p></div></div>
      </article>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Append to `css/components.css` (tabs)**

```css
/* ===== Tabs (hidden without JS: all panels are shown instead) ===== */
.tabs { display: none; }
.js .tabs { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 2rem; }
.tab {
  padding: 0.6rem 1.1rem;
  border: 1px solid var(--line); border-radius: 8px; background: transparent;
  font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ink-soft);
  transition: background-color 0.2s, color 0.2s;
}
.tab[aria-selected='true'] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
```

- [ ] **Step 5: Append to `css/sections.css` (about, spine)**

```css
/* ===== About ===== */
.about-card { max-width: 720px; margin-inline: auto; }
.about-card h2 { font-size: clamp(1.6rem, 3.6vw, 2.4rem); }

/* ===== Schedule spine: double gold line with stops, cards alternate sides ===== */
.spine { position: relative; display: grid; gap: 2rem; padding-block: 1rem; margin-bottom: 2rem; }
.spine::before {
  content: ''; position: absolute; top: 0; bottom: 0; left: 50%;
  width: 6px; transform: translateX(-50%);
  border-inline: 1px solid var(--gold);
}
.stop { position: relative; display: flex; }
.stop:nth-child(even) { justify-content: flex-end; }
.stop .card { width: calc(50% - 2rem); }
.stop-dot {
  position: absolute; left: 50%; top: 1.6rem; width: 14px; height: 14px;
  transform: translateX(-50%);
  border: 1px solid var(--gold); border-radius: 50%; background: var(--paper);
}
@media (max-width: 720px) {
  .spine::before, .stop-dot { left: 10px; }
  .stop, .stop:nth-child(even) { justify-content: flex-end; }
  .stop .card { width: calc(100% - 2.25rem); }
}
```

- [ ] **Step 6: Verify**

Reload and scroll. Expected: About card fades in; the schedule shows Day 1 / Day 2 tabs; clicking Day 2 (or pressing ← / → on a focused tab) swaps the spine; cards alternate left and right of a double gold line with round stops; at 390px the spine moves to the left edge.
Nav hide-on-scroll: scrolling down hides the nav tab, scrolling up brings it back.
No-JS check: `document.documentElement.classList.remove('js')` → tabs disappear and both days show stacked (reload afterwards to restore).

- [ ] **Step 7: Commit**

```bash
git add index.html css js/tabs.js js/main.js
git commit -m "Add about card and schedule spine with day tabs

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- index.html css js/tabs.js js/main.js
```

---

### Task 6: Speakers with bio dialog

**Files:**
- Create: `js/dialog.js`
- Modify: `css/components.css`, `css/sections.css`, `js/main.js`, `index.html` (replace `<!-- @speakers -->` and `<!-- @dialog -->`)

**Interfaces:**
- Consumes: `.card`, `.card-head`, `.card-body`, `.mono-label`, `data-reveal`; `assets/star.svg`.
- Produces: `initDialogs()` — a `[data-dialog-open="<id>"]` button copies its `data-name`, `data-role`, `data-bio` into the dialog's `[data-dialog-name]`, `[data-dialog-role]`, `[data-dialog-bio]` and calls `showModal()`; `[data-dialog-close]` or a backdrop click closes it.

- [ ] **Step 1: Write `js/dialog.js`**

```js
// Opens a shared <dialog>, filling it from the clicked button's data attributes.
export function initDialogs() {
  document.querySelectorAll('[data-dialog-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById(button.dataset.dialogOpen);
      if (!dialog || !dialog.showModal) return;
      const fill = (selector, text) => {
        const el = dialog.querySelector(selector);
        if (el) el.textContent = text || '';
      };
      fill('[data-dialog-name]', button.dataset.name);
      fill('[data-dialog-role]', button.dataset.role);
      fill('[data-dialog-bio]', button.dataset.bio);
      dialog.showModal();
    });
  });

  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.querySelectorAll('[data-dialog-close]').forEach((b) => b.addEventListener('click', () => dialog.close()));
  });
}
```

- [ ] **Step 2: Wire into `js/main.js`**

Add `import { initDialogs } from './dialog.js';` and at the end `initDialogs();`.

- [ ] **Step 3: Replace `<!-- @speakers -->` and `<!-- @dialog -->` in `index.html`**

```html
<section class="section" id="speakers">
  <header class="section-head" data-reveal>
    <p class="mono-label">Speakers</p>
    <h2>Voices of the conference</h2>
  </header>
  <div class="speaker-grid">
    <button class="card speaker" type="button" data-dialog-open="speaker-dialog" data-name="Speaker Name" data-role="Title / Affiliation" data-bio="Placeholder biography for this speaker: background, current work, and what they will be sharing at the conference." data-reveal>
      <span class="portrait" aria-hidden="true"></span>
      <span class="speaker-name">Speaker Name</span>
      <span class="mono-label">Title / Affiliation</span>
    </button>
    <button class="card speaker" type="button" data-dialog-open="speaker-dialog" data-name="Speaker Name" data-role="Title / Affiliation" data-bio="Placeholder biography for this speaker: background, current work, and what they will be sharing at the conference." data-reveal style="--d:1">
      <span class="portrait" aria-hidden="true"></span>
      <span class="speaker-name">Speaker Name</span>
      <span class="mono-label">Title / Affiliation</span>
    </button>
    <button class="card speaker" type="button" data-dialog-open="speaker-dialog" data-name="Speaker Name" data-role="Title / Affiliation" data-bio="Placeholder biography for this speaker: background, current work, and what they will be sharing at the conference." data-reveal style="--d:2">
      <span class="portrait" aria-hidden="true"></span>
      <span class="speaker-name">Speaker Name</span>
      <span class="mono-label">Title / Affiliation</span>
    </button>
    <button class="card speaker" type="button" data-dialog-open="speaker-dialog" data-name="Speaker Name" data-role="Title / Affiliation" data-bio="Placeholder biography for this speaker: background, current work, and what they will be sharing at the conference." data-reveal style="--d:3">
      <span class="portrait" aria-hidden="true"></span>
      <span class="speaker-name">Speaker Name</span>
      <span class="mono-label">Title / Affiliation</span>
    </button>
  </div>
</section>
```
```html
<dialog class="dialog" id="speaker-dialog" aria-labelledby="speaker-dialog-name">
  <header class="card-head">
    <span class="mono-label">Speaker</span>
    <button class="dialog-close" type="button" data-dialog-close aria-label="Close">✕</button>
  </header>
  <div class="card-body">
    <h3 id="speaker-dialog-name" data-dialog-name>Speaker Name</h3>
    <p class="mono-label" data-dialog-role></p>
    <p data-dialog-bio></p>
  </div>
</dialog>
```

- [ ] **Step 4: Append to `css/components.css` (dialog)**

```css
/* ===== Dialog ===== */
.dialog {
  width: min(480px, 92vw);
  margin: auto; padding: 0;
  border: 1px solid var(--line); border-radius: var(--radius);
  background: var(--paper); color: var(--ink);
}
.dialog::backdrop { background: rgba(11, 47, 44, 0.55); backdrop-filter: blur(4px); }
.dialog-close { border: 0; background: transparent; font-size: 1rem; line-height: 1; color: var(--ink-soft); }
.dialog-close:hover { color: var(--ink); }
```

- [ ] **Step 5: Append to `css/sections.css` (speakers)**

```css
/* ===== Speakers ===== */
.speaker-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }
.speaker {
  display: grid; gap: 0.6rem; padding: 1rem; text-align: left;
  transition: transform 0.3s var(--ease), border-color 0.3s;
}
.speaker:hover { transform: translateY(-4px); border-color: var(--gold); }
.portrait {
  position: relative; overflow: hidden; width: 100%; aspect-ratio: 4 / 5;
  border: 1px solid var(--line); border-radius: 999px 999px 8px 8px;
  background: var(--paper-2);
}
.portrait::after {
  content: ''; position: absolute; inset: 0; background: var(--gold); opacity: 0.35;
  -webkit-mask: url(../assets/star.svg) center / 120px 120px;
          mask: url(../assets/star.svg) center / 120px 120px;
}
.speaker-name { font-size: 1.05rem; font-weight: 500; }
```

- [ ] **Step 6: Verify**

Reload and scroll to Speakers. Expected: four arch-shaped portrait cards with a gold star tint; hover lifts a card; clicking one opens a centred dialog with the name, role and bio; the ✕, a backdrop click and Esc all close it; focus returns to the card.

- [ ] **Step 7: Commit**

```bash
git add index.html css js/dialog.js js/main.js
git commit -m "Add speakers grid with bio dialog

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- index.html css js/dialog.js js/main.js
```

---

### Task 7: Tickets, FAQ and footer

**Files:**
- Modify: `css/components.css`, `css/sections.css`, `index.html` (replace `<!-- @tickets -->`, `<!-- @faq -->`, `<!-- @footer -->`)

**Interfaces:**
- Consumes: `.card`, `.btn`, `data-ticket-link` (wired in Task 1 `main.js`), `data-reveal`.
- Produces: `.tiers`, `.tier`, `.tier-featured`, `.faq-item`, `.footer`.

- [ ] **Step 1: Replace `<!-- @tickets -->`, `<!-- @faq -->` and `<!-- @footer -->` in `index.html`**

```html
<section class="section" id="tickets">
  <header class="section-head" data-reveal>
    <p class="mono-label">Tickets</p>
    <h2>Reserve your seat</h2>
    <p class="lede">Seats are limited. Registration happens on our Typeform.</p>
  </header>
  <div class="tiers">
    <article class="card tier" data-reveal>
      <header class="card-head"><span class="mono-label">General</span><span class="mono-label">TBD</span></header>
      <div class="card-body">
        <p class="price">$—</p>
        <ul class="tier-list"><li>Full-day access</li><li>Lectures &amp; panels</li><li>Bazaar entry</li></ul>
        <a class="btn btn-line" href="#tickets" data-ticket-link>Register</a>
      </div>
    </article>
    <article class="card tier tier-featured" data-reveal style="--d:1">
      <header class="card-head"><span class="mono-label">Student</span><span class="mono-label">TBD</span></header>
      <div class="card-body">
        <p class="price">$—</p>
        <ul class="tier-list"><li>Full-day access</li><li>Lectures &amp; panels</li><li>Bazaar entry</li></ul>
        <a class="btn btn-solid" href="#tickets" data-ticket-link>Register</a>
      </div>
    </article>
    <article class="card tier" data-reveal style="--d:2">
      <header class="card-head"><span class="mono-label">Supporter</span><span class="mono-label">TBD</span></header>
      <div class="card-body">
        <p class="price">$—</p>
        <ul class="tier-list"><li>Everything in General</li><li>Reserved seating</li><li>Supporter recognition</li></ul>
        <a class="btn btn-line" href="#tickets" data-ticket-link>Register</a>
      </div>
    </article>
  </div>
</section>
```
```html
<section class="section" id="faq">
  <header class="section-head" data-reveal>
    <p class="mono-label">FAQ</p>
    <h2>Common questions</h2>
  </header>
  <div class="faq-list" data-reveal>
    <details class="faq-item"><summary>Is this event free?<span class="faq-icon" aria-hidden="true"></span></summary><div class="faq-body"><p>Placeholder answer about ticket pricing.</p></div></details>
    <details class="faq-item"><summary>Is there parking available?<span class="faq-icon" aria-hidden="true"></span></summary><div class="faq-body"><p>Placeholder answer about parking and directions.</p></div></details>
    <details class="faq-item"><summary>Will food be provided?<span class="faq-icon" aria-hidden="true"></span></summary><div class="faq-body"><p>Placeholder answer about food and refreshments.</p></div></details>
    <details class="faq-item"><summary>Who can attend?<span class="faq-icon" aria-hidden="true"></span></summary><div class="faq-body"><p>Placeholder answer about who the event is open to.</p></div></details>
  </div>
</section>
```
```html
<footer class="footer">
  <div class="footer-inner">
    <span class="mono-label">Made by MSA at UC San Diego</span>
    <nav class="footer-links" aria-label="Footer"><a href="#">Instagram</a><a href="#">Contact</a></nav>
    <span class="mono-label">© 2026 Tarbiyyah Conference</span>
  </div>
</footer>
```

- [ ] **Step 2: Append to `css/components.css` (faq)**

```css
/* ===== FAQ: native <details>, opening animates ===== */
.faq-list { max-width: 720px; margin-inline: auto; border-top: 1px solid var(--line); }
.faq-item { border-bottom: 1px solid var(--line); }
.faq-item summary {
  display: flex; justify-content: space-between; align-items: center; gap: 1rem;
  padding: 1.15rem 0; cursor: pointer; list-style: none; font-weight: 500;
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-icon { position: relative; flex: none; width: 14px; height: 14px; transition: transform 0.3s var(--ease); }
.faq-icon::before, .faq-icon::after { content: ''; position: absolute; background: var(--gold); }
.faq-icon::before { left: 0; right: 0; top: 6px; height: 1px; }
.faq-icon::after { top: 0; bottom: 0; left: 6px; width: 1px; }
.faq-item[open] .faq-icon { transform: rotate(45deg); }
.faq-body { padding-bottom: 1.15rem; }
.faq-body p { font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.7; color: var(--ink-soft); }
.faq-item[open] .faq-body { animation: faq-in 0.35s var(--ease); }
@keyframes faq-in { from { opacity: 0; transform: translateY(-6px); } }
```

- [ ] **Step 3: Append to `css/sections.css` (tickets, footer)**

```css
/* ===== Tickets ===== */
.lede { max-width: 46ch; color: var(--ink-soft); }
.tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; align-items: stretch; }
.tier-featured { border-color: var(--gold); }
.price { font-family: var(--font-sans) !important; font-size: 2rem !important; color: var(--ink) !important; letter-spacing: -0.02em; }
.tier-list { display: grid; gap: 0.4rem; list-style: none; margin-bottom: 0.75rem; font-family: var(--font-mono); font-size: 0.82rem; color: var(--ink-soft); }
.tier-list li::before { content: '+ '; color: var(--gold); }

/* ===== Footer ===== */
.footer { border-top: 1px solid var(--line); padding: 2rem 1rem; }
.footer-inner {
  width: var(--frame); margin-inline: auto;
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;
}
.footer-links { display: flex; gap: 1.5rem; }
.footer-links a {
  font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.14em;
  text-transform: uppercase; text-decoration: none; color: var(--ink-soft);
}
.footer-links a:hover { color: var(--ink); }
```

- [ ] **Step 4: Verify**

Reload and scroll to the end. Expected: three ticket cards (middle one gold-bordered with a solid button); every Register button opens the Typeform URL in a new tab; FAQ items open with a small slide/fade and the plus rotates to ×; footer sits at the bottom with mono text. Toggle dark mode and re-check contrast.

- [ ] **Step 5: Commit**

```bash
git add index.html css
git commit -m "Add tickets, FAQ and footer

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- index.html css
```

---

### Task 8: README, cleanup and full verification

**Files:**
- Create: `README.md`
- Modify: fixes found during verification only

**Interfaces:**
- Consumes: everything above. Produces: nothing new.

- [ ] **Step 1: Write `README.md`**

```markdown
# Tarbiyyah Conference site

Static site — plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run
    python3 -m http.server 8765
Open http://localhost:8765 (ES modules need http, not file://).

## Edit
- Event date, date text, venue, ticket link: `js/config.js`
- Page copy: `index.html`
- Colours and fonts: `css/tokens.css`
- Layout of each section: `css/sections.css`; shared pieces (nav, buttons, cards): `css/components.css`

## Structure
    index.html      the page
    css/            tokens → base → components → sections
    js/             one small module per behaviour; main.js wires them up
    tests/          `node --test tests/` runs the unit tests for js/utils.js
    assets/         logo and the star-lattice tile
```

- [ ] **Step 2: Run the unit tests**

Run: `node --test tests/`
Expected: 4 tests pass, 0 fail.

- [ ] **Step 3: Full manual verification (Testing section of the spec)**

Serve the site and check each item; fix anything that fails, re-running the check:
- 1440px and 390px wide, light and dark: no horizontal scroll, nothing overlapping, hero content inside the arch, nav readable.
- Keyboard: Tab reaches skip link, nav, toggle, tickets, tabs (arrows work), speaker cards, FAQ summaries; every focus ring is visible.
- Reduced motion emulated: no drift, skyline drawn, stats final numbers, content visible.
- Console: no errors or warnings on load, on theme toggle, on opening a speaker dialog.
- Ticket buttons (nav, hero, HUD, tiers) all open the configured URL in a new tab.
- Theme choice persists across reload.
- No-JS (`classList.remove('js')`): every section readable, tabs replaced by stacked days.

- [ ] **Step 4: Commit**

```bash
git add README.md index.html css js
git commit -m "Add README and final verification fixes

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -- README.md index.html css js
```
