const { ipcMain, BrowserWindow } = require("electron");
const { openVaultDialog, getTree, readFile, writeFile } = require("./vault");
const { getSettings, setSettings } = require("./settings");
const { popupFileMenu } = require("./menu");

function registerIpcHandlers() {
  ipcMain.handle("vault:open-dialog", async () => openVaultDialog());
  ipcMain.handle("vault:get-tree", async (_event, rootPath) => getTree(rootPath));
  ipcMain.handle("vault:read-file", async (_event, filePath) => readFile(filePath));
  ipcMain.handle("vault:write-file", async (_event, filePath, content) =>
    writeFile(filePath, content)
  );
  ipcMain.handle("settings:get", async () => getSettings());
  ipcMain.handle("settings:set", async (_event, partial) => setSettings(partial));
  ipcMain.handle("menu:popup-file", (event, position = {}) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      return;
    }
    popupFileMenu(win, position.x, position.y);
  });
}

module.exports = { registerIpcHandlers };
