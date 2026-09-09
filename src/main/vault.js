const { dialog, BrowserWindow } = require("electron");
const fs = require("fs/promises");
const path = require("path");

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

function compareNodes(a, b) {
  if (a.type !== b.type) {
    return a.type === "dir" ? -1 : 1;
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

async function readDirNode(dirPath) {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const nodes = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: entryPath,
        type: "dir",
        children: await readDirNode(entryPath),
      });
    } else if (entry.isFile()) {
      nodes.push({
        name: entry.name,
        path: entryPath,
        type: "file",
      });
    }
  }

  nodes.sort(compareNodes);
  return nodes;
}

async function getTree(rootPath) {
  if (!rootPath || typeof rootPath !== "string") {
    return [];
  }

  try {
    const stat = await fs.stat(rootPath);
    if (!stat.isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  return readDirNode(rootPath);
}

module.exports = { openVaultDialog, getTree };
