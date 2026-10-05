import { Countdown } from "@/components/site/hud/countdown";
import { SwingingLantern } from "@/components/engraving/lantern";
import { PLANT_SPRITE } from "@/components/engraving/plant";
import { siteConfig } from "@/lib/site-config";
import { PALM_BOX } from "@/components/engraving/flora";
import { cn } from "@/lib/utils";

type Box = { x: number; y: number; w: number; h: number };

/** A plant from the sprite (see components/engraving/plant.tsx) drawn as a standalone illustration filling its box. */
export function SymbolArt({ id, box, className }: { id: string; box: Box; className?: string }) {
  return (
    <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} className={cn("h-auto w-full", className)} aria-hidden="true">
      <use href={`${PLANT_SPRITE}#${id}`} x={box.x} y={box.y} width={box.w} height={box.h} />
    </svg>
  );
}

/** The crucial info, first: title and theme, date and place, a countdown, then one paragraph on the theme. */
export function Intro() {
  return (
    <section id="about" data-curtain="" className="qe-section">
      <div className="curtain-inner grid justify-items-center gap-6 md:gap-7">
        <div className="grid justify-items-center gap-3">
          <p className="mono-label">{siteConfig.name} {siteConfig.year}</p>
          <h2 data-anim="lines" className="qe-lead max-w-[16em]">Ibad al-Rahman: Servants of the Most Merciful</h2>
          <p data-anim="lines" className="font-display text-[clamp(1.25rem,2.4vw,1.75rem)] leading-snug text-ink">
            {siteConfig.dateText} · {siteConfig.timeText}
            <span className="block sm:inline"><span className="hidden sm:inline"> · </span>MPR, Student Services Center, UC San Diego</span>
          </p>
        </div>
        <div data-anim="draw" className="w-[min(420px,88vw)] text-ink-deep">
          <Countdown target={siteConfig.eventDate} />
        </div>
        <div data-scene="palm" className="w-[clamp(110px,12vw,160px)]">
          <SymbolArt id="palm-0" box={PALM_BOX} />
        </div>
        {/* Placeholder: replace with the co-heads' own description of the theme. */}
        <p data-anim="rise" className="qe-body max-w-[36em]">{siteConfig.themeDescription}</p>
      </div>
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
    <section className="grid justify-items-center py-2 md:py-4" aria-label="Lanterns">
      <div data-scene="lanterns" className="relative h-[160px] w-full overflow-hidden md:h-[200px]">
        <svg viewBox="0 0 1240 210" preserveAspectRatio="none" className="lantern-cordline absolute inset-0 size-full" aria-hidden="true">
          <path d={cord} className="etch etch-hair" />
        </svg>
        {xs.map((x, i) => (
          <div key={x} className="lantern-drop absolute inset-0">
            <SwingingLantern left={`${(x / 1240) * 100}%`} top={18} cord={8 + (i % 2) * 14} w={i % 2 ? 58 : 68} delay={-i * 1.7} />
          </div>
        ))}
      </div>
    </section>
  );
}
