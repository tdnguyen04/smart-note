import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAutosave } from "./autosave";

describe("createAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes once, with the latest content, after the delay", async () => {
    const write = vi.fn(() => Promise.resolve({ ok: true }));
    const autosave = createAutosave(write, 400);
    let text = "a";
    const read = vi.fn(() => text);

    autosave.schedule("/n.md", read);
    text = "ab";
    autosave.schedule("/n.md", read);
    await vi.advanceTimersByTimeAsync(399);
    expect(write).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith("/n.md", "ab");
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("flush writes immediately and skips content already on disk", async () => {
    const write = vi.fn(() => Promise.resolve({ ok: true }));
    const autosave = createAutosave(write, 400);
    autosave.markSaved("same");

    autosave.schedule("/n.md", () => "same");
    await autosave.flush();
    expect(write).not.toHaveBeenCalled();

    autosave.schedule("/n.md", () => "changed");
    await autosave.flush();
    expect(write).toHaveBeenCalledWith("/n.md", "changed");
  });

  it("keeps each write on the path it was scheduled for", async () => {
    const write = vi.fn(() => Promise.resolve({ ok: true }));
    const autosave = createAutosave(write, 400);
    autosave.schedule("/old.md", () => "old text");
    await autosave.flush();
    autosave.schedule("/new.md", () => "new text");
    await autosave.flush();
    expect(write.mock.calls).toEqual([
      ["/old.md", "old text"],
      ["/new.md", "new text"],
    ]);
  });

  it("cancel drops a pending write", async () => {
    const write = vi.fn(() => Promise.resolve({ ok: true }));
    const autosave = createAutosave(write, 400);
    autosave.schedule("/n.md", () => "x");
    autosave.cancel();
    await vi.advanceTimersByTimeAsync(1000);
    expect(write).not.toHaveBeenCalled();
  });
});
