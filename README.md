# Tarbiyyah Conference 2026

Website for the **Tarbiyyah Conference**, presented by MSA at UC San Diego.
Sunday, November 1, 2026 · 12 PM – 8 PM · Multipurpose Room (MPR), Student Services Center.

A single-page static site: an opening-night hero, the day's schedule, speakers, venue map, last year's photos, FAQ and
a Get tickets call to action. The goal of the page is to get people to the ticket link quickly.

**Stack:** Next.js 16 (static export), React 19, Tailwind CSS v4, shadcn/ui (Radix). Tests with Vitest.
Next.js 16 changes some APIs, so read the guides in `node_modules/next/dist/docs/` before changing framework
behaviour (see `AGENTS.md`).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (Vitest)
npm run lint
npm run build      # static export to ./out
```

Requires Node 20 or newer.

## Deploy

`npm run build` writes a fully static site to `out/`. Upload that folder to any static host (Vercel, Netlify,
Cloudflare Pages, GitHub Pages, S3). It is built for the **root of a domain** (assets are referenced as `/art/...`,
`/photos/...`), so it will not work from a sub-path without changing `basePath` in `next.config.ts`.

Deploy size is roughly 2.6 MB: about 1 MB of images, 0.7 MB of JavaScript, 0.25 MB of fonts, the rest HTML.

## Update the content

| What | Where |
| --- | --- |
| Event date, time, venue text, **ticket link**, contact, social links | `lib/site-config.ts` (paste the Luma event link into `ticketUrl`; while it is empty the buttons scroll to the tickets section) |
| Schedule | `data/sessions.ts` |
| Speakers and bios | `data/speakers.ts` |
| Sponsors | `data/sponsors.ts` (add a `logo` path under `public/` when you have one) |
| Venue, directions, map | `data/venues.ts`, `lib/event-data.ts` |
| Wording of the page | `app/page.tsx` (statements), `components/site/` (sections) |
| FAQ | `components/site/faq.tsx` |

Event facts live in one place (`lib/site-config.ts`). A test checks them, so a typo in the date will fail `npm test`.

## Project layout

```
app/                    layout (fonts, no-JS fallbacks), page, global styles, plant sprite routes (/art/plants*.svg)
components/site/        page sections (hero, schedule, speakers, gallery, find-us, faq, closing, nav ...)
components/site/hero/   the opening-night hero: photo reel, handwritten title, Geisel scene, pointer/scroll motion
components/site/qe/     the big-text blocks, vignettes and the scroll-focus effect
components/engraving/   the engraved-drawing system (hatching, palms, undergrowth, Geisel outline), generated in code
components/ui/          shadcn/ui primitives
data/                   schedule, speakers, sponsors, venue
hooks/, lib/            small hooks and tested helpers
public/photos/          web photos from the 2025 conference (WebP)
public/art/             olive branch, lantern, MSA logo, Geisel photo (WebP)
scripts/                gen-title.mjs: regenerates the hero title outlines
tests/                  Vitest tests
```

## Images: keep the site light

- Use **WebP**. Resize before adding: hero reel photos about 1000 px wide, gallery photos about 960 px on the long
  side, quality about 72–75. Each should end up under about 70 KB.
- Keep the originals **outside the repo** (the 2025 originals were moved to `~/tarbiyaah-photos-2025`). Only web
  copies go in `public/`.
- The hero reel is `components/site/hero/photo-reel.tsx` and the gallery is `components/site/gallery.tsx`. Give each
  gallery photo descriptive `alt` text.

## Design notes

- **Look:** deep teal hero with cream type and a gold button, then cream paper with blue-green ink. Big Instrument
  Serif statements, Pinyon Script for the title, Geist and Geist Mono for small text.
- **Hero title:** written on letter by letter from outlines of Pinyon Script. If you change the title text or font, put
  the font file at `scripts/PinyonScript.ttf` (not committed; get it from Google Fonts) and run
  `node scripts/gen-title.mjs`, which rewrites `components/site/hero/title-paths.ts`.
- **Engravings** (palms, undergrowth, the Geisel outline in the venue postcard) are drawn by code in
  `components/engraving/`, so they stay crisp at any size and weigh almost nothing.
- **Motion:** everything animates with `transform` and `opacity` only. On phones the blur effects are replaced by
  cheaper fades, and with `prefers-reduced-motion` or without JavaScript everything is shown fully drawn.

## Credits

- Geisel Library photo: "Geisel Library on Clear Day" by Gankbank789, Wikimedia Commons, CC0.
- Conference photos: Tarbiyyah Conference 2025, MSA at UC San Diego.
- Olive branch and lantern artwork: downloaded illustrations, recoloured for this site. Check the licence terms of
  the original downloads (some free licences ask for attribution) and add credit here if required.
