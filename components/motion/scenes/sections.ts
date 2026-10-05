import gsap from "gsap";
import type { Scene } from "@/components/motion/scenes";
import { DUR, EASE, SCRUB, STAGGER, TEXT_START } from "@/components/motion/tokens";

const one = (sel: string) => document.querySelector<HTMLElement>(sel);
const all = (sel: string, root?: Element | null) => gsap.utils.toArray<HTMLElement>(sel, root ?? document);
const scrubbed = (trigger: Element, start: string, end: string) => ({ trigger, start, end, scrub: SCRUB });

// The middle of the page. On desktop each section's depth follows the scroll and begins while the previous one is
// leaving: the palm grows up out of the ground, the postcard and map meet in the middle, the cord draws across as the
// lanterns lower, speakers rise at different speeds, FAQ rows wipe in and the carousel glides in from the right.
// Phones get the lighter version: each of these simply rises and fades in once.
export const sections: Scene = ({ desktop }) => {
  const palm = one("[data-scene='palm']");
  const card = one("[data-scene='venue-postcard']");
  const map = one("[data-scene='venue-map']");
  const band = one("[data-scene='lanterns']");
  const speakers = one("[data-scene='speakers']");
  const faq = one("[data-scene='faq']");
  const row = one("[data-scene='gallery'] .pcar");

  if (!desktop) {
    const riseOnce = (targets: gsap.TweenTarget, trigger: Element, stagger = 0) =>
      gsap.from(targets, { y: 12, autoAlpha: 0, duration: DUR.text * 0.7, ease: EASE.settle, stagger, scrollTrigger: { trigger, start: TEXT_START, once: true } });
    // (not the postcard: it already draws itself, and fading its large engraving as well costs a dropped frame)
    for (const el of [palm, map, band, faq]) if (el) riseOnce(el, el);
    if (speakers) riseOnce(speakers.children, speakers, STAGGER / 2);
    return;
  }

  if (palm) gsap.fromTo(palm, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: EASE.scrub, scrollTrigger: scrubbed(palm, "top 95%", "top 55%") });

  if (card) gsap.from(card, { x: -60, autoAlpha: 0, ease: EASE.scrub, scrollTrigger: scrubbed(card, "top bottom", "top 55%") });
  if (map) gsap.from(map, { x: 60, autoAlpha: 0, ease: EASE.scrub, scrollTrigger: scrubbed(map, "top bottom", "top 55%") });

  if (band) {
    const cord = band.querySelector(".lantern-cordline");
    if (cord) gsap.fromTo(cord, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: EASE.scrub, scrollTrigger: scrubbed(band, "top bottom", "top 50%") });
    gsap.from(all(".lantern-drop", band), { y: -90, autoAlpha: 0, ease: EASE.scrub, stagger: 0.06, scrollTrigger: scrubbed(band, "top 95%", "top 35%") });
  }

  if (speakers) {
    all(":scope > li", speakers).forEach((li, i) => {
      gsap.from(li, { y: 90 + (i % 4) * 30, autoAlpha: 0, ease: EASE.scrub, scrollTrigger: scrubbed(speakers, "top bottom", "top 40%") });
    });
  }

  if (faq) {
    gsap.fromTo(all("[data-slot='accordion-item']", faq), { clipPath: "inset(0% 100% 0% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", duration: DUR.block, ease: EASE.main, stagger: STAGGER, clearProps: "clipPath",
      scrollTrigger: { trigger: faq, start: TEXT_START, once: true },
    });
  }

  const gallery = one("[data-scene='gallery']");
  if (gallery && row) gsap.from(row, { x: "25vw", ease: EASE.scrub, scrollTrigger: scrubbed(gallery, "top bottom", "top 40%") });
};
