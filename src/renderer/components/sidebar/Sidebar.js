import { selectFile } from "../../commands.js";
import { getState, subscribe } from "../../state.js";

/**
 * Mounts the file tree into root.
 * Rows are painted from the in-memory tree and the selected path.
 */
export function mountSidebar(root) {
  root.classList.add("sidebar");
  root.replaceChildren();

  const treeRoot = document.createElement("ul");
  treeRoot.className = "sidebar__tree";
  root.append(treeRoot);

  let selectedPath = null;
  const expandedPaths = new Set();
  let nodes = [];
  let loadToken = 0;

  function renderNode(node, depth) {
    const item = document.createElement("li");
    item.className = `sidebar__item sidebar__item--${node.type}`;
    item.dataset.path = node.path;
    item.dataset.type = node.type;
    item.style.setProperty("--depth", String(depth));

    const row = document.createElement("button");
    row.type = "button";
    row.className = "sidebar__row";

    if (node.type === "dir") {
      const isExpanded = expandedPaths.has(node.path);
      item.classList.toggle("is-expanded", isExpanded);

      const twisty = document.createElement("span");
      twisty.className = "sidebar__twisty";
      twisty.textContent = isExpanded ? "▾" : "▸";
      row.append(twisty);

      const label = document.createElement("span");
      label.className = "sidebar__label";
      label.textContent = node.name;
      row.append(label);

      row.addEventListener("click", () => {
        if (expandedPaths.has(node.path)) {
          expandedPaths.delete(node.path);
        } else {
          expandedPaths.add(node.path);
        }
        paint();
      });

      item.append(row);

      if (isExpanded && Array.isArray(node.children)) {
        const childList = document.createElement("ul");
        childList.className = "sidebar__tree";
        for (const child of node.children) {
          childList.append(renderNode(child, depth + 1));
        }
        item.append(childList);
      }
    } else {
      const spacer = document.createElement("span");
      spacer.className = "sidebar__twisty sidebar__twisty--spacer";
      row.append(spacer);

      const label = document.createElement("span");
      label.className = "sidebar__label";
      label.textContent = node.name;
      row.append(label);

      if (selectedPath === node.path) {
        item.classList.add("is-selected");
      }

      row.addEventListener("click", () => {
        selectFile(node.path);
      });

      item.append(row);
    }

    return item;
  }

  function paint() {
    treeRoot.replaceChildren();
    for (const node of nodes) {
      treeRoot.append(renderNode(node, 0));
    }
  }

  function clearTree() {
    nodes = [];
    expandedPaths.clear();
    selectedPath = null;
    paint();
  }

  async function loadTree(vaultPath, { resetExpansion }) {
    const token = ++loadToken;
    if (!vaultPath) {
      clearTree();
      return;
    }

    try {
      const tree = await window.smartnote.getTree(vaultPath);
      if (token !== loadToken) {
        return;
      }
      nodes = Array.isArray(tree) ? tree : [];
      if (resetExpansion) {
        expandedPaths.clear();
      }
      paint();
    } catch (error) {
      if (token !== loadToken) {
        return;
      }
      console.error(error);
      clearTree();
    }
  }

  subscribe((s) => s.vaultPath, (vaultPath) => {
    void loadTree(vaultPath, { resetExpansion: true });
  });

  subscribe((s) => s.treeEpoch, () => {
    const vaultPath = getState().vaultPath;
    if (!vaultPath) {
      return;
    }
    void loadTree(vaultPath, { resetExpansion: false });
  });

  subscribe((s) => s.selectedFilePath, (filePath) => {
    selectedPath = filePath;
    paint();
  });
}
