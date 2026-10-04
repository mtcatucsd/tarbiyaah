import Image from "next/image";

// Gallery as a Framer-style Ticker: one row of last year's photos in arch-topped frames, gliding sideways in a
// seamless loop (paused on hover, faded at both edges). Kept short so people pass it quickly on the way to tickets.
// The set is repeated three times and the track moves by one set, so the loop never shows a gap on wide screens.
// Every photo is shown whole: the row has one fixed height and each card takes its photo's own proportions,
// so nothing is cropped. With reduced motion the row stays still and can be swiped sideways instead.
const photos = [
  { src: "gallery-stage", w: 960, h: 640, alt: "A speaker on stage beneath The Art of Adab slide, facing a full audience" },
  { src: "gallery-speakers", w: 960, h: 640, alt: "Three of last year's speakers smiling together in the lobby" },
  { src: "gallery-booth", w: 960, h: 640, alt: "Attendees talking with exhibitors at a community booth" },
  { src: "gallery-panel", w: 960, h: 640, alt: "Two speakers seated at a table on stage for a panel" },
  { src: "gallery-session", w: 960, h: 640, alt: "A student at the lectern beneath the Session 1 slide" },
];

export function Gallery() {
  return (
    <section id="gallery" className="grid gap-4 py-4 md:gap-6 md:py-8" aria-label="Photos from last year's conference">
      <p data-focus="" className="qe-lead-sm px-5 text-center">From last year&apos;s conference, The Art of Adab.</p>
      <div className="ticker">
        <ul className="ticker-track">
          {[0, 1, 2].flatMap((copy) =>
            photos.map((p, i) => (
              <li key={`${copy}-${p.src}`} className="ticker-card" aria-hidden={copy > 0 ? "true" : undefined}>
                <Image
                  src={`/photos/${p.src}.webp`}
                  alt={copy > 0 ? "" : p.alt}
                  width={p.w}
                  height={p.h}
                  sizes="(max-width: 640px) 70vw, 420px"
                  className="block h-full w-auto max-w-none"
                  loading={copy === 0 && i < 4 ? "eager" : "lazy"}
                />
              </li>
            )),
          )}
        </ul>
      </div>
    </section>
  );
}
