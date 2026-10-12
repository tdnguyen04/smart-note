import { beforeEach, describe, expect, it } from "vitest";
import { enterHome, enterOnboarding, enterOrganize, noteLanded, openCapturedNote } from "./commands";
import { getState, updateState } from "./state";

describe("unseen captures badge", () => {
  beforeEach(() => {
    updateState({ vaultPath: "/vault", unseenCaptures: 0 });
    enterHome();
  });

  it("counts each landed note while on Compose", () => {
    noteLanded();
    noteLanded();
    expect(getState().unseenCaptures).toBe(2);
  });

  it("clears when Organize opens, either way in", () => {
    noteLanded();
    enterOrganize();
    expect(getState().unseenCaptures).toBe(0);

    enterHome();
    noteLanded();
    openCapturedNote("/vault/note.md");
    expect(getState().unseenCaptures).toBe(0);
  });

  it("ignores landings with no vault open", () => {
    enterOnboarding();
    noteLanded();
    expect(getState().unseenCaptures).toBe(0);
  });
});
