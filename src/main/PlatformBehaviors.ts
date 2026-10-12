import { app, BrowserWindow } from "electron";

export const PlatformBehaviors = {
  handleOSBackgroundQuirks(createWindowFn: () => BrowserWindow): void {
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindowFn();
      }
    });
  },
};
