"use client";
import { useEffect } from "react";

// Drives the opening-night hero without re-rendering anything: it marks the hero ready (starting the intro),
// and writes pointer and scroll position into CSS variables, which the stylesheet turns into transforms and
// masks. The variables are set only on the few elements that read them (not on the section), so a scroll or
// pointer move never makes the browser re-evaluate the hundreds of nodes in the drawings. The pointer effects
// only run on devices with a real hover pointer.
export function HeroMotion() {
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    hero.dataset.ready = "true";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const all = (sel: string) => Array.from(hero.querySelectorAll<HTMLElement>(sel));
    const scrollTargets = all(".night-title, .reel-row");
    const spotTargets = all(".night-tint, .night-shade");
    const tiltTargets = all(".night-title-tilt");
    const set = (els: HTMLElement[], name: string, value: string) => els.forEach((el) => el.style.setProperty(name, value));

    let frame = 0;
    let px: number | null = null, py = 0;
    const apply = () => {
      frame = 0;
      const r = hero.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * 0.8)));
      set(scrollTargets, "--p", p.toFixed(3));
      if (px !== null) {
        set(spotTargets, "--mx", `${px - r.left}px`);
        set(spotTargets, "--my", `${py - r.top}px`);
        set(tiltTargets, "--tx", String(((px - r.left) / r.width - 0.5) * 2));
        set(tiltTargets, "--ty", String(((py - r.top) / r.height - 0.5) * 2));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(apply); };
    const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; schedule(); };
    const onLeave = () => {
      px = null;
      set(spotTargets, "--mx", "-999px");
      set(spotTargets, "--my", "-999px");
      set(tiltTargets, "--tx", "0");
      set(tiltTargets, "--ty", "0");
    };

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) {
      hero.addEventListener("pointermove", onMove, { passive: true });
      hero.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
