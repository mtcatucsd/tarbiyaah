import { GeiselScene } from "@/components/site/hero/geisel-scene";
import { HeroMotion } from "@/components/site/hero/hero-motion";
import { HeroTitle } from "@/components/site/hero/hero-title";
import { PhotoReel } from "@/components/site/hero/photo-reel";
import { TicketButton } from "@/components/site/ticket-button";
import { siteConfig } from "@/lib/site-config";

// Opening night: a deep-teal scene in the spirit of last year's flyer. Layers, back to front: gradient and clouds,
// the 2025 photo reel, a duotone tint (the cursor reveals true colour), a scrim and vignette, then the copy and
// the same palms-and-undergrowth scene as the footer, with the colour-matched Geisel photo in the middle. HeroMotion adds the pointer, scroll and intro behaviour.
export function Hero() {
  return (
    <section
      id="top"
      className="night hero-vars relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 text-center"
      style={{ paddingTop: "var(--hero-top)", paddingBottom: "calc(var(--sky-h) + 1rem)" }}
    >
      <div className="night-layer" aria-hidden="true">
        <div className="night-cloud" /><div className="night-cloud" /><div className="night-cloud" />
      </div>
      <PhotoReel />
      <div className="night-layer night-tint" aria-hidden="true" />
      <div className="night-layer night-shade" aria-hidden="true" />
      <div className="night-layer night-scrim" aria-hidden="true" />
      <div className="night-layer night-vignette" aria-hidden="true" />
      <div className="night-layer night-grain" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-[1500px] flex-col items-center gap-[clamp(0.6rem,2.4vh,1.6rem)]">
        <p className="intro mono-label !text-[#e9e2cc] font-medium !tracking-[0.34em]" style={{ "--at": "0.35s" } as React.CSSProperties}>
          MSA at UC San Diego presents
        </p>
        <HeroTitle />
        <p className="intro text-[clamp(1.05rem,2vw,1.5rem)] text-[#f4efe3]/90" style={{ "--at": "2.3s" } as React.CSSProperties}>
          {siteConfig.tagline}
        </p>
        <p className="intro mono-label !text-[#e9e2cc]/80" style={{ "--at": "2.5s" } as React.CSSProperties}>
          <span className="block sm:inline">{siteConfig.dateText}</span>
          <span className="hidden sm:inline"> · </span>
          <span className="block sm:inline">{siteConfig.timeText} · MPR</span>
        </p>
        <div className="intro" style={{ "--at": "2.7s" } as React.CSSProperties}>
          <TicketButton className="!bg-gold-bright !text-[#10343a] hover:!bg-[#f4efe3]">Get tickets</TicketButton>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]" aria-hidden="true">
        <GeiselScene night photo />
      </div>
      <HeroMotion />
    </section>
  );
}
