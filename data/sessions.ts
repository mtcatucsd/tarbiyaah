import type { Session } from "./types";

// Sunday, November 1, 2026, 12 PM – 8 PM (Pacific Standard Time: daylight saving ends that morning).
// Titles, summaries, times and descriptions are placeholders until the programme is final.
const base = { day: 1 as const, venueId: "student-services-center", roomId: "mpr", description: "Placeholder description of the session." };

export const sessions: Session[] = [
  { ...base, id: "checkin", title: "Doors & check-in", summary: "Pick up your badge and find a seat.", start: "2026-11-01T12:00:00-08:00", end: "2026-11-01T12:30:00-08:00" },
  { ...base, id: "opening", title: "Opening session", summary: "Welcome, recitation and the day's intention.", start: "2026-11-01T12:30:00-08:00", end: "2026-11-01T13:15:00-08:00" },
  { ...base, id: "lecture", title: "Lecture", summary: "On the traits of Ibad al-Rahman.", start: "2026-11-01T13:30:00-08:00", end: "2026-11-01T14:45:00-08:00" },
  { ...base, id: "workshops", title: "Workshops", summary: "Small groups turning knowledge into practice.", start: "2026-11-01T15:00:00-08:00", end: "2026-11-01T16:30:00-08:00" },
  { ...base, id: "panel", title: "Panel discussion", summary: "Speakers in conversation, and your questions.", start: "2026-11-01T16:45:00-08:00", end: "2026-11-01T18:15:00-08:00" },
  { ...base, id: "closing", title: "Closing session", summary: "Reflections to carry home.", start: "2026-11-01T18:45:00-08:00", end: "2026-11-01T20:00:00-08:00" },
];
