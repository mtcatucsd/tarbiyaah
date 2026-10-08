"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { GalleryPhoto } from "@/data/types";

// Full-size viewer for the gallery page, styled after Framer's: dark blurred backdrop, a 01 / 50 counter, arrows,
// ←/→ keys and horizontal swipe. Radix gives Esc, the focus trap and the scroll lock. Clicking the dark area closes it.
export function GalleryLightbox({ photos, index, onIndex, onClose, returnFocus }: {
  photos: GalleryPhoto[]; index: number | null; onIndex: (i: number) => void; onClose: () => void; returnFocus: () => void;
}) {
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const n = photos.length;
  const go = (d: 1 | -1) => { if (index !== null) onIndex((index + d + n) % n); };

  // Warm the neighbours so arrows feel instant.
  useEffect(() => {
    if (index === null) return;
    for (const d of [1, -1]) new window.Image().src = `/photos/gallery/${photos[(index + d + n) % n].id}.webp`;
  }, [index, photos, n]);

  const p = index === null ? null : photos[index];
  const pad = (i: number) => String(i).padStart(2, "0");
  const arrow = (d: string) => <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={d} /></svg>;
  return (
    <DialogPrimitive.Root open={p !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="glb-backdrop" />
        <DialogPrimitive.Content
          className="glb"
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => { e.preventDefault(); returnFocus(); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); go(e.key === "ArrowRight" ? 1 : -1); }
          }}
          onPointerDown={(e) => { swipe.current = { x: e.clientX, y: e.clientY }; swiped.current = false; }}
          onPointerUp={(e) => {
            const s = swipe.current;
            swipe.current = null;
            if (!s) return;
            const dx = e.clientX - s.x;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y)) { swiped.current = true; go(dx < 0 ? 1 : -1); }
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !swiped.current) onClose(); }}
        >
          {p && index !== null && (
            <>
              <DialogPrimitive.Title className="sr-only">Photo {index + 1} of {n}</DialogPrimitive.Title>
              <p className="glb-count" aria-hidden="true">{pad(index + 1)} / {pad(n)}</p>
              <DialogPrimitive.Close className="glb-btn glb-close" aria-label="Close">{arrow("M6 6l12 12M18 6L6 18")}</DialogPrimitive.Close>
              <figure key={p.id} className="glb-media">
                <Image src={`/photos/gallery/${p.id}.webp`} alt={p.alt} width={p.w} height={p.h} sizes="90vw" loading="eager" fetchPriority="high" draggable={false} />
                <figcaption className="sr-only">{p.alt}</figcaption>
              </figure>
              {n > 1 && (
                <>
                  <button type="button" className="glb-btn glb-prev" aria-label="Previous photo" onClick={() => go(-1)}>{arrow("M15 5l-7 7 7 7")}</button>
                  <button type="button" className="glb-btn glb-next" aria-label="Next photo" onClick={() => go(1)}>{arrow("M9 5l7 7-7 7")}</button>
                </>
              )}
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
