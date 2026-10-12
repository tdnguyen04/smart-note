import { EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { memo, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { parseCaptureName } from "../../../shared/captureName";
import { formatCaptureStamp } from "../../../shared/captureTime";
import { formatEntryTitle } from "../../../shared/entryTitle";
import { splitFrontmatter } from "../../../shared/focus";
import { COPY, TIMINGS_MS } from "../../../shared/globals";
import { baseName } from "../../../shared/paths";
import { useAppState } from "../../state";
import { createAutosave, type Autosave } from "./autosave";
import { noteExtensions } from "./noteEditor";

/**
 * Organize's reading and writing pane for the selected note.
 *
 * Latency rule: React renders this component when the *note* changes, never when the
 * *text* changes. CodeMirror is created once and owns the text; switching notes swaps
 * its state in place. Edits flow to autosave and to the header title outside React,
 * and the header re-renders only when the title string actually changes.
 *
 * Frontmatter (the focus tag) is hidden from the text and written back unchanged.
 */

type Pane =
  | { status: "empty" }
  | { status: "note"; path: string }
  | { status: "unsupported"; path: string }
  | { status: "error"; path: string | null; message: string };

/** The live editor and the note it is showing. `path` is null while no note is editable. */
type Session = {
  view: EditorView;
  /** Fixed for the view's life; reused on every note swap so plugins aren't rebuilt. */
  extensions: Extension[];
  autosave: Autosave;
  path: string | null;
  /** The hidden frontmatter, written back in front of the text on save. */
  prefix: string;
};

/** How much of the note the header title needs; avoids stringifying long notes per keystroke. */
const TITLE_SOURCE_CHARS = 400;

export const Editor = memo(function Editor() {
  const selectedPath = useAppState((s) => s.selectedFilePath);
  const [pane, setPane] = useState<Pane>({ status: "empty" });
  const [title] = useState(createTitleStore);
  const host = useRef<HTMLDivElement>(null);
  const session = useRef<Session | null>(null);

  // Create CodeMirror once. Everything per-note goes through `session`.
  useEffect(() => {
    const parent = host.current;
    if (!parent) {
      return;
    }
    const autosave = createAutosave((path, content) => window.smartnote.writeFile(path, content), TIMINGS_MS.autosave);
    const extensions = noteExtensions({
      label: COPY.editor.textLabel,
      onChange: (update) => {
        const current = session.current;
        if (!current?.path) {
          return;
        }
        // Text is immutable in CodeMirror: capturing it here is free and pins the write
        // to exactly this version, even if another note is loaded before the timer fires.
        const { doc } = update.state;
        const { path, prefix } = current;
        title.set(formatEntryTitle(doc.sliceString(0, TITLE_SOURCE_CHARS)));
        autosave.schedule(path, () => prefix + doc.toString());
      },
    });
    const view = new EditorView({ parent, state: EditorState.create({ extensions }) });
    session.current = { view, extensions, autosave, path: null, prefix: "" };

    return () => {
      void autosave.flush();
      view.destroy();
      session.current = null;
    };
  }, [title]);

  // Load the selected note. A slower load for an older selection is dropped.
  useEffect(() => {
    let stale = false;

    async function open(): Promise<void> {
      const current = session.current;
      if (!current) {
        return;
      }
      if (!selectedPath) {
        await current.autosave.flush();
        current.path = null;
        setPane({ status: "empty" });
        return;
      }
      const result = await window.smartnote.readFile(selectedPath);
      // The old note stays editable while this loads; save what was typed before swapping.
      await current.autosave.flush();
      if (stale) {
        return;
      }
      current.path = null;
      if (!result.ok) {
        setPane(
          result.reason === "binary"
            ? { status: "unsupported", path: selectedPath }
            : {
                status: "error",
                path: selectedPath,
                message: "message" in result ? result.message : COPY.editor.openFailed,
              },
        );
        return;
      }
      const note = splitFrontmatter(result.content);
      current.autosave.markSaved(result.content);
      current.path = selectedPath;
      current.prefix = note.prefix;
      current.view.setState(EditorState.create({ doc: note.body, extensions: current.extensions }));
      title.set(formatEntryTitle(note.body.slice(0, TITLE_SOURCE_CHARS)));
      setPane({ status: "note", path: selectedPath });
      current.view.focus();
    }

    open().catch((error: unknown) => {
      console.error(error);
      if (!stale) {
        setPane({ status: "error", path: selectedPath, message: COPY.editor.openError });
      }
    });
    return () => {
      stale = true;
    };
  }, [selectedPath, title]);

  return (
    <section className="flex h-full flex-col">
      <EditorHeader pane={pane} title={title} />
      <div className="relative min-h-0 flex-1">
        {/* CodeMirror's host stays mounted; hiding it keeps the view alive between notes. */}
        <div ref={host} hidden={pane.status !== "note"} className="h-full" />
        {pane.status !== "note" && <PaneMessage pane={pane} />}
      </div>
    </section>
  );
});

function PaneMessage({ pane }: { pane: Exclude<Pane, { status: "note" }> }) {
  const text =
    pane.status === "empty"
      ? COPY.editor.selectFile
      : pane.status === "unsupported"
        ? COPY.editor.unsupported
        : pane.message;
  return <p className="p-6 text-ink-muted">{text}</p>;
}

const EditorHeader = memo(function EditorHeader({ pane, title }: { pane: Pane; title: TitleStore }) {
  const liveTitle = useSyncExternalStore(title.subscribe, title.get);
  const path = pane.status === "empty" ? null : pane.path;
  const captured = path ? parseCaptureName(baseName(path)) : null;

  const heading =
    pane.status === "note" ? liveTitle || COPY.editor.untitled : path ? baseName(path) : COPY.editor.noFile;

  return (
    <header className="flex h-toolbar shrink-0 items-center gap-2 border-b border-line bg-surface px-4">
      <span className="min-w-0 truncate font-medium" title={path ?? undefined}>
        {heading}
      </span>
      {pane.status === "note" && captured && (
        <span className="shrink-0 text-2xs text-ink-subtle tabular-nums">{formatCaptureStamp(captured.date)}</span>
      )}
    </header>
  );
});

type TitleStore = {
  get: () => string;
  set: (next: string) => void;
  subscribe: (listener: () => void) => () => void;
};

/** A one-value store for the header title. `set` with the same string notifies no one. */
function createTitleStore(): TitleStore {
  let value = "";
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      if (next === value) {
        return;
      }
      value = next;
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
