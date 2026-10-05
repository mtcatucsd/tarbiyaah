"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { scenes } from "@/components/motion/scenes";
import { EASE, MAIN_EASE_CURVE, MEDIA } from "@/components/motion/tokens";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, CustomEase);
CustomEase.create(EASE.main, MAIN_EASE_CURVE);

// Arriving at /#section: the browser starts a smooth jump (html has scroll-behavior: smooth), which the scenes'
// refresh can cut short. Once that scroll ends, land exactly on the target, unless the visitor has started
// scrolling or clicked (a wheel, touch, key or pointer press cancels it). scrollIntoView honours
// scroll-padding-top, and Lenis follows native scroll.
function landOnHash() {
  const id = window.location.hash.length > 1 ? decodeURIComponent(window.location.hash.slice(1)) : "";
  const target = id ? document.getElementById(id) : null;
  if (!target) return () => {};
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const land = () => {
    stop();
    if (Math.abs(target.getBoundingClientRect().top - pad) > 4) target.scrollIntoView({ behavior: "instant", block: "start" });
  };
  const timer = window.setTimeout(land, 1500); // browsers without scrollend
  const stop = () => {
    window.clearTimeout(timer);
    window.removeEventListener("scrollend", land);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("pointerdown", stop);
    window.removeEventListener("keydown", stop);
  };
  window.addEventListener("scrollend", land);
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("pointerdown", stop, { passive: true });
  window.addEventListener("keydown", stop);
  return stop;
}

// The one clock for all scroll motion. On desktop Lenis smooths the wheel and is driven by GSAP's ticker, feeding
// ScrollTrigger, so every scene reads the same scroll position. `html.motion` marks that motion is on; the
// stylesheet only hides things (strokes to draw, hatching) under it, so without JS or with reduced motion the
// page is simply visible. Mount once, after the page content.
export function MotionRoot() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: MEDIA.motion, desktop: MEDIA.desktop }, (context) => {
      const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
      if (!motion) return;
      const html = document.documentElement;
      html.classList.add("motion");

      let lenis: Lenis | null = null;
      const tick = (time: number) => lenis?.raf(time * 1000);
      if (desktop) {
        lenis = new Lenis({ autoRaf: false, anchors: true }); // anchors honour html's scroll-padding-top, as native scrolling does
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }

      const cleanups = scenes.map((scene) => scene({ desktop })).filter((c): c is () => void => typeof c === "function");
      ScrollTrigger.refresh();
      const stopLanding = landOnHash();

      return () => {
        stopLanding();
        cleanups.forEach((c) => c());
        html.classList.remove("motion");
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis?.destroy();
      };
    });
    return () => mm.revert();
  });
  return null;
}
