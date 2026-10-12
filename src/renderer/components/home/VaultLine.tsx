import { Folder } from "lucide-react";
import { COPY } from "../../../shared/globals";
import { baseName } from "../../../shared/paths";
import { useAppState } from "../../state";
import { promptNewSession } from "../../transactions/vaultSession";
import { Icon } from "../../ui/icon";

/** "Saving to <folder>" under the headline. The folder name is a link to change folders. */
export function VaultLine() {
  const folderName = useAppState((s) => baseName(s.vaultPath));
  if (!folderName) {
    return null;
  }
  return (
    <p
      title={folderName}
      className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-sm border border-line bg-surface-muted px-2 py-0.5 text-xs text-ink-muted"
    >
      <Icon icon={Folder} size="sm" />
      <span className="min-w-0 truncate">
        {COPY.home.savingTo}
        <button
          type="button"
          title={COPY.home.changeFolder}
          aria-label={`${COPY.home.changeFolder}: ${folderName}`}
          onClick={() => void promptNewSession()}
          className="font-medium text-ink underline decoration-ink/35 underline-offset-2 hover:decoration-ink"
        >
          {folderName}
        </button>
      </span>
    </p>
  );
}
