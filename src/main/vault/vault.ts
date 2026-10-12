import { dialog, BrowserWindow } from "electron";
import fs, { type FileHandle } from "node:fs/promises";
import path from "path";
import { formatCaptureName, parseCaptureName } from "../../shared/captureName";
import { readFocusId } from "../../shared/focus";
import { APP, COPY, TEXT_EXTENSIONS, type TextExtension } from "../../shared/globals";
import type {
  CreateNoteResult,
  DirNode,
  FileNode,
  NonNoteReport,
  ReadFileResult,
  TreeNode,
  VaultDialogOptions,
  WriteFileResult,
} from "../../shared/ipc";

const PEEK_BYTES = 1024;
const INSPECT_SAMPLE_CAP = 5;
const INSPECT_COUNT_CAP = 100;
const NAME_ATTEMPTS = 100;

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

const INSPECT_SKIP_FILES = new Set([".ds_store", "thumbs.db", "desktop.ini", "icon\r"]);

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

type InspectState = {
  nonNoteCount: number;
  sampleNames: string[];
  preferredSamples: string[];
};

function isTextExtension(ext: string): ext is TextExtension {
  return (TEXT_EXTENSIONS as readonly string[]).includes(ext);
}

export function isTextLikePath(filePath: string): boolean {
  return isTextExtension(path.extname(filePath).toLowerCase());
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function errorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

async function setPointerFrozen(win: BrowserWindow | null, frozen: boolean): Promise<void> {
  if (!win || win.isDestroyed()) {
    return;
  }
  await win.webContents.executeJavaScript(
    `document.body.classList.toggle("is-dialog-open", ${String(frozen)});`,
    true,
  );
}

export async function openVaultDialog(options: VaultDialogOptions = {}): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow();
  const forOnboarding = options.intent === "onboarding";

  try {
    await setPointerFrozen(win, true);

    const dialogOptions: Electron.OpenDialogOptions = {
      title: forOnboarding ? COPY.vault.chooseResearchTitle : COPY.vault.openFolderTitle,
      properties: ["openDirectory"],
    };

    if (forOnboarding) {
      dialogOptions.message = COPY.onboarding.tip;
    }

    const result = await dialog.showOpenDialog(dialogOptions);
    const selected = result.filePaths[0];
    if (result.canceled || !selected) {
      return null;
    }
    return selected;
  } finally {
    await setPointerFrozen(win, false);
  }
}

function compareNodes(a: TreeNode, b: TreeNode): number {
  if (a.type !== b.type) {
    return a.type === "dir" ? -1 : 1;
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

async function peekCaptureNote(filePath: string, fileName: string): Promise<{ focus: string | null; preview: string } | null> {
  if (!parseCaptureName(fileName)) {
    return null;
  }

  let handle: FileHandle | undefined;
  try {
    handle = await fs.open(filePath, "r");
    const buffer = Buffer.alloc(PEEK_BYTES);
    const { bytesRead } = await handle.read(buffer, 0, PEEK_BYTES, 0);
    const head = buffer.toString("utf8", 0, bytesRead);
    return {
      focus: readFocusId(head),
      preview: head,
    };
  } catch {
    return null;
  } finally {
    if (handle) {
      await handle.close();
    }
  }
}

async function readDirNode(dirPath: string): Promise<TreeNode[]> {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const dirNode: DirNode = {
        name: entry.name,
        path: entryPath,
        type: "dir",
        children: await readDirNode(entryPath),
      };
      nodes.push(dirNode);
    } else if (entry.isFile()) {
      const fileNode: FileNode = {
        name: entry.name,
        path: entryPath,
        type: "file",
      };
      const captured = await peekCaptureNote(entryPath, entry.name);
      if (captured) {
        if (captured.focus) {
          fileNode.focus = captured.focus;
        }
        fileNode.preview = captured.preview;
      }
      nodes.push(fileNode);
    }
  }

  nodes.sort(compareNodes);
  return nodes;
}

export async function getTree(rootPath: string): Promise<TreeNode[]> {
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

export async function readFile(filePath: string): Promise<ReadFileResult> {
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
      message: errorMessage(error, COPY.vault.readFailed),
    };
  }
}

export async function writeFile(filePath: string, content: string): Promise<WriteFileResult> {
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
      message: errorMessage(error, COPY.vault.writeFailed),
    };
  }
}

function shouldSkipDir(name: string): boolean {
  if (!name) {
    return true;
  }
  if (INSPECT_SKIP_DIRS.has(name)) {
    return true;
  }
  if (name.startsWith(".")) {
    return true;
  }
  return false;
}

function shouldSkipFile(name: string): boolean {
  if (!name) {
    return true;
  }
  return INSPECT_SKIP_FILES.has(name.toLowerCase());
}

function isPreferredSample(filePath: string): boolean {
  return SAMPLE_PREFERRED_EXT.has(path.extname(filePath).toLowerCase());
}

async function walkNonNotes(dirPath: string, rootPath: string, result: InspectState): Promise<void> {
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
    if (isPreferredSample(entryPath) && result.preferredSamples.length < INSPECT_SAMPLE_CAP) {
      result.preferredSamples.push(label);
    }
  }
}

export async function inspectVault(rootPath: string): Promise<NonNoteReport> {
  const result: InspectState = {
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

  const samples = result.preferredSamples.length > 0 ? result.preferredSamples : result.sampleNames;
  return {
    nonNoteCount: result.nonNoteCount,
    sampleNames: samples.slice(0, INSPECT_SAMPLE_CAP),
  };
}

export async function confirmNonNotes(
  report: NonNoteReport = { nonNoteCount: 0, sampleNames: [] },
): Promise<"continue" | "pick-another"> {
  const win = BrowserWindow.getFocusedWindow();
  const samples = report.sampleNames.filter(Boolean).slice(0, 3);
  const sampleHint = samples.length > 0 ? ` (e.g. ${samples.join(", ")})` : "";

  const options: Electron.MessageBoxOptions = {
    type: "info",
    title: APP.name,
    message: COPY.vault.nonNotesMessage,
    detail: `${COPY.vault.nonNotesDetailLead}${sampleHint}${COPY.vault.nonNotesDetailTail}`,
    buttons: [COPY.vault.useFolder, COPY.vault.pickAnother],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  };

  try {
    await setPointerFrozen(win, true);
    const { response } =
      win && !win.isDestroyed() ? await dialog.showMessageBox(win, options) : await dialog.showMessageBox(options);
    return response === 0 ? "continue" : "pick-another";
  } finally {
    await setPointerFrozen(win, false);
  }
}

export async function createNote(folderPath: string, content: string): Promise<CreateNoteResult> {
  const stamp = new Date();
  let attempt = 0;

  while (attempt < NAME_ATTEMPTS) {
    const fileName = formatCaptureName(stamp, attempt === 0 ? undefined : attempt + 1);
    const targetPath = path.join(folderPath, fileName);
    try {
      await fs.writeFile(targetPath, content, { flag: "wx" });
      return { ok: true, path: targetPath };
    } catch (error) {
      if (errorCode(error) === "EEXIST") {
        attempt += 1;
        continue;
      }
      return {
        ok: false,
        reason: "write-error",
        message: errorMessage(error, COPY.vault.createFailed),
      };
    }
  }
  return { ok: false, reason: "name-collision", message: COPY.vault.nameCollision };
}
