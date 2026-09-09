/**
 * Editor owns #content. mode: 'raw' now; later 'preview' can share this mount API.
 */
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

  function showEmpty() {
    currentPath = null;
    setTitle(null);
    body.replaceChildren();
    const hint = document.createElement("p");
    hint.className = "editor__hint";
    hint.textContent = "Select a file to view its contents.";
    body.append(hint);
  }

  function showUnsupported(filePath) {
    currentPath = filePath;
    setTitle(filePath);
    body.replaceChildren();
    const message = document.createElement("p");
    message.className = "editor__message";
    message.textContent =
      "This file type can’t be edited in SmartNote yet.";
    body.append(message);
  }

  function showError(text) {
    body.replaceChildren();
    const message = document.createElement("p");
    message.className = "editor__message";
    message.textContent = text;
    body.append(message);
  }

  function showRaw(filePath, content) {
    currentPath = filePath;
    setTitle(filePath);
    body.replaceChildren();

    const textarea = document.createElement("textarea");
    textarea.className = "editor__textarea";
    textarea.spellcheck = false;
    textarea.value = content;
    textarea.dataset.mode = mode;
    body.append(textarea);
  }

  showEmpty();

  return {
    async openFile(filePath) {
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
    clear() {
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
