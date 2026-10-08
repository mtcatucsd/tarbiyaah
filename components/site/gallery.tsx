"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { carouselPicks, galleryPhotos } from "@/data/gallery";
import { parallaxShift } from "@/lib/format";

// Gallery as a parallax carousel (after Framer's Parallax Carousel): one row of tall cards that moves only when you
// swipe, scroll, drag or use the arrows. Each photo is twice its card's width and slides against the card's offset
// from the centre of the row, so it drifts inside its frame. The work runs only while the row moves, and only on
// `transform`. With reduced motion the photos stay still at their focal point.
// `fx` (data/gallery.ts) is where the visible window sits across the photo's spare width (0 = left edge, 1 = right
// edge); it stays between 0.15 and 0.85 so the parallax never runs out of photo.
const photos = carouselPicks.map(({ id, fx }) => ({ ...galleryPhotos.find((p) => p.id === id)!, fx }));

const MAX_SHIFT = 0.15; // of a card's width

export function Gallery() {
  const row = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [ends, setEnds] = useState({ start: true, end: false });

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const view = el.getBoundingClientRect();
      const center = view.left + view.width / 2;
      if (!still.matches) {
        for (const card of el.children as HTMLCollectionOf<HTMLElement>) {
          const r = card.getBoundingClientRect();
          const img = card.querySelector("img");
          if (img) img.style.transform = `translate3d(${parallaxShift(r.left + r.width / 2, center, view.width, r.width * MAX_SHIFT)}px,0,0)`;
        }
      }
      setEnds({ start: el.scrollLeft < 4, end: el.scrollLeft > el.scrollWidth - el.clientWidth - 4 });
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    el.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = row.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (el && card) el.scrollBy({ left: dir * (card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0")), behavior: "smooth" });
  };

  // Mouse drag; touch and trackpads already scroll natively.
  const down = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.dataset.dragging = "";
  };
  const move = (e: PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.x) > 3) d.moved = true;
    e.currentTarget.scrollLeft = d.left - (e.clientX - d.x);
  };
  const up = (e: PointerEvent<HTMLUListElement>) => {
    if (!drag.current) return;
    drag.current = null;
    delete e.currentTarget.dataset.dragging; // snapping comes back on and settles the nearest card
  };

  const arrow = "grid size-11 place-items-center rounded-full border border-ink/30 text-ink-deep transition-colors outline-none hover:bg-ink-deep hover:text-paper focus-visible:ring-2 focus-visible:ring-ink-deep focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-35";
  return (
    <section id="gallery" data-scene="gallery" className="grid overflow-x-clip gap-4 py-4 md:gap-6 md:py-8" aria-label="Photos from last year's conference">
      <p data-anim="lines" className="qe-lead-sm px-5 text-center">From last year&apos;s conference, The Art of Adab.</p>
      <ul ref={row} className="pcar" tabIndex={0} aria-label="Photo carousel" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {photos.map((p, i) => (
          <li key={p.id} className="pcar-card" style={{ "--fx": p.fx } as CSSProperties}>
            <Image
              src={`/photos/gallery/${p.id}.webp`}
              alt={p.alt}
              width={p.w}
              height={p.h}
              sizes="(max-width: 640px) 140vw, 690px"
              draggable={false}
              className="pcar-img"
              loading={i < 3 ? "eager" : "lazy"}
            />
          </li>
        ))}
      </ul>
      <div className="flex justify-center gap-3">
        <button type="button" className={arrow} onClick={() => step(-1)} disabled={ends.start} aria-label="Previous photo">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
        </button>
        <button type="button" className={arrow} onClick={() => step(1)} disabled={ends.end} aria-label="Next photo">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
        </button>
      </div>
      <Link href="/gallery/" className="qe-pill justify-self-center">
        See all {galleryPhotos.length} photos
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </Link>
    </section>
  );
}
