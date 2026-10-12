import { IPC_CHANNELS, type IpcChannel } from "../globals";

export type VaultDialogOptions = {
  intent?: "onboarding" | "change";
};

export type DirNode = {
  name: string;
  path: string;
  type: "dir";
  children: TreeNode[];
};

export type FileNode = {
  name: string;
  path: string;
  type: "file";
  focus?: string;
  preview?: string;
};

export type TreeNode = DirNode | FileNode;

export type ReadFileResult =
  | { ok: true; content: string; path: string }
  | { ok: false; reason: "invalid-path" | "binary" }
  | { ok: false; reason: "read-error"; message: string };

export type WriteFileResult =
  | { ok: true; path: string }
  | { ok: false; reason: "invalid-path" | "binary" | "invalid-content" }
  | { ok: false; reason: "write-error"; message: string };

export type NonNoteReport = {
  nonNoteCount: number;
  sampleNames: string[];
};

export type CreateNoteResult =
  | { ok: true; path: string }
  | { ok: false; reason: "write-error" | "name-collision"; message: string };

export type Settings = {
  mainVaultPath: string | null;
  acceptedNonNoteVaultPath: string | null;
};

export type SettingsPatch = {
  mainVaultPath?: string | null;
  acceptedNonNoteVaultPath?: string | null;
};

type InvokeSpec = { args: readonly unknown[]; result: unknown };
type EventSpec = { payload: unknown };

export interface IpcContract {
  [IPC_CHANNELS.openDialog]: { args: [VaultDialogOptions]; result: string | null };
  [IPC_CHANNELS.getTree]: { args: [string]; result: TreeNode[] };
  [IPC_CHANNELS.readFile]: { args: [string]; result: ReadFileResult };
  [IPC_CHANNELS.writeFile]: { args: [string, string]; result: WriteFileResult };
  [IPC_CHANNELS.inspect]: { args: [string]; result: NonNoteReport };
  [IPC_CHANNELS.confirmNonNotes]: { args: [NonNoteReport]; result: "continue" | "pick-another" };
  [IPC_CHANNELS.createNote]: { args: [string, string]; result: CreateNoteResult };
  [IPC_CHANNELS.getSettings]: { args: []; result: Settings };
  [IPC_CHANNELS.setSettings]: { args: [SettingsPatch]; result: Settings };
  [IPC_CHANNELS.vaultOpened]: { payload: string };
}

type Assert<T extends true> = T;
type _AllChannelsCovered = Assert<IpcChannel extends keyof IpcContract ? true : false>;

export type InvokeChannel = {
  [C in IpcChannel]: IpcContract[C] extends InvokeSpec ? C : never;
}[IpcChannel];

export type EventChannel = {
  [C in IpcChannel]: IpcContract[C] extends EventSpec ? C : never;
}[IpcChannel];

export type ChannelArgs<C extends InvokeChannel> = IpcContract[C] extends { args: infer A }
  ? A extends readonly unknown[]
    ? A
    : never
  : never;

export type ChannelResult<C extends InvokeChannel> = IpcContract[C] extends { result: infer R } ? R : never;

export type ChannelPayload<C extends EventChannel> = IpcContract[C] extends { payload: infer P } ? P : never;

export type SmartnoteApi = {
  openVaultDialog: (...args: ChannelArgs<typeof IPC_CHANNELS.openDialog>) => Promise<
    ChannelResult<typeof IPC_CHANNELS.openDialog>
  >;
  getTree: (...args: ChannelArgs<typeof IPC_CHANNELS.getTree>) => Promise<ChannelResult<typeof IPC_CHANNELS.getTree>>;
  readFile: (...args: ChannelArgs<typeof IPC_CHANNELS.readFile>) => Promise<ChannelResult<typeof IPC_CHANNELS.readFile>>;
  writeFile: (...args: ChannelArgs<typeof IPC_CHANNELS.writeFile>) => Promise<
    ChannelResult<typeof IPC_CHANNELS.writeFile>
  >;
  inspectVault: (...args: ChannelArgs<typeof IPC_CHANNELS.inspect>) => Promise<
    ChannelResult<typeof IPC_CHANNELS.inspect>
  >;
  confirmNonNotes: (...args: ChannelArgs<typeof IPC_CHANNELS.confirmNonNotes>) => Promise<
    ChannelResult<typeof IPC_CHANNELS.confirmNonNotes>
  >;
  getSettings: (...args: ChannelArgs<typeof IPC_CHANNELS.getSettings>) => Promise<
    ChannelResult<typeof IPC_CHANNELS.getSettings>
  >;
  setSettings: (...args: ChannelArgs<typeof IPC_CHANNELS.setSettings>) => Promise<
    ChannelResult<typeof IPC_CHANNELS.setSettings>
  >;
  createNote: (...args: ChannelArgs<typeof IPC_CHANNELS.createNote>) => Promise<
    ChannelResult<typeof IPC_CHANNELS.createNote>
  >;
  onVaultOpened: (callback: (payload: ChannelPayload<typeof IPC_CHANNELS.vaultOpened>) => void) => () => void;
};
