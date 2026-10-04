import { plantSprite } from "@/components/engraving/plant-sprite";

// Cream-on-teal version of the plant sprite for the dark hero (/art/plants-night.svg).
export const dynamic = "force-static";

export function GET() {
  return new Response(plantSprite("#e9e2cc", "#0f3b3f", "#8fbfae"), { headers: { "Content-Type": "image/svg+xml" } });
}
