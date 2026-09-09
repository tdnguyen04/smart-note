import { mountEmptyState } from "./components/empty-state/EmptyState.js";
import { mountSidebar } from "./components/sidebar/Sidebar.js";
import { mountToolbar } from "./components/toolbar/Toolbar.js";
import { mountTitlebar } from "./components/titlebar/Titlebar.js";
import { mountEditor } from "./components/editor/Editor.js";

const appEl = document.getElementById("app");
const titlebarEl = document.getElementById("titlebar");
const emptyRoot = document.getElementById("empty-state");
const toolbarEl = document.getElementById("toolbar");
const workspaceEl = document.querySelector(".workspace");
const sidebarEl = document.getElementById("sidebar");
const contentEl = document.getElementById("content");

let vaultPath = null;
let selectedFilePath = null;
let sidebarVisible = true;

mountTitlebar(titlebarEl, {
  onFileMenu: (position) => {
    window.smartnote.popupFileMenu(position);
  },
});

const editor = mountEditor(contentEl);

const sidebar = mountSidebar(sidebarEl, {
  onSelect: ({ path }) => {
    selectedFilePath = path;
    editor.openFile(path);
  },
});

const toolbar = mountToolbar(toolbarEl, {
  onChangeVault: async () => {
    const selectedPath = await window.smartnote.openVaultDialog();
    if (!selectedPath) {
      return;
    }
    await openVault(selectedPath);
  },
  onToggleSidebar: () => {
    sidebarVisible = !sidebarVisible;
    sidebarEl.classList.toggle("is-hidden", !sidebarVisible);
    toolbar.setSidebarVisible(sidebarVisible);
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

window.smartnote.onVaultOpened((selectedPath) => {
  openVault(selectedPath);
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
  editor.clear();

  const name = vaultNameFromPath(vaultPath);

  appEl.classList.add("has-vault");
  workspaceEl.hidden = false;
  emptyState.hide();

  toolbar.setVaultName(name);
  toolbar.setSidebarVisible(sidebarVisible);
  sidebarEl.classList.toggle("is-hidden", !sidebarVisible);

  const tree = await window.smartnote.getTree(vaultPath);
  sidebar.setTree(tree);
}

function renderEmpty() {
  vaultPath = null;
  selectedFilePath = null;
  sidebarVisible = true;
  sidebar.setTree([]);
  sidebar.clearSelection();
  editor.clear();
  sidebarEl.classList.remove("is-hidden");
  toolbar.setVaultName("");
  toolbar.setSidebarVisible(true);
  appEl.classList.remove("has-vault");
  workspaceEl.hidden = true;
  emptyState.show();
}

renderEmpty();
