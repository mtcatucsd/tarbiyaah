import { Section } from "@/components/site/section";
import { sessions } from "@/data/sessions";
import { formatTime, sessionsForDay } from "@/lib/event-data";
import { siteConfig } from "@/lib/site-config";

const day = siteConfig.dateText.replace(/, \d{4}$/, ""); // "Sunday, November 1": the year is in the page title above

// The day as a printed menu: each session's title, a dotted leader and its start time, with its one-line summary
// underneath. The rows rise in turn once (data-anim="stagger"); without JS or with reduced motion they simply show.
// Session titles, summaries and times are placeholders until the programme is final (see data/sessions.ts).
export function Schedule() {
  return (
    <Section id="schedule">
      <div className="mb-10 grid justify-items-center gap-3 text-center">
        <p className="mono-label">Schedule</p>
        <h2 data-anim="lines" className="qe-lead">The day at a glance</h2>
        <p data-anim="rise" className="qe-body whitespace-nowrap">{day} · {siteConfig.timeText} · MPR</p>
      </div>
      <ol data-anim="stagger" className="menu">
        {sessionsForDay(sessions, "all").map((s) => (
          <li key={s.id} className="menu-row">
            <div className="menu-line">
              <h3 className="menu-title font-display">{s.title}</h3>
              <span className="menu-dots" aria-hidden="true" />
              <time className="menu-time" dateTime={s.start}>{formatTime(s.start, siteConfig.timeZone)}</time>
            </div>
            <p className="menu-summary">{s.summary}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
