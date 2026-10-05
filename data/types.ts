export type Room = { id: string; name: string; floor?: number; howToFind?: string };

export type Venue = {
  id: string;
  name: string;
  shortName: string;
  coordinates: [lng: number, lat: number];
  address?: string;
  rooms: Room[];
  entrance?: { coordinates: [number, number]; note: string; accessible: boolean };
  parkingNote?: string;
  verified: boolean;   // true only after checking https://campusmap.ucsd.edu/
  sources: string[];   // URLs used for verification
};

export type Session = {
  id: string;
  title: string;
  description: string;
  summary: string;     // one line for the timeline cards, at most 60 characters
  day: 1 | 2;
  start: string;       // ISO 8601 with offset
  end: string;
  venueId: string;
  roomId: string;
};

export type DayFilter = "all" | 1 | 2;
