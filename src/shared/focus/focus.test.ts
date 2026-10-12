import { describe, expect, it } from "vitest";
import { composeFrontmatter, focusById, pickPrompt, readFocusId, splitFrontmatter } from "./index";

describe("focus", () => {
  it("ignores an unknown id", () => {
    expect(focusById("journal")).toBeUndefined();
    expect(composeFrontmatter({ focusId: "journal", body: "Hello" })).toBe("Hello");
  });

  it("round-trips a known focus block", () => {
    const raw = composeFrontmatter({ focusId: "literature", body: "Hello" });
    const split = splitFrontmatter(raw);
    expect(split.body).toBe("Hello");
    expect(readFocusId(raw)).toBe("literature");
    expect(split.prefix.includes("focus: literature")).toBe(true);
  });

  it("picks a prompt from the chosen focus", () => {
    const focus = focusById("research");
    const prompt = pickPrompt("research", null);
    const prompts: readonly string[] = focus?.prompts ?? [];
    expect(prompts.includes(prompt)).toBe(true);
  });
});
