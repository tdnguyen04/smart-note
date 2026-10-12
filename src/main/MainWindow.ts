import { BrowserWindow } from "electron";
import path from "path";
import { APP } from "../shared/globals";

export const MainWindow = {
  create(): BrowserWindow {
    const win = new BrowserWindow({
      width: 1100,
      height: 720,
      minWidth: 720,
      minHeight: 480,
      backgroundColor: "#ffffff",
      show: false,
      title: APP.name,
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: "#ffffff",
        symbolColor: "#111111",
        height: 36,
      },
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "../preload/index.js"),
      },
    });

    const rendererUrl = process.env["ELECTRON_RENDERER_URL"];
    if (rendererUrl) {
      void win.loadURL(rendererUrl);
    } else {
      void win.loadFile(path.join(__dirname, "../renderer/index.html"));
    }
    win.setMenuBarVisibility(false);

    win.once("ready-to-show", () => {
      win.show();
    });

    return win;
  },
};
