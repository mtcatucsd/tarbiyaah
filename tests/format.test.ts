import { describe, expect, it } from "vitest";
import { countValue, splitTime, ticketHref, ticketLink } from "@/lib/format";

describe("splitTime", () => {
  it("breaks milliseconds into days/hours/minutes/seconds", () => {
    const ms = ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000;
    expect(splitTime(ms)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });
  it("returns zeros for past, zero and invalid input", () => {
    const zeros = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    expect(splitTime(-5000)).toEqual(zeros);
    expect(splitTime(0)).toEqual(zeros);
    expect(splitTime(NaN)).toEqual(zeros);
    expect(splitTime(new Date("not a date").getTime() - Date.now())).toEqual(zeros);
  });
});

describe("ticketHref", () => {
  it("accepts http(s) urls only", () => {
    expect(ticketHref("https://lu.ma/tarbiyyah")).toBe("https://lu.ma/tarbiyyah");
    expect(ticketHref("http://example.com")).toBe("http://example.com");
    expect(ticketHref("")).toBe("#tickets");
    expect(ticketHref(undefined)).toBe("#tickets");
    expect(ticketHref("javascript:alert(1)")).toBe("#tickets");
    expect(ticketHref("lu.ma/tarbiyyah")).toBe("#tickets");
  });
});

describe("countValue", () => {
  it("eases from 0 to target and clamps progress", () => {
    expect(countValue(500, 0)).toBe(0);
    expect(countValue(500, 1)).toBe(500);
    expect(countValue(500, 2)).toBe(500);
    expect(countValue(500, -1)).toBe(0);
    const mid = countValue(500, 0.5);
    expect(mid).toBeGreaterThan(250);
    expect(mid).toBeLessThan(500);
  });
});

describe("ticketLink", () => {
  it("opens the Luma event in a new tab once the link is set", () => {
    expect(ticketLink("https://lu.ma/tarbiyyah")).toEqual({ href: "https://lu.ma/tarbiyyah", target: "_blank", rel: "noopener noreferrer" });
  });
  it("scrolls to the tickets section while the link is empty", () => {
    expect(ticketLink("")).toEqual({ href: "#tickets" });
    expect(ticketLink(undefined)).toEqual({ href: "#tickets" });
  });
});
