import { ambient } from "@/components/motion/scenes/ambient";
import { closing } from "@/components/motion/scenes/closing";
import { hero } from "@/components/motion/scenes/hero";
import { reveals } from "@/components/motion/scenes/reveals";
import { sections } from "@/components/motion/scenes/sections";

// Every scene runs inside MotionRoot's matchMedia context, only when motion is allowed. Tweens, ScrollTriggers and
// SplitTexts a scene creates are reverted automatically; a scene returns a cleanup only for anything else
// (event listeners, classes, attributes). `desktop` is false on phones and tablets, which get a lighter version.
export type SceneEnv = { desktop: boolean };
export type Scene = (env: SceneEnv) => void | (() => void);

export const scenes: Scene[] = [hero, reveals, sections, closing, ambient];
