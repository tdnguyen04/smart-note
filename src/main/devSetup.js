const path = require('path');

function setupHotReload(app) {
  projectRoot = path.join(__dirname, '..', '..');
  if (!app.isPackaged) {
    require('electron-reload')(projectRoot, {
      electron: path.join(projectRoot, 'node_modules', '.bin', 'electron'),
    });
  }
}

function setupDevTools(app, win) {
  if (!app.isPackaged) {
    win.webContents.on("before-input-event", (event, input) => {
      // Control + Shift + I to open dev tools
      if (
        (input.control || input.meta) &&
        input.shift &&
        input.key.toLowerCase() === "i"
      ) {
        win.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  }
}

module.exports = {
  setupHotReload,
  setupDevTools,
};