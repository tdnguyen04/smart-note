import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COPY } from "../../../shared/globals";
import type { TreeNode } from "../../../shared/ipc";
import { useAppState } from "../../state";
import { loadTree } from "./loadTree";
import { DayRow, DirRow, FileRow } from "./TreeRows";
import { EMPTY_EXPANSION, flattenVisible, mergeTree, type Expansion } from "./treeModel";

/**
 * The file tree for the open vault. It owns the loaded tree and which groups are open;
 * the selected note lives in app state.
 *
 * Reloads when the vault changes (and resets expansion) or when `treeEpoch` is bumped
 * (keeps expansion). A reload that finishes after a newer one started is dropped.
 */

const NO_TREE: readonly TreeNode[] = [];

export const Sidebar = memo(function Sidebar() {
  const vaultPath = useAppState((s) => s.vaultPath);
  const treeEpoch = useAppState((s) => s.treeEpoch);
  const [loaded, setLoaded] = useState<{ vaultPath: string; tree: readonly TreeNode[] } | null>(null);
  const [expansion, setExpansion] = useState<Expansion>(EMPTY_EXPANSION);
  const loadedVault = useRef<string | null>(null);

  useEffect(() => {
    if (!vaultPath) {
      // Reopening the same folder after a reset should start collapsed again.
      loadedVault.current = null;
      return;
    }
    let stale = false;
    loadTree(vaultPath)
      .then((next) => {
        if (stale) {
          return;
        }
        if (loadedVault.current !== vaultPath) {
          loadedVault.current = vaultPath;
          setExpansion(EMPTY_EXPANSION);
        }
        setLoaded((previous) => ({
          vaultPath,
          tree: previous?.vaultPath === vaultPath ? mergeTree(previous.tree, next) : next,
        }));
      })
      .catch((error: unknown) => {
        if (!stale) {
          console.error(error);
          setLoaded({ vaultPath, tree: NO_TREE });
        }
      });
    return () => {
      stale = true;
    };
  }, [vaultPath, treeEpoch]);

  // A tree loaded for another vault is never shown, even for the instant before the new one arrives.
  const tree = loaded && loaded.vaultPath === vaultPath ? loaded.tree : NO_TREE;
  const rows = useMemo(
    () => flattenVisible(tree, vaultPath ?? "", expansion, new Date()),
    [tree, vaultPath, expansion],
  );

  // Rows report the state they want, so "today is open by default" needs no special case here.
  const setDirOpen = useCallback((path: string, open: boolean) => {
    setExpansion((current) => {
      const dirs = new Set(current.dirs);
      if (open) {
        dirs.add(path);
      } else {
        dirs.delete(path);
      }
      return { ...current, dirs };
    });
  }, []);

  const setDayOpen = useCallback((key: string, open: boolean) => {
    setExpansion((current) => ({ ...current, days: new Map(current.days).set(key, open) }));
  }, []);

  return (
    <nav aria-label={COPY.sidebar.label} className="py-2">
      <ul className="px-1">
        {rows.map((row) => {
          switch (row.kind) {
            case "dir":
              return (
                <DirRow
                  key={row.key}
                  rowKey={row.key}
                  depth={row.depth}
                  name={row.name}
                  open={row.open}
                  onToggle={setDirOpen}
                />
              );
            case "day":
              return (
                <DayRow
                  key={row.key}
                  rowKey={row.key}
                  depth={row.depth}
                  label={row.label}
                  open={row.open}
                  onToggle={setDayOpen}
                />
              );
            case "file":
              return (
                <FileRow
                  key={row.key}
                  depth={row.depth}
                  node={row.node}
                  captured={row.captured}
                  title={row.title}
                  meta={row.meta}
                />
              );
          }
        })}
      </ul>
    </nav>
  );
});

