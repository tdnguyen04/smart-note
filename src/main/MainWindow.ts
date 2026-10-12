import { BrowserWindow, nativeTheme } from "electron";
import path from "path";
import { APP, WINDOW_CHROME } from "../shared/globals";

/** Native chrome colors for the current OS theme. The page follows the same setting through CSS. */
function chromeColors(): (typeof WINDOW_CHROME)["light" | "dark"] {
  return nativeTheme.shouldUseDarkColors ? WINDOW_CHROME.dark : WINDOW_CHROME.light;
}

export const MainWindow = {
  create(): BrowserWindow {
    const colors = chromeColors();
    const win = new BrowserWindow({
      width: 1100,
      height: 720,
      minWidth: 720,
      minHeight: 480,
      backgroundColor: colors.background,
      show: false,
      title: APP.name,
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: colors.background,
        symbolColor: colors.symbol,
        height: WINDOW_CHROME.titlebarHeight,
      },
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "../preload/index.js"),
      },
    });

    // Repaint the native window buttons when the OS switches between light and dark.
    const repaintChrome = (): void => {
      const next = chromeColors();
      win.setBackgroundColor(next.background);
      // macOS draws its own traffic lights and has no overlay to recolor.
      if (process.platform !== "darwin") {
        win.setTitleBarOverlay({ color: next.background, symbolColor: next.symbol });
      }
    };
    nativeTheme.on("updated", repaintChrome);
    win.on("closed", () => {
      nativeTheme.off("updated", repaintChrome);
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
