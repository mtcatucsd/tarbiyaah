// Sponsors. Add a `logo` (a WebP in public/sponsors/, about 520 px wide, with its real width and height) when a logo
// arrives. Entries without a logo show as empty slots. A light-on-transparent logo (white text) needs `onDark: true`
// so it sits on a dark tile.
export type Sponsor = {
  id: string;
  name: string;
  logo?: { src: string; width: number; height: number; onDark?: boolean };
};

export const sponsors: Sponsor[] = [
  { id: "manara-west", name: "Manara West", logo: { src: "/sponsors/manara-west.webp", width: 520, height: 150, onDark: true } },
  { id: "sponsor-2", name: "Sponsor Name" },
  { id: "sponsor-3", name: "Sponsor Name" },
  { id: "sponsor-4", name: "Sponsor Name" },
];
