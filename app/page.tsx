import { Intro, LanternBand } from "@/components/site/qe/blocks";
import { Closing } from "@/components/site/closing";
import { Faq } from "@/components/site/faq";
import { FindUs } from "@/components/site/find-us";
import { Gallery } from "@/components/site/gallery";
import { Hero } from "@/components/site/hero/hero";
import { MotionRoot } from "@/components/motion/motion-root";
import { Nav } from "@/components/site/nav";
import { Schedule } from "@/components/site/schedule";
import { Speakers } from "@/components/site/speakers";
import { Sponsors } from "@/components/site/sponsors";

// The page follows Quiet Edition's format: the hero, the theme and date up front, the venue postcard,
// a lantern band, the schedule, speakers, a parallax photo carousel, sponsors, FAQ and a closing.
export default function Home() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Intro />
        <FindUs />
        <LanternBand />
        <Schedule />
        <Speakers />
        <Gallery />
        <Sponsors />
        <Faq />
        <Closing />
      </main>
      <MotionRoot />
    </>
  );
}
