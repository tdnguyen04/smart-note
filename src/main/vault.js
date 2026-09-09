const { dialog, BrowserWindow } = require("electron");

async function setPointerFrozen(win, frozen) {
  if (!win || win.isDestroyed()) return;
  await win.webContents.executeJavaScript(
    `document.body.classList.toggle("is-dialog-open", ${frozen === true});`,
    true
  );
}

async function openVaultDialog() {
  // No parent window: keeps the dialog independent (main window can take
  // focus) and avoids the Windows modal-cursor bug. Freeze pointer events
  // on the page so clicks/hover don't operate the UI while the dialog is up.
  const win = BrowserWindow.getFocusedWindow();

  try {
    await setPointerFrozen(win, true);

    const result = await dialog.showOpenDialog({
      title: "Open Vault",
      properties: ["openDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  } finally {
    await setPointerFrozen(win, false);
  }
}

module.exports = { openVaultDialog };
