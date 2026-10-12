import { describe, expect, it } from "vitest";
import { formatCaptureName, parseCaptureName } from "./index";

describe("captureName", () => {
  it("round-trips a duplicate capture name", () => {
    const date = new Date(2026, 9, 12, 15, 7, 0, 0);
    expect(parseCaptureName(formatCaptureName(date, 2))).toEqual({ date, dup: 2 });
  });

  it("leaves the first file unsuffixed", () => {
    const date = new Date(2026, 0, 2, 3, 4, 0, 0);
    const name = formatCaptureName(date);
    expect(name.endsWith(" Note.md")).toBe(true);
    expect(name.includes("(")).toBe(false);
    expect(parseCaptureName(name)).toEqual({ date, dup: 0 });
  });
});
