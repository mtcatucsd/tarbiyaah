import { ticketLink } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

// A band of type leading into the closing; the closing scene moves it with the scroll (and back when scrolling up).
// The first copy is the real one; the repeats are hidden from assistive tech and the keyboard.
const COPIES = 4;
const date = siteConfig.dateText.replace(/, \d{4}$/, ""); // "Sunday, November 1"

export function Marquee() {
  const tickets = ticketLink(siteConfig.ticketUrl);
  return (
    <div className="marquee" data-scene="marquee">
      <div className="marquee-track">
        {Array.from({ length: COPIES }, (_, i) => (
          <p key={i} className="marquee-copy font-display" aria-hidden={i > 0 ? "true" : undefined}>
            <span>{date}</span>
            <span aria-hidden="true">·</span>
            <span>{siteConfig.name}</span>
            <span aria-hidden="true">·</span>
            <a {...tickets} tabIndex={i > 0 ? -1 : undefined}>Get tickets</a>
            <span aria-hidden="true">·</span>
          </p>
        ))}
      </div>
    </div>
  );
}
