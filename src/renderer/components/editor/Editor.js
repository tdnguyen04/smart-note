/**
 * Editor owns #content. mode: 'raw' now; later 'preview' can share this mount API.
 */
export function mountEditor(root) {
  root.classList.add("editor");

  let currentPath = null;
  let mode = "raw";

  function showEmpty() {
    currentPath = null;
    root.replaceChildren();
    const hint = document.createElement("p");
    hint.className = "editor__hint";
    hint.textContent = "Select a file to view its contents.";
    root.append(hint);
  }

  function showUnsupported(filePath) {
    currentPath = filePath;
    root.replaceChildren();
    const message = document.createElement("p");
    message.className = "editor__message";
    message.textContent =
      "This file type can’t be edited in SmartNote yet.";
    root.append(message);
  }

  function showError(text) {
    root.replaceChildren();
    const message = document.createElement("p");
    message.className = "editor__message";
    message.textContent = text;
    root.append(message);
  }

  function showRaw(filePath, content) {
    currentPath = filePath;
    root.replaceChildren();

    const textarea = document.createElement("textarea");
    textarea.className = "editor__textarea";
    textarea.spellcheck = false;
    textarea.value = content;
    textarea.dataset.mode = mode;
    root.append(textarea);
  }

  showEmpty();

  return {
    async openFile(filePath) {
      if (!filePath) {
        showEmpty();
        return;
      }

      const result = await window.smartnote.readFile(filePath);
      if (!result || !result.ok) {
        if (result?.reason === "binary") {
          showUnsupported(filePath);
          return;
        }
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
