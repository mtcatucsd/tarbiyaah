import { describe, expect, it } from "vitest";
import { countValue, splitTime, ticketHref } from "@/lib/format";

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
    expect(ticketHref("https://typeform.com/to/abc")).toBe("https://typeform.com/to/abc");
    expect(ticketHref("http://example.com")).toBe("http://example.com");
    expect(ticketHref("")).toBe("#tickets");
    expect(ticketHref(undefined)).toBe("#tickets");
    expect(ticketHref("javascript:alert(1)")).toBe("#tickets");
    expect(ticketHref("typeform.com/to/abc")).toBe("#tickets");
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
