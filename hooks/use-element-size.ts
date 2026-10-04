"use client";
import { useEffect, useRef, useState } from "react";

// The element's rendered size in whole pixels, kept current with a ResizeObserver.
// Starts at `initial` (used for the server render and until the first measurement).
export function useElementSize<T extends Element>(initial: { width: number; height: number }) {
  const ref = useRef<T>(null);
  const [size, setSize] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const next = { width: Math.round(width), height: Math.round(height) };
      if (next.width > 0 && next.height > 0)
        setSize((s) => (s.width === next.width && s.height === next.height ? s : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, size };
}
