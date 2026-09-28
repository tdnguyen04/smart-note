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

  function lineCount(text) {
    let count = 1;
    for (let i = 0; i < text.length; i += 1) {
      if (text.charCodeAt(i) === 10) {
        count += 1;
      }
    }
    return count;
  }

  function paintLineNumbers(gutter, text) {
    const count = lineCount(text);
    const digits = String(count).length;
    gutter.style.setProperty("--editor-gutter-digits", String(digits));
    if (gutter.childElementCount === count) {
      return;
    }
    const fragment = document.createDocumentFragment();
    for (let n = 1; n <= count; n += 1) {
      const line = document.createElement("span");
      line.className = "editor__line-number";
      line.textContent = String(n);
      fragment.append(line);
    }
    gutter.replaceChildren(fragment);
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
      const gutter = body.querySelector(".editor__gutter");
      if (textarea && textarea.value !== view.draft) {
        textarea.value = view.draft;
      }
      if (gutter) {
        paintLineNumbers(gutter, view.draft);
      }
      return;
    }

    clearSaveTimer();
    body.replaceChildren();

    const pane = document.createElement("div");
    pane.className = "editor__pane";

    const gutter = document.createElement("div");
    gutter.className = "editor__gutter";
    gutter.setAttribute("aria-hidden", "true");

    const textarea = document.createElement("textarea");
    textarea.className = "editor__textarea";
    textarea.spellcheck = false;
    textarea.value = view.draft;
    textarea.addEventListener("input", () => {
      view.draft = textarea.value;
      paintLineNumbers(gutter, view.draft);
      scheduleSave();
    });
    textarea.addEventListener("scroll", () => {
      gutter.scrollTop = textarea.scrollTop;
    });

    paintLineNumbers(gutter, view.draft);
    pane.append(gutter, textarea);
    body.append(pane);
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
