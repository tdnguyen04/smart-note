import { describe, expect, it } from "vitest";
import { baseName, isSamePath } from "./paths";

describe("isSamePath", () => {
  it("ignores case, slash style and trailing slashes", () => {
    expect(isSamePath("C:\\Notes\\Vault\\", "c:/notes/vault")).toBe(true);
  });

  it("is false for empty or different paths", () => {
    expect(isSamePath("", "")).toBe(false);
    expect(isSamePath(null, "/a")).toBe(false);
    expect(isSamePath("/a/b", "/a/c")).toBe(false);
  });
});

describe("baseName", () => {
  it("returns the last segment", () => {
    expect(baseName("C:\\Notes\\Vault\\")).toBe("Vault");
    expect(baseName("/home/me/2026-01-01 09.00 Note.md")).toBe("2026-01-01 09.00 Note.md");
  });

  it("is empty for nothing", () => {
    expect(baseName(null)).toBe("");
  });
});
