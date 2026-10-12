import { describe, expect, it } from "vitest";
import { formatEntryTitle } from "../../../shared/entryTitle";
import { COPY } from "../../../shared/globals";
import type { DirNode, FileNode, TreeNode } from "../../../shared/ipc";
import { EMPTY_EXPANSION, dayRowKey, flattenVisible, groupForDisplay, mergeTree } from "./treeModel";

const VAULT = "/vault";
const now = new Date(2026, 9, 12, 18, 0);

function file(name: string, extra: Partial<FileNode> = {}): FileNode {
  return { type: "file", name, path: `${VAULT}/${name}`, ...extra };
}

function dir(name: string, children: TreeNode[]): DirNode {
  return { type: "dir", name, path: `${VAULT}/${name}`, children };
}

describe("groupForDisplay", () => {
  it("puts folders first, captured notes by day newest first, then other files", () => {
    const { dirs, days, others } = groupForDisplay([
      file("readme.md"),
      file("2026-10-11 09.00 Note.md"),
      dir("papers", []),
      file("2026-10-12 08.00 Note.md"),
      file("2026-10-12 08.00 Note (2).md"),
      file("2026-10-12 14.30 Note.md"),
    ]);
    expect(dirs.map((d) => d.name)).toEqual(["papers"]);
    expect(days.map(([day]) => day)).toEqual(["2026-10-12", "2026-10-11"]);
    expect(days[0]?.[1].map((n) => n.node.name)).toEqual([
      "2026-10-12 14.30 Note.md",
      "2026-10-12 08.00 Note (2).md",
      "2026-10-12 08.00 Note.md",
    ]);
    expect(others.map((f) => f.name)).toEqual(["readme.md"]);
  });
});

describe("flattenVisible", () => {
  const tree: TreeNode[] = [
    dir("papers", [file("a.md")]),
    file("2026-10-12 09.05 Note.md", { preview: "Kuhn on paradigm shifts" }),
    file("2026-10-11 10.00 Note.md", { preview: "" }),
  ];

  it("opens today's group by default and keeps folders closed", () => {
    const rows = flattenVisible(tree, VAULT, EMPTY_EXPANSION, now);
    expect(rows.map((r) => r.kind)).toEqual(["dir", "day", "file", "day"]);
    expect(rows[1]).toMatchObject({ kind: "day", label: COPY.sidebar.today, open: true });
    expect(rows[2]).toMatchObject({ kind: "file", captured: true, title: formatEntryTitle("Kuhn on paradigm shifts"), meta: "9:05 AM", depth: 1 });
    expect(rows[3]).toMatchObject({ kind: "day", label: COPY.sidebar.yesterday, open: false });
  });

  it("follows the person's expansion choices", () => {
    const rows = flattenVisible(
      tree,
      VAULT,
      {
        dirs: new Set([`${VAULT}/papers`]),
        days: new Map([
          [dayRowKey(VAULT, "2026-10-12"), false],
          [dayRowKey(VAULT, "2026-10-11"), true],
        ]),
      },
      now,
    );
    expect(rows.map((r) => (r.kind === "file" ? r.title : r.kind))).toEqual([
      "dir",
      "a.md",
      "day",
      "day",
      COPY.sidebar.untitled,
    ]);
  });
});

describe("mergeTree", () => {
  it("returns the previous tree when nothing changed", () => {
    const before = [dir("papers", [file("a.md")]), file("b.md")];
    const after = [dir("papers", [file("a.md")]), file("b.md")];
    expect(mergeTree(before, after)).toBe(before);
  });

  it("reuses unchanged nodes and replaces only what changed", () => {
    const before = [dir("papers", [file("a.md")]), file("b.md", { preview: "old" })];
    const after = [dir("papers", [file("a.md")]), file("b.md", { preview: "new" }), file("c.md")];
    const merged = mergeTree(before, after);
    expect(merged).not.toBe(before);
    expect(merged[0]).toBe(before[0]);
    expect(merged[1]).not.toBe(before[1]);
    expect(merged[2]).toBe(after[2]);
  });

  it("rebuilds a folder when a child changes but keeps its unchanged children", () => {
    const keep = file("keep.md");
    const before = [dir("papers", [keep])];
    const merged = mergeTree(before, [dir("papers", [file("keep.md"), file("new.md")])]);
    const papers = merged[0];
    expect(papers).not.toBe(before[0]);
    expect(papers?.type === "dir" ? papers.children[0] : null).toBe(keep);
  });
});
