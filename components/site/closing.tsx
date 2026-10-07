import Image from "next/image";
import { GeiselScene } from "@/components/site/hero/geisel-scene";
import { Marquee } from "@/components/site/marquee";
import { ticketLink } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

// Quiet Edition's closing, merged with tickets and the footer: a statement and the tickets pill over the engraved
// Geisel landscape, which stands right on the band of ink that holds the fine print and links.
export function Closing() {
  const [abdullah, areeba] = siteConfig.contacts;
  const icon = "grid size-10 place-items-center rounded-full border border-paper/30 transition-colors hover:bg-paper/15";
  return (
    <section id="tickets" className="relative overflow-hidden">
      <Marquee />
      <div className="qe-section grid justify-items-center gap-6 pb-10">
        <p data-anim="lines" className="qe-lead-sm max-w-[18em]">
          Seats are limited. Reserve yours, and bring a friend who could use the reminder.
        </p>
        <p className="qe-body">Registration happens on Luma. Early-bird pricing while it lasts.</p>
        <a className="qe-pill" {...ticketLink(siteConfig.ticketUrl)}>Get tickets</a>
      </div>

      {/* Pulled down by the strip below the drawing's ground line, so the buildings stand on the footer. */}
      <div data-scene="closing-scene" className="hero-vars relative z-0 mb-[calc(var(--ground-gap)*-1)]" aria-hidden="true">
        <GeiselScene />
      </div>

      <footer className="relative z-10 bg-ink-deep px-5 pb-8 pt-9 text-paper">
        <div className="grid justify-items-center gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center md:px-2">
          <nav aria-label="Elsewhere" className="flex items-center gap-3 md:justify-self-start">
            <a href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className={icon} aria-label="MSA UCSD on Instagram">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href={siteConfig.websiteUrl} target="_blank" rel="noopener noreferrer" className={icon} aria-label="MSA at UC San Diego website">
              <Image src="/msalogo.jpg" alt="" width={28} height={28} className="size-7 rounded-full object-cover" />
            </a>
          </nav>
          <p className="font-script text-[2.1rem] leading-none md:text-[2.4rem]">Tarbiyyah Conference</p>
          <p className="text-sm text-paper/75 md:justify-self-end">© {siteConfig.year} MSA at UC San Diego</p>
        </div>
        <p className="mx-auto mt-7 max-w-[720px] text-center text-[0.8rem] leading-snug text-paper/75">
          Have a promo code? Enter it at checkout. A confirmation is sent to the email you register with.
          Questions about the day? Reach out to {abdullah.name} (
          <a className="underline underline-offset-2" href={`mailto:${abdullah.email}`}>{abdullah.email}</a>) or {areeba.name} (
          <a className="underline underline-offset-2" href={`mailto:${areeba.email}`}>{areeba.email}</a>).
        </p>
      </footer>
    </section>
  );
}
