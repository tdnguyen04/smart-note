import { IPC_CHANNELS } from "../shared/globals";
import { handle } from "../shared/ipc";
import { getSettings, setSettings } from "./settings";
import {
  confirmNonNotes,
  createNote,
  getTree,
  inspectVault,
  openVaultDialog,
  readFile,
  writeFile,
} from "./vault";

export function registerIpcHandlers(): void {
  handle(IPC_CHANNELS.openDialog, (_event, options) => openVaultDialog(options));
  handle(IPC_CHANNELS.getTree, (_event, rootPath) => getTree(rootPath));
  handle(IPC_CHANNELS.readFile, (_event, filePath) => readFile(filePath));
  handle(IPC_CHANNELS.writeFile, (_event, filePath, content) => writeFile(filePath, content));
  handle(IPC_CHANNELS.inspect, (_event, rootPath) => inspectVault(rootPath));
  handle(IPC_CHANNELS.confirmNonNotes, (_event, payload) => confirmNonNotes(payload));
  handle(IPC_CHANNELS.createNote, (_event, folderPath, content) => createNote(folderPath, content));
  handle(IPC_CHANNELS.getSettings, () => getSettings());
  handle(IPC_CHANNELS.setSettings, (_event, partial) => setSettings(partial));
}
