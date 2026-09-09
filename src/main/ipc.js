const { ipcMain } = require("electron");
const { openVaultDialog } = require("./vault");

function registerIpcHandlers() {
  ipcMain.handle("vault:open-dialog", async () => openVaultDialog());
}

module.exports = { registerIpcHandlers };
