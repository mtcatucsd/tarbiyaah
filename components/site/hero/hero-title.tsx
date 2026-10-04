import type { CSSProperties } from "react";
import { TITLE_LINES } from "@/components/site/hero/title-paths";

// "Tarbiyyah Conference" as outlines of Pinyon Script (see scripts/gen-title.mjs). Each letter is its own path
// so the CSS can draw them on one after another, like handwriting, then fill them. One line on wide screens,
// two on phones. The visible text is in the heading's accessible name.
export function HeroTitle() {
  let n = 0;
  return (
    <h1 className="night-title">
      <span className="sr-only">Tarbiyyah Conference</span>
      <span className="night-title-tilt title-lines" aria-hidden="true">
        {TITLE_LINES.map((line, li) => (
          <svg key={li} className="title-svg" viewBox={line.box.join(" ")}>
            {line.glyphs.map((d, gi) => (
              <path key={gi} d={d} pathLength={1} className="glyph" style={{ "--i": n++ } as CSSProperties} />
            ))}
          </svg>
        ))}
      </span>
    </h1>
  );
}
