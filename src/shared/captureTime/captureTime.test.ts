import { describe, expect, it } from "vitest";
import { COPY } from "../globals";
import { dateKey, formatCaptureStamp, formatClock, formatDayLabel } from "./captureTime";

const now = new Date(2026, 9, 12, 15, 30);

describe("dateKey", () => {
  it("pads month and day", () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("formatDayLabel", () => {
  it("names today and yesterday", () => {
    expect(formatDayLabel("2026-10-12", now)).toBe(COPY.sidebar.today);
    expect(formatDayLabel("2026-10-11", now)).toBe(COPY.sidebar.yesterday);
  });

  it("treats the day before the first of the month as yesterday", () => {
    expect(formatDayLabel("2026-09-30", new Date(2026, 9, 1))).toBe(COPY.sidebar.yesterday);
  });

  it("adds the year only when it differs", () => {
    expect(formatDayLabel("2026-03-03", now)).not.toMatch(/2026/);
    expect(formatDayLabel("2024-03-03", now)).toMatch(/2024/);
  });
});

describe("formatClock", () => {
  it("uses a 12-hour clock", () => {
    expect(formatClock(new Date(2026, 0, 1, 0, 7))).toBe("12:07 AM");
    expect(formatClock(new Date(2026, 0, 1, 13, 5))).toBe("1:05 PM");
  });
});

describe("formatCaptureStamp", () => {
  it("joins day and time", () => {
    expect(formatCaptureStamp(new Date(2026, 2, 3, 9, 5), now)).toMatch(/, 9:05 AM$/);
  });
});
