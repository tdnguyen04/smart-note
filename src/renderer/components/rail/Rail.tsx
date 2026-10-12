import { CircleUser, FolderTree, PenLine } from "lucide-react";
import { memo } from "react";
import { COPY } from "../../../shared/globals";
import { enterHome, enterOrganize } from "../../commands";
import { useAppState } from "../../state";
import { IconButton } from "../../ui/button";

/** The narrow column on the left that switches between Compose (home) and Organize. */

export const Rail = memo(function Rail() {
  const mode = useAppState((s) => s.mode);
  const unseen = useAppState((s) => s.unseenCaptures);
  const organizeLabel =
    unseen > 0
      ? `${COPY.rail.organize}, ${String(unseen)} ${unseen === 1 ? COPY.rail.newNote : COPY.rail.newNotes}`
      : COPY.rail.organize;

  return (
    <nav
      aria-label={COPY.rail.label}
      className="flex w-rail shrink-0 flex-col items-center gap-2 border-r border-line bg-surface-muted py-2"
    >
      <IconButton
        icon={PenLine}
        label={COPY.rail.compose}
        size="md"
        tooltipSide="right"
        pressed={mode === "home"}
        onClick={enterHome}
      />
      {/* Saved notes fly here (ui/flight) and are counted until Organize is opened. */}
      <div className="relative" data-flight-target="organize">
        <IconButton
          icon={FolderTree}
          label={organizeLabel}
          size="md"
          tooltipSide="right"
          pressed={mode === "organize"}
          onClick={enterOrganize}
        />
        {unseen > 0 && (
          <span
            key={unseen}
            aria-hidden="true"
            className="pointer-events-none absolute -top-1 -right-1 h-4 min-w-4 animate-pop rounded-full bg-ink px-1 text-center text-2xs leading-4 font-semibold text-surface tabular-nums"
          >
            {unseen > 9 ? "9+" : unseen}
          </span>
        )}
      </div>
      <div className="mt-auto">
        {/* Placeholder: profile has no screen yet. */}
        <IconButton icon={CircleUser} label={COPY.rail.profile} size="md" tooltipSide="right" />
      </div>
    </nav>
  );
});
