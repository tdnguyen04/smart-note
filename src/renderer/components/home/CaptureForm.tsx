import { Check } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { COPY, TIMINGS_MS, type FocusId } from "../../../shared/globals";
import { composeFrontmatter } from "../../../shared/focus";
import { noteLanded, refreshTree } from "../../commands";
import { getState, useAppState } from "../../state";
import { Button } from "../../ui/button";
import { cx } from "../../ui/cx";
import { flyNote } from "../../ui/flight";
import { Icon } from "../../ui/icon";
import { playSaveChime, warmUpChime } from "./saveChime";

/**
 * The text box and Save button. The draft lives here, not in Home, so a keystroke
 * re-renders this small form and nothing else (the tags and hint are passed in as
 * elements Home already built, which React reuses as-is).
 *
 * A save is rewarded three ways at once: a chime, the button turning into "Saved",
 * and the note's card flying into Organize, which then counts it on the rail badge.
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
    // Where the text sits now is where its card takes off from.
    const takeoff = inputRef.current?.getBoundingClientRect();
    const text = draft;
    onSavingChange(true);
    setError("");
    try {
      const result = await window.smartnote.createNote(vaultPath, composeFrontmatter({ focusId, body: text }));
      if (!result.ok) {
        setError(result.message || COPY.home.saveFailed);
        return;
      }
      playSaveChime();
      setDraft("");
      setJustSaved(true);
      onSaved(result.path);
      refreshTree();
      focusInputSoon(inputRef.current);
      if (takeoff) {
        void flyNote({ from: takeoff, text, to: "organize" }).then(noteLanded);
      } else {
        noteLanded();
      }
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
            // Opening the audio device while the person writes means the chime is instant on save.
            warmUpChime();
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
          {justSaved ? (
            <>
              <Icon icon={Check} />
              {COPY.home.savedButton}
            </>
          ) : (
            COPY.home.save
          )}
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
