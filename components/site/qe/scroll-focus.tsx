"use client";
import { useEffect } from "react";

// Quiet Edition's scroll focus: text marked [data-focus] is blurred and faded while it is low on the
// screen, sharp through the middle, and softens again as it leaves the top. One listener for the page;
// only elements near the viewport (tracked by an IntersectionObserver) are measured, and styles are
// written only when the rounded blur changes.
export function ScrollFocus() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const near = new Set<HTMLElement>();
    const last = new WeakMap<HTMLElement, number>();
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of near) {
        const r = el.getBoundingClientRect();
        const c = r.top + r.height / 2;
        const below = Math.min(1, Math.max(0, (c - vh * 0.8) / (vh * 0.25)));
        const above = Math.min(1, Math.max(0, (vh * 0.1 - c) / (vh * 0.3)));
        const k = Math.round(Math.max(below, above) * 20) / 20; // 5% steps
        if (last.get(el) === k) continue;
        last.set(el, k);
        el.style.filter = k > 0 ? `blur(${(k * 10).toFixed(1)}px)` : "";
        el.style.opacity = k > 0 ? (1 - k * 0.55).toFixed(2) : "";
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) near.add(el);
        else near.delete(el);
      }
      schedule();
    }, { rootMargin: "50% 0px" });
    document.querySelectorAll<HTMLElement>("[data-focus]").forEach((el) => io.observe(el));

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
