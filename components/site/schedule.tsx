"use client";
import type { CSSProperties } from "react";
import { Section } from "@/components/site/section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sessions } from "@/data/sessions";
import type { Session } from "@/data/types";
import { venues } from "@/data/venues";
import { useInView } from "@/hooks/use-in-view";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { formatTimeRange, getVenue, hasMultipleDays, roomLabel, sessionsForDay } from "@/lib/event-data";
import { siteConfig } from "@/lib/site-config";

const days = ([1, 2] as const).filter((d) => sessions.some((s) => s.day === d));

// Medallion at the top of the spine: a circle around an eight-point star.
function Medallion() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
      <circle cx="16" cy="16" r="15" className="fill-background stroke-ink" />
      <g className="fill-ink/15 stroke-ink" strokeLinejoin="round">
        <rect x="10" y="10" width="12" height="12" />
        <rect x="10" y="10" width="12" height="12" transform="rotate(45 16 16)" />
      </g>
    </svg>
  );
}

// One session hanging off the spine. The node and connector live inside the card header,
// so the node is always level with the header row and exactly --gap away from the card edge.
function Stop({ session, side }: { session: Session; side: "left" | "right" }) {
  const { ref: cardRef, inView } = useInView<HTMLDivElement>(0.3);
  const { ref: nodeRef, progress } = useScrollProgress<HTMLSpanElement>();
  const venue = getVenue(venues, session.venueId)!;
  return (
    // The node's own progress passes 0.5 when the viewport middle (the end of the inked line) crosses its centre.
    <li className="spine-stop" data-side={side} data-passed={progress >= 0.5}>
      <Card ref={cardRef} data-in-view={inView} className="spine-card relative gap-0 overflow-visible border-transparent py-0">
        <svg aria-hidden="true" className="pointer-events-none absolute -inset-px size-[calc(100%+2px)] overflow-visible">
          <rect rx="13.5" pathLength={1} className="draw spine-border" />
        </svg>
        <CardHeader className="relative flex flex-row items-center justify-between gap-4 border-b bg-secondary px-4 py-3 [.border-b]:pb-3">
          <span aria-hidden="true" className="spine-connector" />
          <span ref={nodeRef} aria-hidden="true" className="spine-node" />
          <span className="mono-label">{formatTimeRange(session.start, session.end, siteConfig.timeZone)}</span>
          <span className="mono-label">MPR</span>
        </CardHeader>
        <CardContent className="grid gap-2 px-4 py-5">
          <h3 className="font-display text-2xl leading-tight text-ink-deep">{session.title}</h3>
          <p className="font-mono text-sm leading-7 text-muted-foreground">{session.description}</p>
          <p className="mono-label">{roomLabel(venue, session.roomId)}</p>
          <a href="#find-us" className="mono-label !text-blue underline-offset-4 hover:underline">
            Find the MPR →
          </a>
        </CardContent>
      </Card>
    </li>
  );
}

// Session titles and times are placeholders until the programme is final (see data/sessions.ts).
function Spine({ day }: { day: 1 | 2 }) {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  return (
    <div ref={ref} className="spine" style={{ "--progress": progress } as CSSProperties}>
      <span aria-hidden="true" className="spine-line" />
      <span aria-hidden="true" className="spine-line spine-fill" />
      <div className="spine-cap"><Medallion /></div>
      <ol className="grid gap-10 py-6">
        {sessionsForDay(sessions, day).map((s, i) => (
          <Stop key={s.id} session={s} side={i % 2 === 0 ? "left" : "right"} />
        ))}
      </ol>
      <div className="spine-cap"><span className="spine-end" /></div>
    </div>
  );
}

export function Schedule() {
  return (
    <Section id="schedule">
      <div className="mb-14 grid justify-items-center gap-3 text-center">
        <p className="mono-label">Schedule</p>
        <h2 data-focus="" className="qe-lead">The day at a glance</h2>
        <p className="qe-body">{siteConfig.dateText} · {siteConfig.timeText} · {siteConfig.venueText}</p>
      </div>
      {hasMultipleDays(sessions) ? (
        <Tabs defaultValue={String(days[0])}>
          <TabsList className="mx-auto mb-8 flex h-auto w-fit gap-2 bg-transparent p-0">
            {days.map((d) => (
              <TabsTrigger
                key={d}
                value={String(d)}
                className="mono-label h-auto flex-none rounded-lg border border-border px-4 py-2 data-active:border-primary data-active:bg-primary data-active:text-primary-foreground"
              >
                Day {d}
              </TabsTrigger>
            ))}
          </TabsList>
          {days.map((d) => (
            <TabsContent key={d} value={String(d)} forceMount className="data-[state=inactive]:hidden">
              <Spine day={d} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Spine day={days[0]} />
      )}
    </Section>
  );
}
