const { app, BrowserWindow } = require("electron");
const path = require("path");
const { registerIpcHandlers } = require("./ipc");
const { createAppMenu } = require("./menu");

const projectRoot = path.join(__dirname, "..", "..");
const TITLEBAR_HEIGHT = 36;

// Only run in development
require("electron-reload")(projectRoot, {
  electron: path.join(projectRoot, "node_modules", ".bin", "electron"),
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#ffffff",
      symbolColor: "#111111",
      height: TITLEBAR_HEIGHT,
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", "preload", "preload.js"),
    },
  });

  win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  // Keep accelerators from the app menu, but hide the clumsy second menu strip.
  win.setMenuBarVisibility(false);
  win.setAutoHideMenuBar(true);
  win.webContents.on("before-input-event", (event, input) => {
    if (
      (input.control || input.meta) &&
      input.shift &&
      input.key.toLowerCase() === "i"
    ) {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
  return win;
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createAppMenu();
  createWindow();
});

app.on("window-all-closed", () => {
  // on macOS
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // on macOS
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
