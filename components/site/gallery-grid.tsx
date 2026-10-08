"use client";
import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GalleryPhoto } from "@/data/types";
import { buildColumns, sizingFor, tilePosition, type Layout } from "@/lib/gallery-layout";
import { MOTION, arrowPush, clamp, decay, edgePush, isDragClick, releaseVelocity, wheelPixels } from "@/lib/gallery-motion";

// The gallery page's canvas, after Framer's Dynamic Gallery Grid: an endless plane you drag, throw, wheel or arrow
// around, on a layer that tilts with the motion and the pointer. Tiles are placed only by translate3d (see
// lib/gallery-layout.ts) and one rAF loop runs only while something moves. With reduced motion there is no inertia,
// tilt or parallax.
export function GalleryGrid({ photos, onOpen }: { photos: GalleryPhoto[]; onOpen: (index: number, tile: HTMLButtonElement) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const layoutRef = useRef<Layout | null>(null);
  const engine = useRef<{ paint: () => void; wake: () => void } | null>(null);
  const st = useRef({ x: 0, y: 0, vx: 0, vy: 0, drag: false, lastX: 0, lastY: 0, lastT: 0, moved: 0, aimX: 0, aimY: 0, ptrX: 0, ptrY: 0, tiltX: 0, tiltY: 0, edgeX: 0, edgeY: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const layout = useMemo(() => (size.w && size.h ? buildColumns(photos, size.w, size.h, sizingFor(size.w)) : null), [photos, size.w, size.h]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      setSize((s) => (Math.round(s.w) === Math.round(w) && Math.round(s.h) === Math.round(h) ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    layoutRef.current = layout;
    engine.current?.paint();
  }, [layout]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const s = st.current;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = 0;

    const paint = () => {
      const L = layoutRef.current;
      if (!L) return;
      const px = -s.ptrX * MOTION.parallax, py = -s.ptrY * MOTION.parallax;
      L.tiles.forEach((t, i) => {
        const node = tiles.current[i];
        if (!node) return;
        const p = tilePosition(t, L, s.x, s.y);
        node.style.transform = `translate3d(${p.x + L.gap / 2 + px}px, ${p.y + L.gap / 2 + py}px, 0)`;
      });
      if (layer.current) layer.current.style.transform = `rotateX(${s.tiltY}deg) rotateY(${s.tiltX}deg)`;
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const f = dt * 60;
      const reduced = still.matches;
      let moving = s.drag;
      if (s.drag) {
        if (performance.now() - s.lastT > 60) { s.vx *= 0.8 ** f; s.vy *= 0.8 ** f; }
      } else if (reduced) {
        s.vx = 0; s.vy = 0;
      } else {
        s.x += s.vx * dt; s.y += s.vy * dt;
        const k = decay(f);
        s.vx *= k; s.vy *= k;
        if (Math.abs(s.vx) < MOTION.stopBelow) s.vx = 0;
        if (Math.abs(s.vy) < MOTION.stopBelow) s.vy = 0;
        if (s.vx || s.vy) moving = true;
        if (s.edgeX || s.edgeY) { s.x += s.edgeX * MOTION.edgeSpeed * f; s.y += s.edgeY * MOTION.edgeSpeed * f; moving = true; }
      }
      const ease = 1 - 0.86 ** f;
      const ax = reduced ? 0 : s.aimX, ay = reduced ? 0 : s.aimY;
      s.ptrX += (ax - s.ptrX) * ease; s.ptrY += (ay - s.ptrY) * ease;
      const tx = reduced ? 0 : clamp(s.vx / 1400) * MOTION.tilt + s.ptrX * MOTION.tilt * 0.4;
      const ty = reduced ? 0 : clamp(-s.vy / 1400) * MOTION.tilt - s.ptrY * MOTION.tilt * 0.4;
      s.tiltX += (tx - s.tiltX) * ease; s.tiltY += (ty - s.tiltY) * ease;
      if (Math.abs(ax - s.ptrX) > 0.002 || Math.abs(ay - s.ptrY) > 0.002 || Math.abs(tx - s.tiltX) > 0.02 || Math.abs(ty - s.tiltY) > 0.02) moving = true;
      paint();
      if (moving) frame = requestAnimationFrame(tick);
      else last = 0;
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
    engine.current = { paint, wake };

    const drag = (e: PointerEvent) => {
      const now = performance.now();
      const dx = e.clientX - s.lastX, dy = e.clientY - s.lastY, dt = Math.max(1, now - s.lastT);
      s.x += dx; s.y += dy;
      s.moved += Math.abs(dx) + Math.abs(dy);
      s.vx = s.vx * 0.6 + (dx / dt) * 1000 * 0.4;
      s.vy = s.vy * 0.6 + (dy / dt) * 1000 * 0.4;
      s.lastX = e.clientX; s.lastY = e.clientY; s.lastT = now;
      wake();
    };
    const release = () => {
      s.drag = false;
      el.style.cursor = "";
      const rest = performance.now() - s.lastT;
      s.vx = releaseVelocity(s.vx, rest); s.vy = releaseVelocity(s.vy, rest);
      window.removeEventListener("pointermove", drag);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      wake();
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      Object.assign(s, { drag: true, moved: 0, vx: 0, vy: 0, edgeX: 0, edgeY: 0, lastX: e.clientX, lastY: e.clientY, lastT: performance.now() });
      el.style.cursor = "grabbing";
      window.addEventListener("pointermove", drag);
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
      wake();
    };
    const hover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      s.aimX = clamp((x / r.width) * 2 - 1); s.aimY = clamp((y / r.height) * 2 - 1);
      const edges = !s.drag && e.pointerType === "mouse";
      s.edgeX = edges ? edgePush(x, r.width) : 0;
      s.edgeY = edges ? edgePush(y, r.height) : 0;
      wake();
    };
    const leave = () => { s.aimX = 0; s.aimY = 0; s.edgeX = 0; s.edgeY = 0; wake(); };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const [dx, dy] = wheelPixels(e, el.clientHeight);
      if (still.matches) { s.x -= dx; s.y -= dy; paint(); return; }
      s.vx = clamp(s.vx - dx * 4, -MOTION.wheelMax, MOTION.wheelMax);
      s.vy = clamp(s.vy - dy * 4, -MOTION.wheelMax, MOTION.wheelMax);
      wake();
    };
    const key = (e: KeyboardEvent) => {
      const push = arrowPush(e.key);
      if (!push) return;
      e.preventDefault();
      if (still.matches) { s.x += push[0] * 160; s.y += push[1] * 160; paint(); return; }
      s.vx += push[0] * MOTION.keyPush; s.vy += push[1] * MOTION.keyPush;
      wake();
    };
    // A drag that ends on a tile must not open it.
    const click = (e: MouseEvent) => { if (isDragClick(e.detail, s.moved)) { e.preventDefault(); e.stopPropagation(); } };
    // Tabbing to a tile off screen (or under the header) pans it into view.
    const focus = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (t === el) return;
      const r = t.getBoundingClientRect(), v = el.getBoundingClientRect(), m = 24, top = 80;
      const dx = r.left < v.left + m ? v.left + m - r.left : r.right > v.right - m ? v.right - m - r.right : 0;
      const dy = r.top < v.top + top ? v.top + top - r.top : r.bottom > v.bottom - m ? v.bottom - m - r.bottom : 0;
      if (!dx && !dy) return;
      s.x += dx; s.y += dy; s.vx = 0; s.vy = 0;
      paint();
    };
    const noDrag = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", hover);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("keydown", key);
    el.addEventListener("click", click, true);
    el.addEventListener("focusin", focus);
    el.addEventListener("dragstart", noDrag);
    paint();
    return () => {
      cancelAnimationFrame(frame);
      engine.current = null;
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", hover);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("keydown", key);
      el.removeEventListener("click", click, true);
      el.removeEventListener("focusin", focus);
      el.removeEventListener("dragstart", noDrag);
      window.removeEventListener("pointermove", drag);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  return (
    <div ref={stage} className="ggrid" tabIndex={0} role="region" aria-label="Photo gallery. Drag, scroll or use the arrow keys to move around; select a photo to enlarge it.">
      <div ref={layer} className="ggrid-layer">
        {layout?.tiles.map((t, i) => {
          const p = photos[t.photo];
          // Tiles on screen at the start load right away (one of them is the page's largest paint); the rest lazily.
          const start = tilePosition(t, layout, 0, 0);
          const onScreen = start.x < size.w && start.x + layout.cellW > 0 && start.y < size.h && start.y + t.h > 0;
          return (
            <button
              key={`${layout.cols}-${i}`}
              ref={(n) => { tiles.current[i] = n; }}
              type="button"
              className="ggrid-tile"
              style={{ width: layout.tileW, height: t.h }}
              tabIndex={t.copy ? -1 : 0}
              aria-hidden={t.copy ? true : undefined}
              aria-label={`Enlarge: ${p.alt}`}
              onClick={(e) => onOpen(t.photo, e.currentTarget)}
            >
              <span className="ggrid-face">
                <Image src={`/photos/gallery/${p.id}-sm.webp`} alt="" width={p.w} height={p.h} sizes={`${layout.tileW}px`} loading={onScreen ? "eager" : "lazy"} draggable={false} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
