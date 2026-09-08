const { app, BrowserWindow } = require("electron");
const path = require("path");

// Only run in development
require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
  win.setMenuBarVisibility(false);
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
