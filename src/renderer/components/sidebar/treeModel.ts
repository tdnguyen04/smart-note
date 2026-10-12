import { COPY } from "../../../shared/globals";
import { dateKey, formatClock, formatDayLabel } from "../../../shared/captureTime";
import { parseCaptureName } from "../../../shared/captureName";
import { formatEntryTitle } from "../../../shared/entryTitle";
import type { DirNode, FileNode, TreeNode } from "../../../shared/ipc";

/**
 * Pure tree logic for the sidebar: no React, no IPC. Unit-tested in treeModel.test.ts.
 *
 * The vault tree comes from main as nested nodes. The sidebar shows it as one flat list
 * of visible rows: folders first, then captured notes grouped by day (newest first),
 * then every other file. Flat rows render as a single keyed list, which keeps React's
 * work proportional to what changed and makes virtualization a drop-in later.
 */

/** Which folders and day groups the person opened or closed. Day groups default to open only for today. */
export type Expansion = {
  dirs: ReadonlySet<string>;
  days: ReadonlyMap<string, boolean>;
};

export const EMPTY_EXPANSION: Expansion = { dirs: new Set(), days: new Map() };

export type Row =
  | { kind: "dir"; key: string; depth: number; name: string; open: boolean }
  | { kind: "day"; key: string; depth: number; label: string; open: boolean }
  | {
      kind: "file";
      key: string;
      depth: number;
      node: FileNode;
      /** Captured notes show their first words; other files show their filename. */
      captured: boolean;
      title: string;
      meta: string | null;
    };

type CapturedNote = { node: FileNode; day: string; time: number; dup: number; clock: string };

/** Day groups are keyed by parent folder too, so "Today" in two folders opens independently. */
export function dayRowKey(parentPath: string, day: string): string {
  return `${parentPath}\0${day}`;
}

/** The rows currently visible, in display order. `now` decides which day is "today". */
export function flattenVisible(tree: readonly TreeNode[], vaultPath: string, expansion: Expansion, now: Date): Row[] {
  const rows: Row[] = [];
  const today = dateKey(now);

  function visit(children: readonly TreeNode[], parentPath: string, depth: number): void {
    const { dirs, days, others } = groupForDisplay(children);

    for (const dir of dirs) {
      const open = expansion.dirs.has(dir.path);
      rows.push({ kind: "dir", key: dir.path, depth, name: dir.name, open });
      if (open) {
        visit(dir.children, dir.path, depth + 1);
      }
    }

    for (const [day, notes] of days) {
      const key = dayRowKey(parentPath, day);
      const open = expansion.days.get(key) ?? day === today;
      rows.push({ kind: "day", key, depth, label: formatDayLabel(day, now), open });
      if (!open) {
        continue;
      }
      for (const note of notes) {
        rows.push({
          kind: "file",
          key: note.node.path,
          depth: depth + 1,
          node: note.node,
          captured: true,
          title: formatEntryTitle(note.node.preview ?? "") || COPY.sidebar.untitled,
          meta: note.dup > 0 ? `${note.clock} (${note.dup})` : note.clock,
        });
      }
    }

    for (const file of others) {
      rows.push({ kind: "file", key: file.path, depth, node: file, captured: false, title: file.name, meta: null });
    }
  }

  visit(tree, vaultPath, 0);
  return rows;
}

/** Splits one folder's children into folders, captured notes by day (newest first), and other files. */
export function groupForDisplay(children: readonly TreeNode[]): {
  dirs: DirNode[];
  days: Array<[day: string, notes: CapturedNote[]]>;
  others: FileNode[];
} {
  const dirs: DirNode[] = [];
  const others: FileNode[] = [];
  const byDay = new Map<string, CapturedNote[]>();

  for (const node of children) {
    if (node.type === "dir") {
      dirs.push(node);
      continue;
    }
    const parsed = parseCaptureName(node.name);
    if (!parsed) {
      others.push(node);
      continue;
    }
    const day = dateKey(parsed.date);
    const note: CapturedNote = {
      node,
      day,
      time: parsed.date.getHours() * 60 + parsed.date.getMinutes(),
      dup: parsed.dup,
      clock: formatClock(parsed.date),
    };
    const bucket = byDay.get(day);
    if (bucket) {
      bucket.push(note);
    } else {
      byDay.set(day, [note]);
    }
  }

  const newestFirst = (a: CapturedNote, b: CapturedNote) => b.time - a.time || b.dup - a.dup;
  const days = [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([day, notes]): [string, CapturedNote[]] => [day, notes.sort(newestFirst)]);

  return { dirs, days, others };
}

/**
 * Merges a freshly loaded tree into the previous one, reusing every node (and array)
 * whose content did not change. Memoized rows compare nodes by identity, so after a
 * refresh only the rows for new or edited notes re-render.
 */
export function mergeTree(previous: readonly TreeNode[], next: readonly TreeNode[]): readonly TreeNode[] {
  const known = new Map<string, TreeNode>();
  indexByPath(previous, known);
  const merged = mergeList(next, known);
  return sameItems(merged, previous) ? previous : merged;
}

function indexByPath(nodes: readonly TreeNode[], into: Map<string, TreeNode>): void {
  for (const node of nodes) {
    into.set(node.path, node);
    if (node.type === "dir") {
      indexByPath(node.children, into);
    }
  }
}

function mergeList(nodes: readonly TreeNode[], known: ReadonlyMap<string, TreeNode>): TreeNode[] {
  return nodes.map((node) => mergeNode(node, known.get(node.path), known));
}

function mergeNode(node: TreeNode, old: TreeNode | undefined, known: ReadonlyMap<string, TreeNode>): TreeNode {
  if (node.type === "file") {
    const unchanged =
      old?.type === "file" && old.name === node.name && old.focus === node.focus && old.preview === node.preview;
    return unchanged ? old : node;
  }
  const children = mergeList(node.children, known);
  if (old?.type === "dir" && old.name === node.name && sameItems(children, old.children)) {
    return old;
  }
  return { ...node, children };
}

function sameItems(a: readonly TreeNode[], b: readonly TreeNode[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}
