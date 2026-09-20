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

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".markdown",
  ".txt",
  ".text",
  ".json",
  ".csv",
  ".log",
  ".yml",
  ".yaml",
]);

function isTextLikePath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

async function readFile(filePath) {
  if (!filePath || typeof filePath !== "string") {
    return { ok: false, reason: "invalid-path" };
  }

  if (!isTextLikePath(filePath)) {
    return { ok: false, reason: "binary" };
  }

  try {
    const content = await fs.readFile(filePath, "utf8");
    return { ok: true, content, path: filePath };
  } catch (error) {
    return {
      ok: false,
      reason: "read-error",
      message: error instanceof Error ? error.message : "Failed to read file",
    };
  }
}

async function writeFile(filePath, content) {
  if (!filePath || typeof filePath !== "string") {
    return { ok: false, reason: "invalid-path" };
  }

  if (!isTextLikePath(filePath)) {
    return { ok: false, reason: "binary" };
  }

  if (typeof content !== "string") {
    return { ok: false, reason: "invalid-content" };
  }

  try {
    await fs.writeFile(filePath, content, "utf8");
    return { ok: true, path: filePath };
  } catch (error) {
    return {
      ok: false,
      reason: "write-error",
      message: error instanceof Error ? error.message : "Failed to write file",
    };
  }
}

const INSPECT_SAMPLE_CAP = 5;
const INSPECT_COUNT_CAP = 100;

/**
 * Walks the vault for files whose extension is not in TEXT_EXTENSIONS.
 * Does not read file contents. Caps sample names and optional count.
 */
async function inspectVault(rootPath) {
  const result = { nonNoteCount: 0, sampleNames: [] };

  if (!rootPath || typeof rootPath !== "string") {
    return result;
  }

  try {
    const stat = await fs.stat(rootPath);
    if (!stat.isDirectory()) {
      return result;
    }
  } catch {
    return result;
  }

  await walkNonNotes(rootPath, result);
  return result;
}

async function walkNonNotes(dirPath, result) {
  if (result.nonNoteCount >= INSPECT_COUNT_CAP) {
    return;
  }

  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (result.nonNoteCount >= INSPECT_COUNT_CAP) {
      return;
    }

    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walkNonNotes(entryPath, result);
    } else if (entry.isFile() && !isTextLikePath(entryPath)) {
      result.nonNoteCount += 1;
      if (result.sampleNames.length < INSPECT_SAMPLE_CAP) {
        result.sampleNames.push(entry.name);
      }
    }
  }
}

/**
 * Native warning when a vault has non-note files.
 * @returns {"continue" | "pick-another"}
 */
async function confirmNonNotes({ nonNoteCount = 0, sampleNames = [] } = {}) {
  const win = BrowserWindow.getFocusedWindow();
  const samples = sampleNames.filter(Boolean).slice(0, INSPECT_SAMPLE_CAP);
  const sampleBlock =
    samples.length > 0
      ? `\n\nExamples:\n• ${samples.join("\n• ")}`
      : "";
  const countLabel =
    nonNoteCount >= INSPECT_COUNT_CAP
      ? `${INSPECT_COUNT_CAP}+`
      : String(nonNoteCount);

  const options = {
    type: "warning",
    title: "Vault contains other files",
    message: "This folder contains files SmartNote won’t edit.",
    detail: `Found ${countLabel} non-note file(s). You can continue and ignore them, or choose another folder.${sampleBlock}`,
    buttons: ["Continue", "Choose another folder"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  };

  try {
    await setPointerFrozen(win, true);

    const { response } =
      win && !win.isDestroyed()
        ? await dialog.showMessageBox(win, options)
        : await dialog.showMessageBox(options);

    return response === 0 ? "continue" : "pick-another";
  } finally {
    await setPointerFrozen(win, false);
  }
}

module.exports = {
  openVaultDialog,
  getTree,
  readFile,
  writeFile,
  isTextLikePath,
  inspectVault,
  confirmNonNotes,
};
