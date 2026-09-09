export function mountSidebar(root, { onSelect }) {
  root.classList.add("sidebar");
  root.replaceChildren();

  const treeRoot = document.createElement("ul");
  treeRoot.className = "sidebar__tree";
  root.append(treeRoot);

  let selectedPath = null;
  const expandedPaths = new Set();

  function selectFile(filePath) {
    selectedPath = filePath;
    root.querySelectorAll(".sidebar__item").forEach((el) => {
      el.classList.toggle("is-selected", el.dataset.path === filePath);
    });
    onSelect?.({ path: filePath, type: "file" });
  }

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

  let nodes = [];

  function paint() {
    treeRoot.replaceChildren();
    for (const node of nodes) {
      treeRoot.append(renderNode(node, 0));
    }
  }

  return {
    setTree(nextNodes) {
      nodes = Array.isArray(nextNodes) ? nextNodes : [];
      paint();
    },
    clearSelection() {
      selectedPath = null;
      root
        .querySelectorAll(".sidebar__item.is-selected")
        .forEach((el) => el.classList.remove("is-selected"));
    },
    getSelectedPath() {
      return selectedPath;
    },
  };
}
