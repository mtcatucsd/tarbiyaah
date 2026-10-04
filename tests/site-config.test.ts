import { describe, expect, it } from "vitest";
import { sessions } from "@/data/sessions";
import { siteConfig } from "@/lib/site-config";

const startsAt = Math.min(...sessions.map((s) => new Date(s.start).getTime()));

describe("siteConfig matches the event", () => {
  it("counts down to the first session", () => {
    expect(new Date(siteConfig.eventDate).getTime()).toBe(startsAt);
  });
  it("states the real weekday and date for the event day", () => {
    const fmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: siteConfig.timeZone });
    expect(siteConfig.dateText).toBe(fmt.format(startsAt));
    expect(siteConfig.dateText).toBe("Sunday, November 1, 2026");
  });
  it("names the venue, the theme and the 12 PM - 8 PM hours", () => {
    expect(siteConfig.venueText).toContain("MPR");
    expect(siteConfig.theme).toContain("Ibad al-Rahman");
    expect(siteConfig.timeText).toBe("12 PM – 8 PM");
  });
});
