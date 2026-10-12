import { COPY } from "../globals";

/**
 * How capture dates read on screen. The sidebar groups notes by day and the editor
 * header shows when a note was taken; both read the same words from here.
 * Every function takes `now` so the output is testable and never depends on a hidden clock.
 */

const DAY_MONTH: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
const DAY_MONTH_YEAR: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local calendar day as `YYYY-MM-DD`. Sorts as a string and is safe as a map key. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "Today", "Yesterday", "Mar 3", or "Mar 3, 2024" when the year differs from `now`. */
export function formatDayLabel(key: string, now: Date = new Date()): string {
  if (key === dateKey(now)) {
    return COPY.sidebar.today;
  }
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (key === dateKey(yesterday)) {
    return COPY.sidebar.yesterday;
  }
  const [year = 0, month = 1, day = 1] = key.split("-").map(Number);
  const shown = new Date(year, month - 1, day);
  return shown.toLocaleDateString(undefined, year === now.getFullYear() ? DAY_MONTH : DAY_MONTH_YEAR);
}

/** 12-hour clock, e.g. "9:05 AM". */
export function formatClock(date: Date): string {
  const hours = date.getHours();
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${pad(date.getMinutes())} ${period}`;
}

/** Day and time together for a single note, e.g. "Mar 3, 9:05 AM". */
export function formatCaptureStamp(date: Date, now: Date = new Date()): string {
  const format = date.getFullYear() === now.getFullYear() ? DAY_MONTH : DAY_MONTH_YEAR;
  return `${date.toLocaleDateString(undefined, format)}, ${formatClock(date)}`;
}
