import { mountEmptyState } from "./components/empty-state/EmptyState.js";
import { mountSidebar } from "./components/sidebar/Sidebar.js";

const appEl = document.getElementById("app");
const emptyRoot = document.getElementById("empty-state");
const workspaceEl = document.querySelector(".workspace");
const sidebarEl = document.getElementById("sidebar");
const contentEl = document.getElementById("content");

let vaultPath = null;
let selectedFilePath = null;

const sidebar = mountSidebar(sidebarEl, {
  onSelect: ({ path }) => {
    selectedFilePath = path;
  },
});

const emptyState = mountEmptyState(emptyRoot, {
  onOpenVault: async () => {
    const selectedPath = await window.smartnote.openVaultDialog();
    if (!selectedPath) {
      return;
    }
    await openVault(selectedPath);
  },
});

function vaultNameFromPath(folderPath) {
  const normalized = folderPath.replace(/[\\/]+$/, "");
  const parts = normalized.split(/[\\/]/);
  return parts[parts.length - 1] || folderPath;
}

async function openVault(nextPath) {
  vaultPath = nextPath;
  selectedFilePath = null;
  sidebar.clearSelection();

  appEl.classList.add("has-vault");
  workspaceEl.hidden = false;
  emptyState.hide();
  contentEl.replaceChildren();

  const tree = await window.smartnote.getTree(vaultPath);
  sidebar.setTree(tree, vaultNameFromPath(vaultPath));
}

function renderEmpty() {
  vaultPath = null;
  selectedFilePath = null;
  sidebar.setTree([]);
  sidebar.clearSelection();
  appEl.classList.remove("has-vault");
  workspaceEl.hidden = true;
  emptyState.show();
  contentEl.replaceChildren();
}

renderEmpty();
