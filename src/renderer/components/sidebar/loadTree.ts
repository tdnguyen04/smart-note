import { parseCaptureName } from "../../../shared/captureName";
import { formatEntryTitle } from "../../../shared/entryTitle";
import type { FileNode, TreeNode } from "../../../shared/ipc";

/**
 * Loads the vault tree from main and fills in a title preview for captured notes whose
 * listing preview had no words. The returned tree is new; the caller merges it into the
 * one on screen (see mergeTree) so unchanged rows don't re-render.
 */
export async function loadTree(vaultPath: string): Promise<TreeNode[]> {
  const tree = await window.smartnote.getTree(vaultPath);
  const untitled = collectUntitledCaptures(tree);
  await Promise.all(
    untitled.map(async (node) => {
      try {
        const result = await window.smartnote.readFile(node.path);
        if (result.ok) {
          // Safe to fill in: this tree came from IPC just now and is not on screen yet.
          node.preview = result.content;
        }
      } catch {
        // Leave the row untitled when the note cannot be read.
      }
    }),
  );
  return tree;
}

function collectUntitledCaptures(nodes: readonly TreeNode[], into: FileNode[] = []): FileNode[] {
  for (const node of nodes) {
    if (node.type === "dir") {
      collectUntitledCaptures(node.children, into);
    } else if (parseCaptureName(node.name) && !formatEntryTitle(node.preview ?? "")) {
      into.push(node);
    }
  }
  return into;
}
