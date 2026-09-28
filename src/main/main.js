const { app } = require("electron");
const { registerIpcHandlers } = require("./ipc");
const devSetup = require("./devSetup");
const MainWindow = require("./MainWindow");

const PlatformBehaviors = require("./PlatformBehaviors");

app.whenReady().then(() => {
  devSetup.setupHotReload(app);
  registerIpcHandlers();
  const win = MainWindow.create();
  devSetup.setupDevToolsShortcut(app, win);
});

PlatformBehaviors.handleOSBackgroundQuirks(MainWindow.create);