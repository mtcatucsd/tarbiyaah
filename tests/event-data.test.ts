import { describe, expect, it } from "vitest";
import {
  directionsUrls, formatTimeRange, getVenue, hasMultipleDays, mapEmbedUrl,
  roomLabel, sessionsForDay,
} from "@/lib/event-data";
import { sessions } from "@/data/sessions";
import { venues } from "@/data/venues";
import type { Venue } from "@/data/types";

const ssc = getVenue(venues, "student-services-center")!;

describe("seed data integrity", () => {
  it("every session points at a real venue and room", () => {
    for (const s of sessions) {
      const venue = getVenue(venues, s.venueId);
      expect(venue, s.id).toBeDefined();
      expect(venue!.rooms.some((r) => r.id === s.roomId), s.id).toBe(true);
    }
  });
  it("the conference is one day, Sunday Nov 1 2026, 12pm-8pm Los Angeles time", () => {
    const fmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", timeZone: "America/Los_Angeles" });
    const starts = sessions.map((s) => new Date(s.start).getTime());
    const ends = sessions.map((s) => new Date(s.end).getTime());
    expect(fmt.format(Math.min(...starts))).toBe("Sunday, November 1 at 12 PM");
    expect(fmt.format(Math.max(...ends))).toBe("Sunday, November 1 at 8 PM");
    expect(new Set(sessions.map((s) => s.day))).toEqual(new Set([1]));
  });
  it("the MPR venue is the Student Services Center Multipurpose Room", () => {
    expect(ssc.name).toBe("Student Services Center");
    expect(ssc.rooms.some((r) => r.id === "mpr")).toBe(true);
  });
});

describe("sessionsForDay", () => {
  it("filters by day and sorts by start time", () => {
    const day1 = sessionsForDay(sessions, 1);
    expect(day1.every((s) => s.day === 1)).toBe(true);
    const starts = day1.map((s) => new Date(s.start).getTime());
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(sessionsForDay(sessions, "all")).toHaveLength(sessions.length);
    expect(sessionsForDay(sessions, 2)).toHaveLength(0);
  });
});


describe("directionsUrls", () => {
  it("builds walking directions by latitude,longitude", () => {
    const [lng, lat] = ssc.coordinates;
    const { google, apple } = directionsUrls(ssc);
    expect(google).toContain(`destination=${lat},${lng}`);
    expect(apple).toContain(`daddr=${lat},${lng}`);
  });
});

describe("formatTimeRange", () => {
  it("formats in Los Angeles time", () => {
    expect(formatTimeRange("2026-11-01T12:00:00-08:00", "2026-11-01T13:00:00-08:00", "America/Los_Angeles"))
      .toBe("12:00 PM – 1:00 PM");
    expect(formatTimeRange("2026-11-01T20:00:00Z", "2026-11-01T21:00:00Z", "America/Los_Angeles"))
      .toBe("12:00 PM – 1:00 PM");
  });
});

describe("roomLabel", () => {
  it("shows just the room name when the floor is unknown", () => {
    expect(roomLabel(ssc, "mpr")).toBe("Multipurpose Room (MPR)");
    expect(roomLabel(ssc, "missing")).toBe("");
  });
  it("adds the floor when it is known", () => {
    const withFloor: Venue = { ...ssc, rooms: [{ id: "mpr", name: "Multipurpose Room (MPR)", floor: 2 }] };
    expect(roomLabel(withFloor, "mpr")).toBe("Multipurpose Room (MPR) · Floor 2");
  });
});


describe("hasMultipleDays", () => {
  it("is false for the one-day programme and true when a second day exists", () => {
    expect(hasMultipleDays(sessions)).toBe(false);
    expect(hasMultipleDays([...sessions, { ...sessions[0], id: "extra", day: 2 }])).toBe(true);
    expect(hasMultipleDays([])).toBe(false);
  });
});

describe("mapEmbedUrl", () => {
  it("builds a key-free Google Maps embed that searches the venue by name, so Google pins its own building", () => {
    const url = new URL(mapEmbedUrl(ssc));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps");
    expect(url.searchParams.get("q")).toBe("Student Services Center, UC San Diego, La Jolla, CA");
    expect(url.searchParams.get("output")).toBe("embed");
    expect(Number(url.searchParams.get("z"))).toBeGreaterThanOrEqual(16);
  });
});
