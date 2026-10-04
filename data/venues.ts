import type { Venue } from "./types";

// MPR = the Multipurpose Room in UC San Diego's Student Services Center (SSC), at the corner of
// Rupertus Way and Myers Drive, just south of Price Center East.
// Building location: OpenStreetMap way 31842124 (centre point). The MPR's floor and the nearest
// entrance are NOT verified yet — add them (and set verified: true) from the room booking / campus map.
export const venues: Venue[] = [
  {
    id: "student-services-center",
    name: "Student Services Center",
    shortName: "SSC · MPR",
    coordinates: [-117.2355612, 32.878848],
    address: "9460 Russell Ln, La Jolla, CA 92093 (UC San Diego)", // building address shown by Google Maps
    rooms: [
      {
        id: "mpr",
        name: "Multipurpose Room (MPR)",
        howToFind:
          "Inside the Student Services Center, at the corner of Rupertus Way and Myers Drive, just south of Price Center East.",
      },
    ],
    verified: false,
    sources: [
      "https://universitycenters.ucsd.edu/events-and-reservations/room-guide-pages/multipurpose-room.html",
      "https://www.openstreetmap.org/way/31842124",
      "https://campusmap.ucsd.edu/",
    ],
  },
];
