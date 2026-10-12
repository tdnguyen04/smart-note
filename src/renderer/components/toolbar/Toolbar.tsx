import { FolderOpen, RotateCcw, Settings } from "lucide-react";
import { memo } from "react";
import { COPY } from "../../../shared/globals";
import { baseName } from "../../../shared/paths";
import { useAppState } from "../../state";
import { promptNewSession, resetSavedVault } from "../../transactions/vaultSession";
import { IconButton } from "../../ui/button";
import { Icon } from "../../ui/icon";
import { Menu, MenuItem } from "../../ui/menu";

/** The bar above the file tree: the open folder's name and the settings menu. */

export const Toolbar = memo(function Toolbar() {
  const folderName = useAppState((s) => baseName(s.vaultPath));

  return (
    <header className="flex h-toolbar shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3">
      <span className="min-w-0 truncate font-semibold" title={folderName}>
        {folderName}
      </span>
      <Menu trigger={<IconButton icon={Settings} label={COPY.toolbar.settings} variant="outline" />}>
        <MenuItem onSelect={() => void promptNewSession()}>
          <Icon icon={FolderOpen} className="text-ink-muted" />
          {COPY.toolbar.changeFolder}
        </MenuItem>
        <MenuItem onSelect={() => void resetSavedVault()}>
          <Icon icon={RotateCcw} className="text-ink-muted" />
          {COPY.toolbar.resetFolder}
        </MenuItem>
      </Menu>
    </header>
  );
});
