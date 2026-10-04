import { VignetteRow, Facts, LanternBand, Pillars, Statement, SymbolArt, Vignette } from "@/components/site/qe/blocks";
import { ScrollFocus } from "@/components/site/qe/scroll-focus";
import { Closing } from "@/components/site/closing";
import { Faq } from "@/components/site/faq";
import { FindUs } from "@/components/site/find-us";
import { Gallery } from "@/components/site/gallery";
import { Hero } from "@/components/site/hero/hero";
import { Nav } from "@/components/site/nav";
import { Schedule } from "@/components/site/schedule";
import { Speakers } from "@/components/site/speakers";
import { Sponsors } from "@/components/site/sponsors";
import Image from "next/image";
import { PALM_BOX } from "@/components/engraving/flora";

// The page follows Quiet Edition's format: the hero, then centred statements, engraved vignettes,
// a postcard, staggered pillars, a lantern band, the schedule, speakers, a photo ticker and a closing.
export default function Home() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <Nav />
      <ScrollFocus />
      <main id="main">
        <Hero />
        <Statement>
          A day-long conference to nurture faith, strengthen character, and inspire students to embody Islam in their daily lives.
        </Statement>
        <VignetteRow>
          <Vignette label="Lectures, workshops and panels" art={<Image src="/art/olive-branch.webp" alt="" width={463} height={429} className="h-auto w-full" />}>
            Lectures, workshops and panels, creating a space for brothers and sisters to reflect, and to leave with knowledge they can act upon.
          </Vignette>
          <Vignette label="This year's theme" art={<SymbolArt id="palm-0" box={PALM_BOX} />}>
            This year&apos;s theme is Ibad al-Rahman, Servants of the Most Merciful: the traits of those who serve Allah SWT, as revealed in the Quran.
          </Vignette>
        </VignetteRow>
        <Facts />
        <FindUs />
        <Pillars />
        <LanternBand />
        <Schedule />
        <Speakers />
        <Gallery />
        <Sponsors />
        <Faq />
        <Closing />
      </main>
    </>
  );
}
