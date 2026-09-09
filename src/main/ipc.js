const { ipcMain, BrowserWindow } = require("electron");
const { openVaultDialog, getTree } = require("./vault");
const { popupFileMenu } = require("./menu");

function registerIpcHandlers() {
  ipcMain.handle("vault:open-dialog", async () => openVaultDialog());
  ipcMain.handle("vault:get-tree", async (_event, rootPath) => getTree(rootPath));
  ipcMain.handle("menu:popup-file", (event, position = {}) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      return;
    }
    popupFileMenu(win, position.x, position.y);
  });
}

module.exports = { registerIpcHandlers };
