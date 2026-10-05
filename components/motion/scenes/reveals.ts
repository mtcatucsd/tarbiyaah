import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { Scene } from "@/components/motion/scenes";
import { DUR, EASE, STAGGER, TEXT_START } from "@/components/motion/tokens";

// The page's text and engraving reveals, declared in markup with data-anim:
//   lines   – a heading or statement; on desktop its lines rise out of a mask, on phones it rises whole
//   rise    – a block that rises a little and fades in
//   stagger – a container whose children rise in turn
//   draw    – an engraving; gets data-in-view, and the stylesheet draws its strokes and fades in its hatching
// Each plays once as it reaches TEXT_START; arriving below that point plays it at once, so nothing stays hidden.
export const reveals: Scene = ({ desktop }) => {
  const once = (trigger: Element) => ({ trigger, start: TEXT_START, once: true });
  const rise = (targets: gsap.TweenTarget, trigger: Element, stagger = 0) =>
    gsap.from(targets, { y: desktop ? 24 : 12, autoAlpha: 0, duration: desktop ? DUR.block : DUR.text * 0.7, ease: EASE.settle, stagger, scrollTrigger: once(trigger) });

  gsap.utils.toArray<HTMLElement>("[data-anim='lines']").forEach((el) => {
    if (!desktop) return void rise(el, el);
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line", // the mask wrapper gets "split-line-mask" (see globals.css)
      autoSplit: true, // re-splits when fonts load or the width changes, keeping the animation's progress
      onSplit: (self) =>
        gsap.from(self.lines, { yPercent: 110, duration: DUR.text, ease: EASE.settle, stagger: STAGGER, scrollTrigger: once(el) }),
    });
  });

  gsap.utils.toArray<HTMLElement>("[data-anim='rise']").forEach((el) => rise(el, el));
  gsap.utils.toArray<HTMLElement>("[data-anim='stagger']").forEach((el) => rise(el.children, el, desktop ? STAGGER : STAGGER / 2));

  const drawn = gsap.utils.toArray<HTMLElement>("[data-anim='draw']");
  drawn.forEach((el) => {
    ScrollTrigger.create({ ...once(el), onEnter: () => { el.dataset.inView = "true"; } });
  });
  return () => drawn.forEach((el) => { delete el.dataset.inView; });
};
