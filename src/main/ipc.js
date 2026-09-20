const { ipcMain } = require("electron");
const { openVaultDialog, getTree, readFile, writeFile } = require("./utils/vault");
const { getSettings, setSettings } = require("./utils/settings");

function registerIpcHandlers() {
  ipcMain.handle("vault:open-dialog", async () => openVaultDialog());
  ipcMain.handle("vault:get-tree", async (_event, rootPath) => getTree(rootPath));
  ipcMain.handle("vault:read-file", async (_event, filePath) => readFile(filePath));
  ipcMain.handle("vault:write-file", async (_event, filePath, content) =>
    writeFile(filePath, content)
  );
  ipcMain.handle("settings:get", async () => getSettings());
  ipcMain.handle("settings:set", async (_event, partial) => setSettings(partial));
}

module.exports = { registerIpcHandlers };
