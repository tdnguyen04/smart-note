const { app, BrowserWindow } = require("electron");

const PlatformBehaviors = {
  /**
   * Normalizes OS-specific window behaviors. Ensures Windows/Linux apps 
   * quit properly, and macOS apps stay in the dock and revive when clicked.
   */
  handleOSBackgroundQuirks(createWindowFn) {
    app.on("window-all-closed", () => {
      // Default behavior of Windows/Linux will quit the app when the last window is closed.
      // Electron window (Chromium) is different from the app itself.
      // We need to quit the app manually when the last window is closed.
      // in macOS, we keep the app in the dock and revive when clicked.
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    // When the app is idle and the user clicks on the app icon in the dock, the app will be activated.
    app.on("activate", () => {
      // We only create a new window if there is no window open.
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindowFn();
      }
    });
  }
};

module.exports = PlatformBehaviors;