import { describe, expect, it } from "vitest";
import { formatEntryTitle } from "./index";

describe("formatEntryTitle", () => {
  it("skips a focus block and keeps the first three words", () => {
    const content = "---\nfocus: literature\n---\n\nOne two three four";
    expect(formatEntryTitle(content)).toBe("One two three");
  });

  it("stops at 15 characters", () => {
    expect(formatEntryTitle("alpha beta gamma delta")).toBe("alpha beta gamm");
  });

  it("returns empty when the body is blank", () => {
    expect(formatEntryTitle("   ")).toBe("");
  });
});
