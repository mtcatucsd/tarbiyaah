import type { DayFilter, Session, Venue } from "@/data/types";

export const getVenue = (venues: Venue[], id: string) => venues.find((v) => v.id === id);

export function sessionsForDay(sessions: Session[], day: DayFilter): Session[] {
  const list = day === "all" ? [...sessions] : sessions.filter((s) => s.day === day);
  return list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/** Google Maps walking directions to the venue (opens the Maps app on phones, the website elsewhere). */
export function directionsUrl(venue: Venue) {
  const [lng, lat] = venue.coordinates;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}

// Google Maps embed that needs no API key. Searching by name lets Google drop its own pin on the building.
export function mapEmbedUrl(venue: Venue, zoom = 17) {
  const q = encodeURIComponent(`${venue.name}, UC San Diego, La Jolla, CA`);
  return `https://www.google.com/maps?q=${q}&z=${zoom}&output=embed`;
}

const timeFormat = (timeZone: string) => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone });

export function formatTime(iso: string, timeZone: string) {
  return timeFormat(timeZone).format(new Date(iso));
}

export function formatTimeRange(start: string, end: string, timeZone: string) {
  const fmt = timeFormat(timeZone);
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

export function roomLabel(venue: Venue, roomId: string) {
  const room = venue.rooms.find((r) => r.id === roomId);
  if (!room) return "";
  return room.floor === undefined ? room.name : `${room.name} · Floor ${room.floor}`;
}
