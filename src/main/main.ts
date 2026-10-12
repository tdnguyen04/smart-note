import { app } from "electron";
import { setupDevToolsShortcut } from "./devSetup";
import { registerIpcHandlers } from "./ipc";
import { MainWindow } from "./MainWindow";
import { PlatformBehaviors } from "./PlatformBehaviors";

void app.whenReady().then(() => {
  registerIpcHandlers();
  const win = MainWindow.create();
  setupDevToolsShortcut(app, win);
});

PlatformBehaviors.handleOSBackgroundQuirks(() => MainWindow.create());
