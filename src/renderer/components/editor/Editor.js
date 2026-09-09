/**
 * Editor owns #content. mode: 'raw' now; later 'preview' can share this mount API.
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

  let currentPath = null;
  let mode = "raw";
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

  function getTextarea() {
    return body.querySelector(".editor__textarea");
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

    const textarea = getTextarea();
    const pathToSave = currentPath;
    if (!textarea || !pathToSave) {
      return;
    }

    saveInFlight = persist(pathToSave, textarea.value);
    await saveInFlight;
    saveInFlight = null;
  }

  function scheduleSave() {
    clearSaveTimer();
    const pathToSave = currentPath;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      const textarea = getTextarea();
      if (!textarea || currentPath !== pathToSave) {
        return;
      }
      saveInFlight = persist(pathToSave, textarea.value).finally(() => {
        saveInFlight = null;
      });
    }, AUTOSAVE_MS);
  }

  function showEmpty() {
    currentPath = null;
    lastSavedContent = "";
    clearSaveTimer();
    setTitle(null);
    body.replaceChildren();
    const hint = document.createElement("p");
    hint.className = "editor__hint";
    hint.textContent = "Select a file to view its contents.";
    body.append(hint);
  }

  function showUnsupported(filePath) {
    currentPath = filePath;
    lastSavedContent = "";
    clearSaveTimer();
    setTitle(filePath);
    body.replaceChildren();
    const message = document.createElement("p");
    message.className = "editor__message";
    message.textContent =
      "This file type can’t be edited in SmartNote yet.";
    body.append(message);
  }

  function showError(text) {
    lastSavedContent = "";
    clearSaveTimer();
    body.replaceChildren();
    const message = document.createElement("p");
    message.className = "editor__message";
    message.textContent = text;
    body.append(message);
  }

  function showRaw(filePath, content) {
    currentPath = filePath;
    lastSavedContent = content;
    clearSaveTimer();
    setTitle(filePath);
    body.replaceChildren();

    const textarea = document.createElement("textarea");
    textarea.className = "editor__textarea";
    textarea.spellcheck = false;
    textarea.value = content;
    textarea.dataset.mode = mode;
    textarea.addEventListener("input", () => {
      scheduleSave();
    });
    body.append(textarea);

    // Place caret at start so it's obvious the file is editable.
    textarea.focus();
    textarea.setSelectionRange(0, 0);
  }

  showEmpty();

  return {
    async openFile(filePath) {
      await flushSave();

      if (!filePath) {
        showEmpty();
        return;
      }

      setTitle(filePath);

      const result = await window.smartnote.readFile(filePath);
      if (!result || !result.ok) {
        if (result?.reason === "binary") {
          showUnsupported(filePath);
          return;
        }
        currentPath = filePath;
        showError(result?.message || "Could not open this file.");
        return;
      }

      if (mode === "raw") {
        showRaw(filePath, result.content);
      }
    },
    async clear() {
      await flushSave();
      showEmpty();
    },
    getCurrentPath() {
      return currentPath;
    },
    setMode(nextMode) {
      mode = nextMode === "preview" ? "preview" : "raw";
    },
  };
}
