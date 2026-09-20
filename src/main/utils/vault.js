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

async function openVaultDialog(options = {}) {
  // No parent window: keeps the dialog independent (main window can take
  // focus) and avoids the Windows modal-cursor bug. Freeze pointer events
  // on the page so clicks/hover don't operate the UI while the dialog is up.
  const win = BrowserWindow.getFocusedWindow();
  const forOnboarding = options.intent === "onboarding";

  try {
    await setPointerFrozen(win, true);

    const dialogOptions = {
      title: forOnboarding ? "Choose a folder for your notes" : "Open Vault",
      properties: ["openDirectory"],
    };

    // `message` is shown on macOS folder dialogs; Windows relies on onboarding copy.
    if (forOnboarding) {
      dialogOptions.message =
        "An empty folder works best — your notes stay in one place.";
    }

    const result = await dialog.showOpenDialog(dialogOptions);

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

/** Directories we never scan for the non-note heads-up. */
const INSPECT_SKIP_DIRS = new Set([
  ".git",
  ".svn",
  ".hg",
  "node_modules",
  ".trash",
  ".Trash",
  "$RECYCLE.BIN",
  "System Volume Information",
]);

/** OS/editor noise — not useful as “example” non-notes. */
const INSPECT_SKIP_FILES = new Set([
  ".ds_store",
  "thumbs.db",
  "desktop.ini",
  "icon\r",
]);

/** Prefer these when picking sample names for the dialog. */
const SAMPLE_PREFERRED_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".mp3",
  ".mp4",
  ".mov",
]);

function shouldSkipDir(name) {
  if (!name) return true;
  if (INSPECT_SKIP_DIRS.has(name)) return true;
  // Hidden / system folders (e.g. .obsidian config trees, .vscode)
  if (name.startsWith(".")) return true;
  return false;
}

function shouldSkipFile(name) {
  if (!name) return true;
  if (INSPECT_SKIP_FILES.has(name.toLowerCase())) return true;
  return false;
}

function isPreferredSample(filePath) {
  return SAMPLE_PREFERRED_EXT.has(path.extname(filePath).toLowerCase());
}

/**
 * Walks the vault for files whose extension is not in TEXT_EXTENSIONS.
 * Skips hidden/system trees so samples match what users expect.
 * Does not read file contents. Caps sample names and count.
 */
async function inspectVault(rootPath) {
  const result = {
    nonNoteCount: 0,
    sampleNames: [],
    preferredSamples: [],
  };

  if (!rootPath || typeof rootPath !== "string") {
    return { nonNoteCount: 0, sampleNames: [] };
  }

  try {
    const stat = await fs.stat(rootPath);
    if (!stat.isDirectory()) {
      return { nonNoteCount: 0, sampleNames: [] };
    }
  } catch {
    return { nonNoteCount: 0, sampleNames: [] };
  }

  await walkNonNotes(rootPath, rootPath, result);

  // Prefer recognizable media/docs in the dialog; fall back to any samples.
  const samples =
    result.preferredSamples.length > 0
      ? result.preferredSamples
      : result.sampleNames;

  return {
    nonNoteCount: result.nonNoteCount,
    sampleNames: samples.slice(0, INSPECT_SAMPLE_CAP),
  };
}

async function walkNonNotes(dirPath, rootPath, result) {
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
      if (shouldSkipDir(entry.name)) {
        continue;
      }
      await walkNonNotes(entryPath, rootPath, result);
      continue;
    }

    if (!entry.isFile() || shouldSkipFile(entry.name)) {
      continue;
    }

    if (isTextLikePath(entryPath)) {
      continue;
    }

    result.nonNoteCount += 1;

    const rel = path.relative(rootPath, entryPath) || entry.name;
    const label = rel.split(path.sep).join("/");

    if (result.sampleNames.length < INSPECT_SAMPLE_CAP) {
      result.sampleNames.push(label);
    }
    if (
      isPreferredSample(entryPath) &&
      result.preferredSamples.length < INSPECT_SAMPLE_CAP
    ) {
      result.preferredSamples.push(label);
    }
  }
}

/**
 * Friendly heads-up when a vault has non-note files.
 * Soft tone on purpose — not a system/security warning.
 * @returns {"continue" | "pick-another"}
 */
async function confirmNonNotes({ nonNoteCount = 0, sampleNames = [] } = {}) {
  const win = BrowserWindow.getFocusedWindow();
  const samples = sampleNames.filter(Boolean).slice(0, 3);
  const sampleHint =
    samples.length > 0 ? ` (e.g. ${samples.join(", ")})` : "";

  const options = {
    type: "info",
    title: "SmartNote",
    message: "This folder has a few files SmartNote won’t open.",
    detail: `Things like images or PDFs are fine to leave here${sampleHint}. You can still use this folder for notes.`,
    buttons: ["Use this folder", "Pick another"],
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
