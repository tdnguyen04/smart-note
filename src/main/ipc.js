const { ipcMain } = require("electron");
const { openVaultDialog, getTree } = require("./vault");

function registerIpcHandlers() {
  ipcMain.handle("vault:open-dialog", async () => openVaultDialog());
  ipcMain.handle("vault:get-tree", async (_event, rootPath) => getTree(rootPath));
}

module.exports = { registerIpcHandlers };
