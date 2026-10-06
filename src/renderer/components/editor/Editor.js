import { subscribe } from "../../state.js";
import { splitNoteContent } from "../../utils/captureFocuses.js";
import { entryTitle } from "../../utils/entryTitle.js";

const CAPTURE_NAME =
  /^(\d{4})-(\d{2})-(\d{2}) (\d{2})\.(\d{2}) Note(?: \((\d+)\))?\.md$/;

/**
 * Mounts the note editor into root.
 * The draft string is the note body. Autosave writes that string, not the textarea.
 * A focus block stays in the file and is not shown.
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

  const meta = document.createElement("span");
  meta.className = "editor__meta";
  meta.hidden = true;
  titlebar.append(title, meta);

  const body = document.createElement("div");
  body.className = "editor__body";

  root.append(titlebar, body);

  /** @type {{ status: "empty" | "raw" | "unsupported" | "error", path: string | null, draft: string, metaPrefix: string, message: string }} */
  let view = { status: "empty", path: null, draft: "", metaPrefix: "", message: "" };
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

  function paintHeading() {
    meta.hidden = true;
    meta.textContent = "";
    if (view.status === "empty" || !view.path) {
      title.textContent = "No file open";
      title.removeAttribute("title");
      return;
    }
    title.title = view.path;
    if (view.status !== "raw") {
      title.textContent = fileNameFromPath(view.path);
      return;
    }
    title.textContent = entryTitle(view.draft) || "Untitled";
    const when = captureStamp(view.path);
    if (when) {
      meta.hidden = false;
      meta.textContent = when;
    }
  }

  function captureStamp(filePath) {
    const match = CAPTURE_NAME.exec(fileNameFromPath(filePath));
    if (!match) {
      return "";
    }
    const year = Number(match[1]);
    const shown = new Date(
      year,
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5])
    );
    const sameYear = year === new Date().getFullYear();
    const day = shown.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: sameYear ? undefined : "numeric",
    });
    const hours = Number(match[4]);
    const minutes = String(match[5]).padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${day} · ${hour12}:${minutes} ${period}`;
  }

  function clearSaveTimer() {
    if (saveTimer !== null) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
  }

  function fileContent(body) {
    return `${view.metaPrefix || ""}${body}`;
  }

  async function persist(filePath, body) {
    const content = fileContent(body);
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

  const measure = document.createElement("div");
  measure.className = "editor__measure";
  measure.setAttribute("aria-hidden", "true");
  root.append(measure);

  const resizeObserver = new ResizeObserver(() => {
    const textarea = body.querySelector(".editor__textarea");
    const gutter = body.querySelector(".editor__gutter");
    if (textarea && gutter) {
      paintLineNumbers(gutter, textarea);
    }
  });

  function wrappedRows(line, contentWidth) {
    if (contentWidth <= 0 || line.length === 0) {
      return 1;
    }
    measure.style.width = `${contentWidth}px`;
    measure.textContent = line;
    const lineHeight = parseFloat(getComputedStyle(measure).lineHeight);
    if (!lineHeight) {
      return 1;
    }
    return Math.max(1, Math.round(measure.getBoundingClientRect().height / lineHeight));
  }

  function paintLineNumbers(gutter, textarea) {
    const text = textarea.value;
    const style = getComputedStyle(textarea);
    const contentWidth =
      textarea.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    const lines = text.split("\n");
    const digits = String(Math.max(lines.length, 1)).length;
    gutter.style.setProperty("--editor-gutter-digits", String(digits));

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < lines.length; index += 1) {
      const number = document.createElement("span");
      number.className = "editor__line-number";
      number.textContent = String(index + 1);
      fragment.append(number);
      const extra = wrappedRows(lines[index], contentWidth) - 1;
      for (let row = 0; row < extra; row += 1) {
        const blank = document.createElement("span");
        blank.className = "editor__line-number editor__line-number--wrap";
        fragment.append(blank);
      }
    }
    gutter.replaceChildren(fragment);
  }

  function render() {
    paintHeading();

    if (view.status !== "raw") {
      mountedPath = null;
      resizeObserver.disconnect();
      clearSaveTimer();
      body.replaceChildren();
      const message = document.createElement("p");
      if (view.status === "empty") {
        message.className = "editor__hint";
        message.textContent = "Select a file to read it.";
      } else if (view.status === "unsupported") {
        message.className = "editor__message";
        message.textContent = "Folio can’t edit this file type yet.";
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
      if (textarea && gutter) {
        paintLineNumbers(gutter, textarea);
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
      paintHeading();
      paintLineNumbers(gutter, textarea);
      scheduleSave();
    });
    textarea.addEventListener("scroll", () => {
      gutter.scrollTop = textarea.scrollTop;
    });

    pane.append(gutter, textarea);
    body.append(pane);
    resizeObserver.disconnect();
    resizeObserver.observe(textarea);
    paintLineNumbers(gutter, textarea);
    mountedPath = view.path;

    textarea.focus();
    textarea.setSelectionRange(0, 0);
  }

  function showError(text) {
    view = {
      status: "error",
      path: view.path,
      draft: "",
      metaPrefix: "",
      message: text,
    };
    lastSavedContent = "";
    render();
  }

  async function openFile(filePath) {
    await flushSave();

    if (!filePath) {
      view = { status: "empty", path: null, draft: "", metaPrefix: "", message: "" };
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
          metaPrefix: "",
          message: "",
        };
      } else {
        view = {
          status: "error",
          path: filePath,
          draft: "",
          metaPrefix: "",
          message: result?.message || "Could not open this file.",
        };
      }
      render();
      return;
    }

    const note = splitNoteContent(result.content);
    view = {
      status: "raw",
      path: filePath,
      draft: note.body,
      metaPrefix: note.prefix,
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
