import gsap from "gsap";
import type { Scene } from "@/components/motion/scenes";
import { EASE, SCRUB } from "@/components/motion/tokens";

// Into the footer: the marquee drifts one copy's width as it passes (reversing on the way up). On desktop the
// engraved Geisel and its palms then rise onto the footer band in layers, the building further than the planting
// beside it; phones skip the rise.
export const closing: Scene = ({ desktop }) => {
  const band = document.querySelector<HTMLElement>("[data-scene='marquee']");
  const track = band?.querySelector(".marquee-track");
  if (band && track) gsap.fromTo(track, { xPercent: 0 }, { xPercent: -25, ease: EASE.scrub, scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: SCRUB } });

  const scene = document.querySelector<HTMLElement>("[data-scene='closing-scene']");
  if (desktop && scene) {
    const rise = { trigger: scene, start: "top bottom", end: "bottom bottom", scrub: SCRUB };
    gsap.from(scene.querySelectorAll(".geisel-side"), { y: 60, ease: EASE.scrub, scrollTrigger: rise });
    gsap.from(scene.querySelectorAll(".geisel"), { y: 110, ease: EASE.scrub, scrollTrigger: rise });
  }
};
