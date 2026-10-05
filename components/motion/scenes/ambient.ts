import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Scene } from "@/components/motion/scenes";

// The hero's reel and clouds and the lanterns' sway are CSS loops; pause them while their section is off screen.
export const ambient: Scene = () => {
  const els = [document.getElementById("top"), document.querySelector<HTMLElement>("[data-scene='lanterns']")].filter((e): e is HTMLElement => !!e);
  els.forEach((el) => ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onToggle: (self) => { el.toggleAttribute("data-offscreen", !self.isActive); } }));
  return () => els.forEach((el) => el.removeAttribute("data-offscreen"));
};
