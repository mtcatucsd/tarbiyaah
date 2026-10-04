import type { ReactNode } from "react";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

export function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("mx-auto w-[var(--frame)] px-4 py-16 sm:px-8 md:py-28", className)}>
      {children}
    </section>
  );
}

export function SectionHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <Reveal className="mb-10 grid justify-items-center gap-3 text-center md:mb-14">
      <p className="mono-label">{eyebrow}</p>
      <h2 className="text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.1]">{title}</h2>
      {lede ? <p className="max-w-[46ch] text-muted-foreground">{lede}</p> : null}
    </Reveal>
  );
}
