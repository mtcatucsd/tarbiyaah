"use client";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";

type Props = {
  as?: ElementType;
  delay?: number;      // stagger step (each step = 90ms for fades, 250ms for strokes)
  fade?: boolean;      // false = only set data-in-view (used by SVG stroke drawing)
  className?: string;
  children?: ReactNode;
};

export function Reveal({ as: Tag = "div", delay = 0, fade = true, className, children }: Props) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      data-reveal={fade ? "" : undefined}
      data-in-view={inView}
      style={{ "--d": delay } as CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  );
}
