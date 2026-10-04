import { plantSprite } from "@/components/engraving/plant-sprite";

// The engraved plants as one external SVG sprite (/art/plants.svg), prerendered at build time. Kept out of the
// page so their ~50 KB of path data is fetched once and cached, instead of being inlined into the HTML.
// Referenced with <use href="/art/plants.svg#palm-0">. Ink-deep #1f4f5c on paper #f4efe3.
export const dynamic = "force-static";

export function GET() {
  return new Response(plantSprite("#1f4f5c", "#f4efe3", "#307060"), { headers: { "Content-Type": "image/svg+xml" } });
}
