# tarbiyaah

Tarbiyyah Conference 2026 website, by MSA at UC San Diego. Sunday, November 1, 2026, 12 PM to 8 PM, Student Services Center (MPR).

Next.js 16 (static export), React 19, Tailwind v4, shadcn/ui.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests (Vitest)
npm run build    # static export to ./out
```

Next.js 16 changes some APIs, so read the guides in `node_modules/next/dist/docs/` before changing framework behaviour (see `AGENTS.md`).

## Where things are

- `lib/site-config.ts`: event details and the Typeform ticket link (replace the placeholder URL).
- `data/`: sessions, speakers, sponsors and the venue.
- `components/site/`: page sections. `components/site/hero/`: the opening-night hero.
- `components/engraving/`: the engraved-drawing system (palms, undergrowth, Geisel outline, hatching).
- `public/photos/`: web-sized photos from the 2025 conference (originals in `docs/tarbiyaah-conference-2025-photos/`).
- `public/art/`: lantern, olive branch, MSA logo, and the Geisel photo (Wikimedia Commons, CC0).
- `scripts/gen-title.mjs`: regenerates the hero title outlines from Pinyon Script (needs `scripts/PinyonScript.ttf`, not committed).

## Credits

Geisel Library photo: "Geisel Library on Clear Day" by Gankbank789 on Wikimedia Commons, CC0.
