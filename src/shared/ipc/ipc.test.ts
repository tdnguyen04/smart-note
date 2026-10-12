import { describe, expect, it } from "vitest";
import { IPC_CHANNELS, type IpcChannel } from "../globals";

describe("IPC_CHANNELS", () => {
  it("uses unique channel names", () => {
    const values = Object.values(IPC_CHANNELS);
    expect(new Set(values).size).toBe(values.length);
    const channels: IpcChannel[] = values;
    expect(channels.length).toBeGreaterThan(0);
  });
});
