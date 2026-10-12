import { contextBridge } from "electron";
import { IPC_CHANNELS } from "../../shared/globals";
import { invoke, on, type SmartnoteApi } from "../../shared/ipc";

const smartnote = {
  openVaultDialog: (options) => invoke(IPC_CHANNELS.openDialog, options),
  getTree: (rootPath) => invoke(IPC_CHANNELS.getTree, rootPath),
  readFile: (filePath) => invoke(IPC_CHANNELS.readFile, filePath),
  writeFile: (filePath, content) => invoke(IPC_CHANNELS.writeFile, filePath, content),
  inspectVault: (rootPath) => invoke(IPC_CHANNELS.inspect, rootPath),
  confirmNonNotes: (payload) => invoke(IPC_CHANNELS.confirmNonNotes, payload),
  getSettings: () => invoke(IPC_CHANNELS.getSettings),
  setSettings: (partial) => invoke(IPC_CHANNELS.setSettings, partial),
  onVaultOpened: (callback) => on(IPC_CHANNELS.vaultOpened, callback),
  createNote: (vaultPath, content) => invoke(IPC_CHANNELS.createNote, vaultPath, content),
} satisfies SmartnoteApi;

contextBridge.exposeInMainWorld("smartnote", smartnote);
