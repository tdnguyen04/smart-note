import { X } from "lucide-react";
import { COPY } from "../../../shared/globals";
import { Icon } from "../../ui/icon";

/** The "Saved." toast after a capture, with a shortcut to open the note. Home decides when it shows. */

type SavedToastProps = {
  onOpen: () => void;
  onDismiss: () => void;
};

const TOAST_BUTTON =
  "rounded-sm px-2 py-1 font-medium transition-colors hover:bg-on-inverse/10 focus-visible:outline-inverse-accent";

export function SavedToast({ onOpen, onDismiss }: SavedToastProps) {
  return (
    <div
      role="status"
      className="fixed bottom-8 left-1/2 z-40 flex max-w-[min(36rem,calc(100vw-4rem))] -translate-x-1/2 animate-fade-in items-center gap-3 rounded-lg bg-inverse py-2 pr-2 pl-4 text-on-inverse shadow-toast"
    >
      <span className="min-w-0 flex-1">{COPY.home.saved}</span>
      <button type="button" onClick={onOpen} className={`${TOAST_BUTTON} text-inverse-accent`}>
        {COPY.home.openInOrganize}
      </button>
      <button
        type="button"
        aria-label={COPY.home.dismiss}
        onClick={onDismiss}
        className={`${TOAST_BUTTON} text-on-inverse/75 hover:text-on-inverse`}
      >
        <Icon icon={X} />
      </button>
    </div>
  );
}
