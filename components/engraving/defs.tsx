import { starTile } from "@/components/engraving/pattern";

// Shared hatching patterns, mounted once in the root layout and referenced by id (url(#hatch-mid)).
// Spacing is in the user units of whichever drawing uses them; drawings are laid out at roughly 1 unit = 1px.
const lines = (id: string, gap: number, angle: number, weight = 0.7) => (
  <pattern key={id} id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
    <line x1={gap / 2} y1="0" x2={gap / 2} y2={gap} strokeWidth={weight} />
  </pattern>
);

// Eight-fold star strapwork (see pattern.ts), drawn as hollow bands: a wide ink stroke with a
// narrower paper stroke on top. Two sizes: the larger for desktop, the smaller for phones.
const stars = (id: string, T: number, band: number) => {
  const d = starTile(T);
  return (
    <pattern key={id} id={id} width={T} height={T} patternUnits="userSpaceOnUse">
      <rect width={T} height={T} className="star-paper" />
      <path d={d} strokeWidth={band} strokeLinejoin="round" />
      <path d={d} strokeWidth={band * 0.42} strokeLinejoin="round" className="star-gap" />
    </pattern>
  );
};

// Cream-on-teal versions of the hatches (ids end in "-night") for the dark hero. Literal colours: patterns
// are styled where they are defined, so they cannot pick up the hero's CSS variables.
const CREAM = "#e9e2cc";
const linesNight = (id: string, gap: number, angle: number, weight: number) => (
  <pattern key={id} id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
    <line x1={gap / 2} y1="0" x2={gap / 2} y2={gap} stroke={CREAM} strokeWidth={weight} />
  </pattern>
);

export function EngravingDefs() {
  return (
    <svg aria-hidden="true" focusable="false" className="engraving-defs" width="0" height="0">
      <defs>
        {lines("hatch-light", 6, 45, 0.6)}
        {lines("hatch-mid", 4, 45, 0.7)}
        {lines("hatch-dense", 2.6, 45, 0.75)}
        {lines("hatch-h", 3.2, 90, 0.6)}
        <pattern id="crosshatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M2 0V4M0 2H4" strokeWidth="0.7" />
        </pattern>
        {linesNight("hatch-light-night", 6, 45, 0.6)}
        {linesNight("hatch-mid-night", 4, 45, 0.7)}
        {linesNight("hatch-dense-night", 2.6, 45, 0.75)}
        {linesNight("hatch-h-night", 3.2, 90, 0.6)}
        <pattern id="crosshatch-night" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M2 0V4M0 2H4" stroke={CREAM} strokeWidth="0.7" />
        </pattern>
        {stars("stars-lg", 56, 3.2)}
        {stars("stars-sm", 40, 2.6)}
        <pattern id="stipple" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.6" />
          <circle cx="4.5" cy="4.5" r="0.6" />
        </pattern>
      </defs>
    </svg>
  );
}
