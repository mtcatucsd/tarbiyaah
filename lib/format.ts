// Pure helpers (no DOM) so they can be unit-tested.

export function splitTime(ms: number) {
  if (!(ms > 0)) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function ticketHref(url?: string) {
  return typeof url === "string" && /^https?:\/\//.test(url) ? url : "#tickets";
}

/** Props for every "Get tickets" link: straight to the Luma event in a new tab, or to the tickets section until the link is set. */
export function ticketLink(url?: string) {
  const href = ticketHref(url);
  return href.startsWith("http") ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
}

export function countValue(target: number, progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  return Math.round(target * (1 - Math.pow(1 - p, 3)));
}
