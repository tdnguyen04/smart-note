const { app } = require("electron");
const { createWindow } = require("./window");
const { registerIpcHandlers } = require("./ipc");
const devSetup = require("./devSetup");


app.whenReady().then(() => {
  devSetup.setupHotReload(app);
  registerIpcHandlers();
  const win = createWindow();
  devSetup.setupDevToolsShortcut(app, win);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
