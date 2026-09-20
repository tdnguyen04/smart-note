const { ipcMain } = require("electron");
const {
  openVaultDialog,
  getTree,
  readFile,
  writeFile,
  inspectVault,
  confirmNonNotes,
} = require("./utils/vault");
const { getSettings, setSettings } = require("./utils/settings");

function registerIpcHandlers() {
  ipcMain.handle("vault:open-dialog", async () => openVaultDialog());
  ipcMain.handle("vault:get-tree", async (_event, rootPath) => getTree(rootPath));
  ipcMain.handle("vault:read-file", async (_event, filePath) => readFile(filePath));
  ipcMain.handle("vault:write-file", async (_event, filePath, content) =>
    writeFile(filePath, content)
  );
  ipcMain.handle("vault:inspect", async (_event, rootPath) => inspectVault(rootPath));
  ipcMain.handle("vault:confirm-non-notes", async (_event, payload) =>
    confirmNonNotes(payload)
  );
  ipcMain.handle("settings:get", async () => getSettings());
  ipcMain.handle("settings:set", async (_event, partial) => setSettings(partial));
}

module.exports = { registerIpcHandlers };
