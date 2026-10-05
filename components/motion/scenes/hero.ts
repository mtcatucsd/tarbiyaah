import gsap from "gsap";
import type { Scene } from "@/components/motion/scenes";
import { EASE, SCRUB } from "@/components/motion/tokens";

// Hero → theme: as the hero scrolls away its reel and title drift up and dim (their CSS reads --p). On desktop the
// copy also fades, the Geisel ground sinks more slowly (depth), and the theme section's content rises into place a
// little after its straight top edge. Phones keep only the drift.
export const hero: Scene = ({ desktop }) => {
  const top = document.getElementById("top");
  if (!top) return;
  const exit = { trigger: top, start: "top top", end: "bottom top", scrub: SCRUB };
  gsap.to(top.querySelectorAll(".night-title, .reel-row"), { "--p": 1, ease: EASE.scrub, scrollTrigger: exit });
  if (!desktop) return;

  gsap.to(top.querySelector(".hero-copy"), { y: -40, autoAlpha: 0.15, ease: EASE.scrub, scrollTrigger: exit });
  gsap.to(top.querySelector(".hero-ground"), { yPercent: 18, ease: EASE.scrub, scrollTrigger: exit });
  const curtain = document.querySelector<HTMLElement>("[data-curtain]");
  const inner = curtain?.querySelector(".curtain-inner");
  if (curtain && inner) {
    gsap.from(inner, { y: 120, ease: EASE.scrub, scrollTrigger: { trigger: curtain, start: "top bottom", end: "top 25%", scrub: SCRUB } });
  }
};
