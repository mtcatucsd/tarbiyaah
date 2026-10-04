import { Reveal } from "@/components/site/reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { siteConfig } from "@/lib/site-config";

const items = [
  {
    q: "When and where is it?",
    a: `${siteConfig.dateText}, ${siteConfig.timeText}, in the Multipurpose Room (MPR) of the Student Services Center at UC San Diego. It falls at the end of week 5.`,
  },
  {
    q: "How do I get a ticket?",
    a: "Use the Get tickets button. It opens our Typeform, where you register and pay. Early-bird pricing is available, and you can enter a promo code at checkout.",
  },
  {
    q: "Will I get a confirmation?",
    a: "Yes. A confirmation is sent to the email you register with.",
  },
  {
    q: "What will the day include?",
    a: "Lectures, workshops and panels, a space for brothers and sisters to reflect and leave with knowledge they can act upon. The full programme will be announced soon.",
  },
  {
    q: "Who do I contact with questions?",
    a: `${siteConfig.contact.role}: ${siteConfig.contact.name}.`,
  },
];

export function Faq() {
  return (
    <section id="faq" className="qe-section grid justify-items-center gap-12">
      <div className="grid justify-items-center gap-3">
        <p className="mono-label">FAQ</p>
        <h2 data-focus="" className="qe-lead">Common questions</h2>
      </div>
      <Reveal className="w-full max-w-[720px] text-left">
        <Accordion type="single" collapsible className="border-t border-ink/20">
          {items.map((it, i) => (
            <AccordionItem key={it.q} value={`item-${i}`} className="border-ink/20">
              <AccordionTrigger className="py-5 font-display text-2xl font-normal text-ink-deep hover:no-underline">{it.q}</AccordionTrigger>
              <AccordionContent className="text-base leading-7 text-ink-deep/85">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
