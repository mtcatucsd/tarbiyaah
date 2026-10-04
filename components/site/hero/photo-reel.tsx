import Image from "next/image";

// Last year's photos (public/photos, resized from docs/tarbiyaah-conference-2025-photos) in two rows of
// arch-topped windows. Each row's set is repeated twice so the CSS loop (-50%) is seamless.
// `pos` keeps faces in frame when the landscape photo is cropped to a tall window.
const ROW_A = [
  { src: "slide", pos: "50% 40%" }, { src: "speaker-a", pos: "50% 30%" }, { src: "sisters", pos: "50% 25%" },
  { src: "food", pos: "50% 50%" }, { src: "trio", pos: "50% 25%" }, { src: "stage", pos: "50% 55%" },
];
const ROW_B = [
  { src: "portrait", pos: "50% 30%" }, { src: "speaker-b", pos: "50% 30%" }, { src: "spread", pos: "50% 55%" },
  { src: "friends", pos: "50% 25%" }, { src: "speaker-d", pos: "62% 35%" }, { src: "crowd", pos: "50% 60%" },
];

function Row({ id, photos }: { id: "a" | "b"; photos: typeof ROW_A }) {
  const doubled = [...photos, ...photos];
  return (
    <div className="reel-row" data-row={id}>
      <div className="reel-track">
        {doubled.map((p, i) => (
          <div key={i} className="reel-card">
            <Image src={`/photos/${p.src}.jpg`} alt="" width={420} height={560} sizes="250px" style={{ objectPosition: p.pos }} priority={i < 3} />
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
