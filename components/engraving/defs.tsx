// Shared hatching patterns, mounted once in the root layout and referenced by id (url(#hatch-mid)).
// Spacing is in the user units of whichever drawing uses them; drawings are laid out at roughly 1 unit = 1px.
const lines = (id: string, gap: number, angle: number, weight = 0.7) => (
  <pattern key={id} id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
    <line x1={gap / 2} y1="0" x2={gap / 2} y2={gap} strokeWidth={weight} />
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
      </defs>
    </svg>
  );
}
