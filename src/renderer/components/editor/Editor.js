import { subscribe } from "../../state.js";

/**
 * Mounts the note editor into root.
 * The draft string is the note body. Autosave writes that string, not the textarea.
 */
const AUTOSAVE_MS = 400;

export function mountEditor(root) {
  root.classList.add("editor");
  root.replaceChildren();

  const titlebar = document.createElement("div");
  titlebar.className = "editor__titlebar";

  const title = document.createElement("span");
  title.className = "editor__filename";
  title.textContent = "No file open";
  titlebar.append(title);

  const body = document.createElement("div");
  body.className = "editor__body";

  root.append(titlebar, body);

  /** @type {{ status: "empty" | "raw" | "unsupported" | "error", path: string | null, draft: string, message: string }} */
  let view = { status: "empty", path: null, draft: "", message: "" };
  /** Path of the textarea currently in the body. Null when the body is not a raw editor. */
  let mountedPath = null;
  let lastSavedContent = "";
  let saveTimer = null;
  let saveInFlight = null;

  function fileNameFromPath(filePath) {
    if (!filePath) {
      return "No file open";
    }
    const normalized = filePath.replace(/[\\/]+$/, "");
    const parts = normalized.split(/[\\/]/);
    return parts[parts.length - 1] || filePath;
  }

  function setTitle(filePath) {
    const name = fileNameFromPath(filePath);
    title.textContent = name;
    title.title = filePath || name;
  }

  function clearSaveTimer() {
    if (saveTimer !== null) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
  }

  async function persist(filePath, content) {
    if (!filePath || content === lastSavedContent) {
      return { ok: true, skipped: true };
    }

    const result = await window.smartnote.writeFile(filePath, content);
    if (result?.ok) {
      lastSavedContent = content;
    }
    return result;
  }

  async function flushSave() {
    clearSaveTimer();
    if (saveInFlight) {
      await saveInFlight;
    }

    const pathToSave = view.path;
    if (view.status !== "raw" || !pathToSave) {
      return;
    }

    saveInFlight = persist(pathToSave, view.draft);
    await saveInFlight;
    saveInFlight = null;
  }

  function scheduleSave() {
    clearSaveTimer();
    const pathToSave = view.path;
    const content = view.draft;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      if (view.status !== "raw" || view.path !== pathToSave) {
        return;
      }
      saveInFlight = persist(pathToSave, content).finally(() => {
        saveInFlight = null;
      });
    }, AUTOSAVE_MS);
  }

  function render() {
    const showPath = view.status === "empty" ? null : view.path;
    setTitle(showPath);

    if (view.status !== "raw") {
      mountedPath = null;
      clearSaveTimer();
      body.replaceChildren();
      const message = document.createElement("p");
      if (view.status === "empty") {
        message.className = "editor__hint";
        message.textContent = "Select a file to view its contents.";
      } else if (view.status === "unsupported") {
        message.className = "editor__message";
        message.textContent = "This file type can’t be edited in SmartNote yet.";
      } else {
        message.className = "editor__message";
        message.textContent = view.message;
      }
      body.append(message);
      return;
    }

    if (mountedPath === view.path) {
      const textarea = body.querySelector(".editor__textarea");
      if (textarea && textarea.value !== view.draft) {
        textarea.value = view.draft;
      }
      return;
    }

    clearSaveTimer();
    body.replaceChildren();
    const textarea = document.createElement("textarea");
    textarea.className = "editor__textarea";
    textarea.spellcheck = false;
    textarea.value = view.draft;
    textarea.addEventListener("input", () => {
      view.draft = textarea.value;
      scheduleSave();
    });
    body.append(textarea);
    mountedPath = view.path;

    textarea.focus();
    textarea.setSelectionRange(0, 0);
  }

  function showError(text) {
    view = {
      status: "error",
      path: view.path,
      draft: "",
      message: text,
    };
    lastSavedContent = "";
    render();
  }

  async function openFile(filePath) {
    await flushSave();

    if (!filePath) {
      view = { status: "empty", path: null, draft: "", message: "" };
      lastSavedContent = "";
      render();
      return;
    }

    const result = await window.smartnote.readFile(filePath);
    if (!result || !result.ok) {
      lastSavedContent = "";
      if (result?.reason === "binary") {
        view = {
          status: "unsupported",
          path: filePath,
          draft: "",
          message: "",
        };
      } else {
        view = {
          status: "error",
          path: filePath,
          draft: "",
          message: result?.message || "Could not open this file.",
        };
      }
      render();
      return;
    }

    view = {
      status: "raw",
      path: filePath,
      draft: result.content,
      message: "",
    };
    lastSavedContent = result.content;
    render();
  }

  render();

  subscribe((s) => s.selectedFilePath, async (selectedFilePath) => {
    try {
      await openFile(selectedFilePath);
    } catch (error) {
      console.error(error);
      showError("An error occurred while opening the file.");
    }
  });
}
