import type { DayFilter, Session, Venue } from "@/data/types";

export const getVenue = (venues: Venue[], id: string) => venues.find((v) => v.id === id);

export function sessionsForDay(sessions: Session[], day: DayFilter): Session[] {
  const list = day === "all" ? [...sessions] : sessions.filter((s) => s.day === day);
  return list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function directionsUrls(venue: Venue) {
  const [lng, lat] = venue.coordinates;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
    apple: `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`,
  };
}

// Google Maps embed that needs no API key. Searching by name lets Google drop its own pin on the building.
export function mapEmbedUrl(venue: Venue, zoom = 17) {
  const q = encodeURIComponent(`${venue.name}, UC San Diego, La Jolla, CA`);
  return `https://www.google.com/maps?q=${q}&z=${zoom}&output=embed`;
}

export function formatTimeRange(start: string, end: string, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

export function roomLabel(venue: Venue, roomId: string) {
  const room = venue.rooms.find((r) => r.id === roomId);
  if (!room) return "";
  return room.floor === undefined ? room.name : `${room.name} · Floor ${room.floor}`;
}

// Day tabs and "Day N" labels only make sense when the programme spans more than one day.
export function hasMultipleDays(sessions: Session[]): boolean {
  return new Set(sessions.map((s) => s.day)).size > 1;
}
