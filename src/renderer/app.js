import { mountEmptyState } from "./components/empty-state/EmptyState.js";
import { mountSidebar } from "./components/sidebar/Sidebar.js";
import { mountToolbar } from "./components/toolbar/Toolbar.js";
import { mountTitlebar } from "./components/titlebar/Titlebar.js";
import { mountEditor } from "./components/editor/Editor.js";
import { mountRail } from "./components/rail/Rail.js";

const appEl = document.getElementById("app");
const titlebarEl = document.getElementById("titlebar");
const emptyRoot = document.getElementById("empty-state");
const shellEl = document.getElementById("shell");
const ribbonEl = document.getElementById("ribbon");
const primarySidebarEl = document.getElementById("primary-sidebar");
const toolbarEl = document.getElementById("toolbar");
const sidebarEl = document.getElementById("sidebar");
const homeEl = document.getElementById("home");
const contentEl = document.getElementById("content");

/** @type {"onboarding" | "home" | "organize"} */
let mode = "onboarding";
let vaultPath = null;
let selectedFilePath = null;
let sidebarOpen = true;

const rail = mountRail(ribbonEl, {
  onCompose: () => {
    if (!vaultPath) {
      return;
    }
    showHome();
  },
  onOrganize: () => {
    if (!vaultPath) {
      return;
    }
    showOrganize();
  },
  onProfile: () => {
    // Settings / Change vault move here later.
  },
});

const titlebar = mountTitlebar(titlebarEl, {
  onToggleSidebar: () => {
    if (!vaultPath || mode === "onboarding") {
      return;
    }
    if (mode === "home") {
      showOrganize();
      return;
    }
    sidebarOpen = !sidebarOpen;
    applySidebarOpen();
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

function applySidebarOpen() {
  sidebarEl.classList.toggle("is-hidden", !sidebarOpen);
  primarySidebarEl.classList.toggle("is-collapsed", !sidebarOpen);
  titlebar.setSidebarOpen(sidebarOpen);
}

function showOnboarding() {
  mode = "onboarding";
  appEl.classList.remove("has-vault");
  shellEl.hidden = true;
  homeEl.hidden = true;
  contentEl.hidden = false;
  rail.setActive(null);
  emptyState.show();
}

function showHome() {
  mode = "home";
  appEl.classList.add("has-vault");
  emptyState.hide();
  shellEl.hidden = false;
  homeEl.hidden = false;
  contentEl.hidden = true;
  sidebarOpen = false;
  applySidebarOpen();
  rail.setActive("compose");
}

function showOrganize() {
  mode = "organize";
  appEl.classList.add("has-vault");
  emptyState.hide();
  shellEl.hidden = false;
  homeEl.hidden = true;
  contentEl.hidden = false;
  sidebarOpen = true;
  applySidebarOpen();
  rail.setActive("organize");
}

async function openVault(nextPath) {
  vaultPath = nextPath;
  selectedFilePath = null;
  sidebar.clearSelection();
  await editor.clear();

  const name = vaultNameFromPath(vaultPath);
  toolbar.setVaultName(name);

  const tree = await window.smartnote.getTree(vaultPath);
  sidebar.setTree(tree);

  // Keep Phase 1 UX until Home/onboarding features land: land in Organize.
  showOrganize();
}

async function renderEmpty() {
  vaultPath = null;
  selectedFilePath = null;
  sidebarOpen = true;
  sidebar.setTree([]);
  sidebar.clearSelection();
  await editor.clear();
  toolbar.setVaultName("");
  applySidebarOpen();
  showOnboarding();
}

renderEmpty();
