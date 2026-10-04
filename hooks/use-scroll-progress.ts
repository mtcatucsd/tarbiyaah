"use client";
import { useEffect, useRef, useState } from "react";
import { progressThrough } from "@/lib/scroll-progress";

// 0..1: how far the viewport's middle has travelled through the element (1 if motion is reduced).
export function useScrollProgress<T extends Element>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const update = () => {
      frame = 0;
      const { top, height } = el.getBoundingClientRect();
      setProgress(reduced ? 1 : progressThrough(top, height, window.innerHeight));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    if (reduced) return () => cancelAnimationFrame(frame);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return { ref, progress };
}
