// MainWindow.js
const { BrowserWindow } = require("electron");
const path = require("path");

const MainWindow = {
  /**
   * Constructs the main application window, hiding the visual configuration,
   * path resolution, and initial rendering flicker prevention.
   */
  create() {
    const win = new BrowserWindow({
      width: 1100,
      height: 720,
      minWidth: 720,
      minHeight: 480,
      backgroundColor: "#ffffff",
      show: false, // Hidden until ready
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
    win.setMenuBarVisibility(false);

    // Deep abstraction: Hides the async showing logic to prevent UI flicker
    win.once("ready-to-show", () => {
      win.show();
    });

    return win;
  }
};

module.exports = MainWindow;