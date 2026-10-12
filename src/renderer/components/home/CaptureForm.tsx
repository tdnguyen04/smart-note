import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { COPY, TIMINGS_MS, type FocusId } from "../../../shared/globals";
import { composeFrontmatter } from "../../../shared/focus";
import { refreshTree } from "../../commands";
import { getState, useAppState } from "../../state";
import { Button } from "../../ui/button";
import { cx } from "../../ui/cx";
import { armSavedSound } from "./savedSound";

/**
 * The text box and Save button. The draft lives here, not in Home, so a keystroke
 * re-renders this small form and nothing else (the tags and hint are passed in as
 * elements Home already built, which React reuses as-is).
 */

type CaptureFormProps = {
  focusId: FocusId | null;
  saving: boolean;
  onSavingChange: (saving: boolean) => void;
  onSaved: (path: string) => void;
  /** The hint bar or hint button, shown inside the box above the text. */
  hint: ReactNode;
  hintOpen: boolean;
};

export function CaptureForm({ focusId, saving, onSavingChange, onSaved, hint, hintOpen }: CaptureFormProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isHome = useAppState((s) => s.mode === "home");

  // Arriving on Compose puts the cursor in the box.
  useEffect(() => {
    if (isHome) {
      focusInputSoon(inputRef.current);
    }
  }, [isHome]);

  // The green "saved" state on the button clears itself.
  useEffect(() => {
    if (!justSaved) {
      return;
    }
    const timer = window.setTimeout(() => {
      setJustSaved(false);
    }, TIMINGS_MS.successFlash);
    return () => {
      window.clearTimeout(timer);
    };
  }, [justSaved]);

  async function save(): Promise<void> {
    const vaultPath = getState().vaultPath;
    if (!draft.trim() || saving || !vaultPath) {
      return;
    }
    // Arm the sound inside the click/keypress, while the browser still allows audio to start.
    const playSavedSound = armSavedSound();
    onSavingChange(true);
    setError("");
    try {
      const result = await window.smartnote.createNote(vaultPath, composeFrontmatter({ focusId, body: draft }));
      if (!result.ok) {
        setError(result.message || COPY.home.saveFailed);
        return;
      }
      setDraft("");
      setJustSaved(true);
      onSaved(result.path);
      refreshTree();
      playSavedSound();
      focusInputSoon(inputRef.current);
    } catch (caught) {
      console.error(caught);
      setError(COPY.home.saveFailed);
    } finally {
      onSavingChange(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void save();
    }
  }

  return (
    <>
      <div className="relative rounded-lg border border-line-strong bg-surface transition-colors hover:border-ink-subtle focus-within:border-line-strong">
        {hint}
        <textarea
          ref={inputRef}
          value={draft}
          placeholder={COPY.home.placeholder}
          aria-label={COPY.home.inputLabel}
          disabled={saving}
          spellCheck
          rows={4}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) {
              setError("");
            }
          }}
          onKeyDown={onKeyDown}
          className={cx(
            // field-sizing grows the box with the text, up to max-h, with no JS measuring.
            "block max-h-64 min-h-32 w-full resize-none bg-transparent py-3 pl-4 font-serif text-md text-ink outline-none [field-sizing:content] placeholder:text-ink-subtle",
            hintOpen ? "pr-4" : "pr-11",
          )}
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button
          success={justSaved}
          disabled={saving || !draft.trim()}
          title={`${COPY.home.save} (Ctrl+Enter)`}
          onClick={() => void save()}
        >
          {COPY.home.save}
        </Button>
      </div>
    </>
  );
}

/** Focus after the current frame, once the box is visible and enabled again. */
function focusInputSoon(input: HTMLTextAreaElement | null): void {
  requestAnimationFrame(() => {
    input?.focus({ preventScroll: true });
  });
}
