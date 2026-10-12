import { CircleUser, FolderTree, PenLine } from "lucide-react";
import { memo } from "react";
import { COPY } from "../../../shared/globals";
import { enterHome, enterOrganize } from "../../commands";
import { useAppState } from "../../state";
import { IconButton } from "../../ui/button";

/** The narrow column on the left that switches between Compose (home) and Organize. */

export const Rail = memo(function Rail() {
  const mode = useAppState((s) => s.mode);

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
      <IconButton
        icon={FolderTree}
        label={COPY.rail.organize}
        size="md"
        tooltipSide="right"
        pressed={mode === "organize"}
        onClick={enterOrganize}
      />
      <div className="mt-auto">
        {/* Placeholder: profile has no screen yet. */}
        <IconButton icon={CircleUser} label={COPY.rail.profile} size="md" tooltipSide="right" />
      </div>
    </nav>
  );
});
