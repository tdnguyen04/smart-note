import { memo, useEffect, useState } from "react";
import { COPY, FOCUS_CHIPS_BEFORE_MORE, FOCUSES, TIMINGS_MS, type FocusId } from "../../../shared/globals";
import { pickPrompt } from "../../../shared/focus";
import { openCapturedNote } from "../../commands";
import { CaptureForm } from "./CaptureForm";
import { FocusTags } from "./FocusTags";
import { HintBar, HintButton } from "./Hint";
import { SavedToast } from "./SavedToast";
import { VaultLine } from "./VaultLine";

/**
 * Compose: record a source quickly. Home owns the choices around the text (focus tag,
 * prompt, the saved toast); CaptureForm owns the text itself, so typing never re-renders Home.
 * Stays mounted while Organize shows, so a half-written draft survives switching.
 */

const FIRST_CHIPS: readonly FocusId[] = FOCUSES.slice(0, FOCUS_CHIPS_BEFORE_MORE).map((focus) => focus.id);

export const Home = memo(function Home() {
  const [focusId, setFocusId] = useState<FocusId | null>(null);
  const [visibleIds, setVisibleIds] = useState<readonly FocusId[]>(FIRST_CHIPS);
  const [hint, setHint] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);

  // The toast hides itself; a newer save restarts the clock.
  useEffect(() => {
    if (!savedPath) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSavedPath(null);
    }, TIMINGS_MS.nudge);
    return () => {
      window.clearTimeout(timer);
    };
  }, [savedPath]);

  /** Changing focus re-picks an open prompt so it matches the new topic. */
  function chooseFocus(next: FocusId | null): void {
    setFocusId(next);
    if (hint) {
      setHint(pickPrompt(next, hint));
    }
  }

  function onSavingChange(next: boolean): void {
    setSaving(next);
    if (next) {
      setSavedPath(null);
    }
  }

  const hintSlot = hint ? (
    <HintBar
      question={hint}
      focusChosen={focusId !== null}
      disabled={saving}
      onShuffle={() => {
        setHint(pickPrompt(focusId, hint));
      }}
      onClose={() => {
        setHint("");
      }}
    />
  ) : (
    <HintButton
      disabled={saving}
      onOpen={() => {
        setHint(pickPrompt(focusId, ""));
      }}
    />
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-surface px-8 py-6">
      <div className="flex w-full max-w-capture flex-col gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-lg font-semibold tracking-tight">{COPY.home.headline}</h1>
          <VaultLine />
        </header>

        <div className="group/capture flex flex-col gap-3">
          <FocusTags
            visibleIds={visibleIds}
            selectedId={focusId}
            disabled={saving}
            onToggle={(id) => {
              chooseFocus(focusId === id ? null : id);
            }}
            onPickFromMore={(id) => {
              setVisibleIds([...visibleIds.slice(0, FOCUS_CHIPS_BEFORE_MORE - 1), id]);
              chooseFocus(id);
            }}
          />
          <CaptureForm
            focusId={focusId}
            saving={saving}
            onSavingChange={onSavingChange}
            onSaved={(path) => {
              setHint("");
              setSavedPath(path);
            }}
            hint={hintSlot}
            hintOpen={hint !== ""}
          />
        </div>
      </div>

      {savedPath && (
        <SavedToast
          onOpen={() => {
            setSavedPath(null);
            openCapturedNote(savedPath);
          }}
          onDismiss={() => {
            setSavedPath(null);
          }}
        />
      )}
    </div>
  );
});
