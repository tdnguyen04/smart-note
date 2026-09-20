const { app, BrowserWindow } = require("electron");
const path = require("path");
const { registerIpcHandlers } = require("./ipc");
const { createAppNativeMenu } = require("./nativeFileMenu");
const devSetup = require("./devSetup");

devSetup.setupHotReload(app);

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: "#ffffff",
    show: false,
    title: "SmartNote",
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#ffffff",
      symbolColor: "#111111",
      height: 36,
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", "preload", "preload.js"),
    },
  });

  win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  // Keep accelerators from the app menu, but hide the second menu strip.
  win.setMenuBarVisibility(false);
  win.setAutoHideMenuBar(true);

  win.once("ready-to-show", () => {
    win.show();
  });

  devSetup.setupDevTools(app, win);

  return win;
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createAppNativeMenu();
  createWindow();
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
