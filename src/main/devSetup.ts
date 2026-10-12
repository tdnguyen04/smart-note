import type { App, BrowserWindow } from "electron";

export function setupDevToolsShortcut(app: App, win: BrowserWindow): void {
  if (!app.isPackaged) {
    win.webContents.on("before-input-event", (event, input) => {
      if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === "i") {
        win.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  }
}
