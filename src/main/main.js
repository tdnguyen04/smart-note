const { app, BrowserWindow } = require("electron");
const { registerIpcHandlers } = require("./ipc");
const devSetup = require("./devSetup");
const MainWindow = require("./MainWindow");


app.whenReady().then(() => {
  devSetup.setupHotReload(app);
  registerIpcHandlers();
  const win = MainWindow.create();
  devSetup.setupDevToolsShortcut(app, win);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    MainWindow.create();
  }
});