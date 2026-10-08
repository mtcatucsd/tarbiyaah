import type { Metadata } from "next";
import Link from "next/link";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { galleryPhotos } from "@/data/gallery";

export const metadata: Metadata = {
  title: "Gallery — Tarbiyyah Conference 2025, The Art of Adab",
  description: `All ${galleryPhotos.length} photos from last year's Tarbiyyah Conference, The Art of Adab, presented by MSA at UC San Diego.`,
};

// Every photo from last year on one endless canvas (components/site/gallery-grid.tsx), with only a back-to-home button
// floating over it. The button comes first so Tab reaches it before the canvas.
export default function GalleryPage() {
  return (
    <main className="gpage">
      <h1 className="sr-only">Photos from the 2025 Tarbiyyah Conference, The Art of Adab</h1>
      <Link href="/" className="qe-pill gpage-back">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
        Back to home
      </Link>
      <GalleryGrid photos={galleryPhotos} />
      <noscript>
        <ul className="gpage-fallback">
          {galleryPhotos.map((p) => (
            <li key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- no-JS fallback */}
              <img src={`/photos/gallery/${p.id}-sm.webp`} alt={p.alt} width={p.w} height={p.h} loading="lazy" />
            </li>
          ))}
        </ul>
      </noscript>
    </main>
  );
}
