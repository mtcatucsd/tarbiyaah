"use client";
import { useEffect } from "react";

// Drives the opening-night hero's intro and pointer effects without re-rendering anything: it marks the hero ready
// (starting the intro) and writes the pointer position into CSS variables, which the stylesheet turns into masks
// and a tilt. The variables are set only on the few elements that read them (not on the section), so a pointer move
// never makes the browser re-evaluate the hundreds of nodes in the drawings. The pointer effects only run on devices
// with a real hover pointer. Scroll motion lives in the hero scene (components/motion/scenes/hero.ts).
export function HeroMotion() {
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    hero.dataset.ready = "true";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const all = (sel: string) => Array.from(hero.querySelectorAll<HTMLElement>(sel));
    const spotTargets = all(".night-tint, .night-shade");
    const tiltTargets = all(".night-title-tilt");
    const set = (els: HTMLElement[], name: string, value: string) => els.forEach((el) => el.style.setProperty(name, value));

    let frame = 0;
    let px: number | null = null, py = 0;
    const apply = () => {
      frame = 0;
      const r = hero.getBoundingClientRect();
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
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
