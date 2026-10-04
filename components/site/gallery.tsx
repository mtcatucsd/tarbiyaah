import Image from "next/image";

// Gallery as a Framer-style Ticker: one row of last year's photos in arch-topped frames, gliding sideways in a
// seamless loop (paused on hover, faded at both edges). Kept short so people pass it quickly on the way to tickets.
// The set is repeated three times and the track moves by one set, so the loop never shows a gap on wide screens.
// With reduced motion the row stays still and can be swiped sideways instead.
const photos = [
  { src: "g-stage", pos: "50% 45%", alt: "A speaker on stage beneath The Art of Adab slide, facing a full audience" },
  { src: "g-speakers", pos: "50% 30%", alt: "Three of last year's speakers smiling together in the lobby" },
  { src: "g-booth", pos: "60% 50%", alt: "Attendees talking with exhibitors at a community booth" },
  { src: "g-panel", pos: "50% 62%", alt: "Two speakers seated at a table on stage for a panel" },
  { src: "g-food", pos: "50% 60%", alt: "Rows of food trays laid out for the meal" },
  { src: "g-session", pos: "50% 40%", alt: "A student at the lectern beneath the Session 1 slide" },
];

export function Gallery() {
  return (
    <section id="gallery" className="grid gap-8 py-16 md:py-20" aria-label="Photos from last year's conference">
      <p data-focus="" className="qe-lead-sm px-5 text-center">From last year&apos;s conference, The Art of Adab.</p>
      <div className="ticker">
        <ul className="ticker-track">
          {[0, 1, 2].flatMap((copy) =>
            photos.map((p, i) => (
              <li key={`${copy}-${p.src}`} className="ticker-card" aria-hidden={copy > 0 ? "true" : undefined}>
                <Image
                  src={`/photos/${p.src}.jpg`}
                  alt={copy > 0 ? "" : p.alt}
                  width={600}
                  height={800}
                  sizes="260px"
                  className="size-full object-cover"
                  style={{ objectPosition: p.pos }}
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
