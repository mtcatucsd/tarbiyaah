import Image from "next/image";

// Last year's photos (public/photos, resized from docs/tarbiyaah-conference-2025-photos) in two rows of
// arch-topped windows. Each row's set is repeated twice so the CSS loop (-50%) is seamless.
// `pos` keeps faces in frame when the landscape photo is cropped to a tall window.
const ROW_A = [
  { src: "reel-tent", pos: "50% 40%" }, { src: "reel-speaker", pos: "50% 25%" },
  { src: "gallery-session", pos: "50% 50%" }, { src: "reel-slide", pos: "50% 25%" }, { src: "reel-sisters", pos: "50% 55%" },
];
const ROW_B = [
  { src: "reel-welcome", pos: "50% 30%" }, { src: "reel-speaker-2", pos: "50% 30%" }, { src: "reel-lawn", pos: "50% 55%" },
  { src: "reel-bazaar", pos: "50% 25%" }, { src: "reel-audience", pos: "62% 35%" }, { src: "gallery-booth", pos: "50% 55%" },
];

function Row({ id, photos }: { id: "a" | "b"; photos: typeof ROW_A }) {
  const doubled = [...photos, ...photos];
  return (
    <div className="reel-row" data-row={id}>
      <div className="reel-track">
        {doubled.map((p, i) => (
          <div key={i} className="reel-card">
            <Image src={`/photos/${p.src}.webp`} alt="" width={420} height={560} sizes="250px" style={{ objectPosition: p.pos }} priority={i < 3} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhotoReel() {
  return (
    <div className="night-layer night-reel-wrap" aria-hidden="true">
      <Row id="a" photos={ROW_A} />
      <Row id="b" photos={ROW_B} />
    </div>
  );
}
