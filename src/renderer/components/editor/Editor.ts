import { COPY, TIMINGS_MS } from "../../../shared/globals";
import { parseCaptureName } from "../../../shared/captureName";
import { formatEntryTitle } from "../../../shared/entryTitle";
import { splitFrontmatter } from "../../../shared/focus";
import { subscribe } from "../../state";

type EditorStatus = "empty" | "raw" | "unsupported" | "error";

type EditorView = {
  status: EditorStatus;
  path: string | null;
  draft: string;
  metaPrefix: string;
  message: string;
};

export function mountEditor(root: HTMLElement): void {
  root.classList.add("editor");
  root.replaceChildren();

  const titlebar = document.createElement("div");
  titlebar.className = "editor__titlebar";

  const title = document.createElement("span");
  title.className = "editor__filename";
  title.textContent = COPY.editor.noFile;

  const meta = document.createElement("span");
  meta.className = "editor__meta";
  meta.hidden = true;
  titlebar.append(title, meta);

  const body = document.createElement("div");
  body.className = "editor__body";

  root.append(titlebar, body);

  let view: EditorView = { status: "empty", path: null, draft: "", metaPrefix: "", message: "" };
  let mountedPath: string | null = null;
  let lastSavedContent = "";
  let saveTimer: number | null = null;
  let saveInFlight: Promise<unknown> | null = null;

  function fileNameFromPath(filePath: string | null): string {
    if (!filePath) {
      return COPY.editor.noFile;
    }
    const normalized = filePath.replace(/[\\/]+$/, "");
    const parts = normalized.split(/[\\/]/);
    return parts[parts.length - 1] || filePath;
  }

  function paintHeading(): void {
    meta.hidden = true;
    meta.textContent = "";
    if (view.status === "empty" || !view.path) {
      title.textContent = COPY.editor.noFile;
      title.removeAttribute("title");
      return;
    }
    title.title = view.path;
    if (view.status !== "raw") {
      title.textContent = fileNameFromPath(view.path);
      return;
    }
    title.textContent = formatEntryTitle(view.draft) || COPY.editor.untitled;
    const when = captureStamp(view.path);
    if (when) {
      meta.hidden = false;
      meta.textContent = when;
    }
  }

  function captureStamp(filePath: string): string {
    const parsed = parseCaptureName(fileNameFromPath(filePath));
    if (!parsed) {
      return "";
    }
    const year = parsed.date.getFullYear();
    const sameYear = year === new Date().getFullYear();
    const format: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    if (!sameYear) {
      format.year = "numeric";
    }
    const day = parsed.date.toLocaleDateString(undefined, format);
    const hours = parsed.date.getHours();
    const minutes = String(parsed.date.getMinutes()).padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${day} · ${hour12}:${minutes} ${period}`;
  }

  function clearSaveTimer(): void {
    if (saveTimer !== null) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
  }

  function fileContent(noteBody: string): string {
    return `${view.metaPrefix || ""}${noteBody}`;
  }

  async function persist(filePath: string | null, noteBody: string): Promise<{ ok: boolean; skipped?: boolean }> {
    const content = fileContent(noteBody);
    if (!filePath || content === lastSavedContent) {
      return { ok: true, skipped: true };
    }

    const result = await window.smartnote.writeFile(filePath, content);
    if (result.ok) {
      lastSavedContent = content;
    }
    return result;
  }

  async function flushSave(): Promise<void> {
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

  function scheduleSave(): void {
    clearSaveTimer();
    const pathToSave = view.path;
    const content = view.draft;
    saveTimer = window.setTimeout(() => {
      saveTimer = null;
      if (view.status !== "raw" || view.path !== pathToSave) {
        return;
      }
      saveInFlight = persist(pathToSave, content).finally(() => {
        saveInFlight = null;
      });
    }, TIMINGS_MS.autosave);
  }

  const measure = document.createElement("div");
  measure.className = "editor__measure";
  measure.setAttribute("aria-hidden", "true");
  root.append(measure);

  const resizeObserver = new ResizeObserver(() => {
    const textarea = body.querySelector(".editor__textarea");
    const gutter = body.querySelector(".editor__gutter");
    if (textarea instanceof HTMLTextAreaElement && gutter instanceof HTMLElement) {
      paintLineNumbers(gutter, textarea);
    }
  });

  function wrappedRows(line: string, contentWidth: number): number {
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

  function paintLineNumbers(gutter: HTMLElement, textarea: HTMLTextAreaElement): void {
    const text = textarea.value;
    const style = getComputedStyle(textarea);
    const contentWidth =
      textarea.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const lines = text.split("\n");
    const digits = String(Math.max(lines.length, 1)).length;
    gutter.style.setProperty("--editor-gutter-digits", String(digits));

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < lines.length; index += 1) {
      const number = document.createElement("span");
      number.className = "editor__line-number";
      number.textContent = String(index + 1);
      fragment.append(number);
      const line = lines[index] ?? "";
      const extra = wrappedRows(line, contentWidth) - 1;
      for (let row = 0; row < extra; row += 1) {
        const blank = document.createElement("span");
        blank.className = "editor__line-number editor__line-number--wrap";
        fragment.append(blank);
      }
    }
    gutter.replaceChildren(fragment);
  }

  function render(): void {
    paintHeading();

    if (view.status !== "raw") {
      mountedPath = null;
      resizeObserver.disconnect();
      clearSaveTimer();
      body.replaceChildren();
      const message = document.createElement("p");
      if (view.status === "empty") {
        message.className = "editor__hint";
        message.textContent = COPY.editor.selectFile;
      } else if (view.status === "unsupported") {
        message.className = "editor__message";
        message.textContent = COPY.editor.unsupported;
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
      if (textarea instanceof HTMLTextAreaElement && textarea.value !== view.draft) {
        textarea.value = view.draft;
      }
      if (textarea instanceof HTMLTextAreaElement && gutter instanceof HTMLElement) {
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

  function showError(text: string): void {
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

  async function openFile(filePath: string | null): Promise<void> {
    await flushSave();

    if (!filePath) {
      view = { status: "empty", path: null, draft: "", metaPrefix: "", message: "" };
      lastSavedContent = "";
      render();
      return;
    }

    const result = await window.smartnote.readFile(filePath);
    if (!result.ok) {
      lastSavedContent = "";
      if (result.reason === "binary") {
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
          message: "message" in result ? result.message : COPY.editor.openFailed,
        };
      }
      render();
      return;
    }

    const note = splitFrontmatter(result.content);
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

  subscribe(
    (s) => s.selectedFilePath,
    (selectedFilePath) => {
      void openFile(selectedFilePath).catch((error: unknown) => {
        console.error(error);
        showError(COPY.editor.openError);
      });
    },
  );
}
