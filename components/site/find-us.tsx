import { EtchGroup } from "@/components/engraving/etch";
import { GEISEL_BOUNDS, geiselParts } from "@/components/engraving/geisel";
import { Plant } from "@/components/engraving/plant";
import { Reveal } from "@/components/site/reveal";
import { venues } from "@/data/venues";
import { directionsUrls, getVenue, mapEmbedUrl } from "@/lib/event-data";

const geisel = geiselParts();
const B = GEISEL_BOUNDS;

/** The venue as Quiet Edition's postcard: an engraved view of campus on a tilted print, then the details. */
export function FindUs() {
  const venue = getVenue(venues, "student-services-center")!;
  const room = venue.rooms.find((r) => r.id === "mpr")!;
  const { google, apple } = directionsUrls(venue);
  return (
    <section id="find-us" className="qe-section grid justify-items-center gap-12">
      <p data-focus="" className="qe-lead-sm">
        We gather on campus, a short walk from Geisel Library, in the {room.name} of the {venue.name}.
      </p>

      <Reveal fade={false} className="qe-print w-[min(480px,86vw)] -rotate-3">
        <div className="plate">
          <svg viewBox={`${B.x - 120} ${B.y - 30} ${B.w + 240} ${B.h + 30}`} className="h-auto w-full" role="img" aria-label="Engraving of Geisel Library between palms">
            <rect x={B.x - 120} y={B.y - 30} width={B.w + 240} height={B.h + 30} fill="url(#hatch-light)" opacity="0.35" />
            <Plant kind="palm" x={-420} base={0} h={300} variant={0} />
            <Plant kind="palm" x={430} base={0} h={270} variant={2} flip />
            <EtchGroup parts={geisel} />
          </svg>
        </div>
      </Reveal>

      <div className="grid justify-items-center gap-5">
        <p data-focus="" className="qe-body">
          {venue.address ? `${venue.address}. ` : ""}
          {room.howToFind ?? "Follow the signs for the Student Services Center; the MPR is inside."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a className="qe-pill" href={google} target="_blank" rel="noopener noreferrer">Directions</a>
          <a className="qe-pill" href={apple} target="_blank" rel="noopener noreferrer">Apple Maps</a>
        </div>
      </div>

      <Reveal className="qe-print w-[min(760px,92vw)] rotate-1">
        <div className="plate">
          <iframe
            title={`Map of the ${venue.name}, UC San Diego`}
            src={mapEmbedUrl(venue)}
            className="block aspect-[16/10] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Reveal>
    </section>
  );
}
