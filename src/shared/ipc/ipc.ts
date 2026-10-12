import { ipcMain, ipcRenderer, type IpcMainInvokeEvent } from "electron";
import type { ChannelArgs, ChannelPayload, ChannelResult, EventChannel, InvokeChannel } from "./contract";

export function handle<C extends InvokeChannel>(
  channel: C,
  listener: (event: IpcMainInvokeEvent, ...args: ChannelArgs<C>) => Promise<ChannelResult<C>> | ChannelResult<C>,
): void {
  ipcMain.handle(channel, (event, ...args: unknown[]) => listener(event, ...(args as ChannelArgs<C>)));
}

export function invoke<C extends InvokeChannel>(
  channel: C,
  ...args: ChannelArgs<C>
): Promise<ChannelResult<C>> {
  return ipcRenderer.invoke(channel, ...(args as unknown[])) as Promise<ChannelResult<C>>;
}

export function on<C extends EventChannel>(
  channel: C,
  listener: (payload: ChannelPayload<C>) => void,
): () => void {
  const wrapped = (_event: unknown, payload: ChannelPayload<C>) => {
    listener(payload);
  };
  ipcRenderer.on(channel, wrapped);
  return () => {
    ipcRenderer.removeListener(channel, wrapped);
  };
}
