"use client";
import { useRef, useState } from "react";
import type { GalleryPhoto } from "@/data/types";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { GalleryLightbox } from "@/components/site/gallery-lightbox";

// The gallery page's interactive part: the canvas, and the lightbox for whichever photo was opened.
export function GalleryView({ photos }: { photos: GalleryPhoto[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <GalleryGrid photos={photos} onOpen={(i, tile) => { opener.current = tile; setIndex(i); }} />
      <GalleryLightbox photos={photos} index={index} onIndex={setIndex} onClose={() => setIndex(null)} returnFocus={() => opener.current?.focus()} />
    </>
  );
}
