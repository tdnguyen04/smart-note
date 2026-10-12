import { CAPTURE_NAME } from "../globals";

const CAPTURE_NAME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2}) (\d{2})\.(\d{2}) Note(?: \((\d+)\))?\.md$/;

export type ParsedCapture = {
  date: Date;
  dup: number;
};

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** Full filename, including `.md`. `dup` of 2 or more is the ` (2)` suffix. */
export function formatCaptureName(date: Date, dup?: number): string {
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}.${pad(date.getMinutes())} ${CAPTURE_NAME.stem}`;
  const suffix =
    dup !== undefined && dup >= 2
      ? `${CAPTURE_NAME.duplicatePrefix}${dup}${CAPTURE_NAME.duplicateSuffix}`
      : "";
  return `${stamp}${suffix}${CAPTURE_NAME.extension}`;
}

/** Local date and duplicate number. `dup` is 0 when the name has no suffix. */
export function parseCaptureName(name: string): ParsedCapture | null {
  const match = CAPTURE_NAME_PATTERN.exec(name);
  if (!match) {
    return null;
  }
  const year = match[1];
  const month = match[2];
  const day = match[3];
  const hours = match[4];
  const minutes = match[5];
  if (!year || !month || !day || !hours || !minutes) {
    return null;
  }
  const dupText = match[6];
  return {
    date: new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), 0, 0),
    dup: dupText ? Number(dupText) : 0,
  };
}
