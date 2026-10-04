import type { CSSProperties, ReactNode } from "react";
import { Countdown } from "@/components/site/hud/countdown";
import { SwingingLantern } from "@/components/engraving/lantern";
import { PLANT_SPRITE } from "@/components/engraving/plant";
import { Reveal } from "@/components/site/reveal";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/** A block holding one centred statement that comes into focus as it rises. */
export function Statement({ id, small, children }: { id?: string; small?: boolean; children: ReactNode }) {
  return (
    <section id={id} className="qe-block">
      <p data-focus="" className={small ? "qe-lead-sm" : "qe-lead"}>{children}</p>
    </section>
  );
}

/** Vignettes sit side by side on wide screens and stack on phones. */
export function VignetteRow({ children }: { children: ReactNode }) {
  return <section className="qe-vignette-row">{children}</section>;
}

/** An engraved illustration over a short paragraph. */
export function Vignette({ art, label, children }: { art: ReactNode; label?: string; children: ReactNode }) {
  return (
    <div className="qe-vignette-item" role="group" aria-label={label}>
      <Reveal className="w-[clamp(150px,16vw,240px)]">{art}</Reveal>
      <p data-focus="" className="qe-body">{children}</p>
    </div>
  );
}

type Box = { x: number; y: number; w: number; h: number };

/** A plant from the sprite (see components/engraving/plant.tsx) drawn as a standalone illustration filling its box. */
export function SymbolArt({ id, box, className }: { id: string; box: Box; className?: string }) {
  return (
    <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} className={cn("h-auto w-full", className)} aria-hidden="true">
      <use href={`${PLANT_SPRITE}#${id}`} x={box.x} y={box.y} width={box.w} height={box.h} />
    </svg>
  );
}

/** Date, time and place as one statement, with a quiet countdown underneath. */
export function Facts() {
  return (
    <section className="qe-block" aria-label="When and where">
      <div className="grid justify-items-center gap-6">
        <p data-focus="" className="qe-lead">
          {siteConfig.dateText}. Twelve to eight, in the Multipurpose Room at UC San Diego.
        </p>
        <div data-focus="" className="w-[min(420px,88vw)] text-ink-deep">
          <Countdown target={siteConfig.eventDate} />
        </div>
      </div>
    </section>
  );
}

const pillars = [
  { title: "Lectures", sub: "Knowledge", text: "Talks on the traits of Ibad al-Rahman, as revealed in the Quran." },
  { title: "Workshops", sub: "Practice", text: "Small rooms for turning what we learn into habits we keep." },
  { title: "Panels", sub: "Conversation", text: "Speakers in dialogue, and your questions in the room." },
  { title: "Community", sub: "Reflection", text: "A space for brothers and sisters to reflect together." },
];

/** Four staggered pillars, after Quiet Edition's four days. */
export function Pillars() {
  return (
    <section id="about" className="qe-section grid justify-items-center gap-8 pb-4 md:gap-10 md:pb-6">
      <p data-focus="" className="qe-lead-sm">
        The day is shaped by three formats and one purpose: to leave with knowledge you can act upon.
      </p>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 md:gap-7">
        {pillars.map((p, i) => (
          <li key={p.title} data-focus="" className={cn("grid max-w-[220px] content-start gap-2", i % 2 === 1 && "md:mt-10")}>
            <h3 className="font-display text-[clamp(1.5rem,2vw,1.9rem)] uppercase leading-none tracking-tight text-ink-deep">{p.title}</h3>
            <em className="font-display text-lg text-ink">{p.sub}</em>
            <p className="text-sm leading-snug text-ink-deep/85">{p.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A row of lanterns hanging from a swagged cord across the page, introducing the programme. */
export function LanternBand() {
  const xs = [140, 380, 620, 860, 1100];
  const sag = (x0: number, x1: number) => `Q${(x0 + x1) / 2} 70 ${x1} 18`;
  let cord = "M0 18";
  for (let i = 0; i < xs.length; i++) cord += sag(i ? xs[i - 1] : 0, xs[i]);
  cord += sag(xs.at(-1)!, 1240);
  return (
    <section className="grid justify-items-center gap-4 py-2 md:py-4" aria-label="Lanterns">
      <Reveal fade={false} className="relative h-[160px] w-full overflow-hidden md:h-[200px]">
        <svg viewBox="0 0 1240 210" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
          <path d={cord} pathLength={1} className="etch etch-hair draw" />
        </svg>
        <div className="hatch-in" style={{ "--d": 3 } as CSSProperties}>
          {xs.map((x, i) => (
            <SwingingLantern key={x} left={`${(x / 1240) * 100}%`} top={18} cord={8 + (i % 2) * 14} w={i % 2 ? 58 : 68} delay={-i * 1.7} />
          ))}
        </div>
      </Reveal>
      <p data-focus="" className="font-display text-xl text-ink-deep">One day, unhurried. Here is how it unfolds.</p>
    </section>
  );
}
