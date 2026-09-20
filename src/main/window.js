const { BrowserWindow } = require("electron");
const path = require("path");

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
  // No menu bar, but keep "accelerators" from the app menu, such as Ctrl+C, Ctrl+X, etc.
  win.setMenuBarVisibility(false);

  win.once("ready-to-show", () => {
    win.show();
  });

  return win;
}

module.exports = {
  createWindow,
};