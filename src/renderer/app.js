import { mountEmptyState } from "./components/empty-state/EmptyState.js";
import { mountSidebar } from "./components/sidebar/Sidebar.js";
import { mountToolbar } from "./components/toolbar/Toolbar.js";
import { mountTitlebar } from "./components/titlebar/Titlebar.js";
import { mountEditor } from "./components/editor/Editor.js";
import { mountRail } from "./components/rail/Rail.js";
import { mountHome } from "./components/home/Home.js";
import { state, subscribe, updateState, constants } from "./store.js";

const appEl = document.getElementById("app");
const titlebarEl = document.getElementById("titlebar");
const emptyRoot = document.getElementById("empty-state");
const shellEl = document.getElementById("shell");
const railEl = document.getElementById("rail");
const primarySidebarEl = document.getElementById("primary-sidebar");
const toolbarEl = document.getElementById("toolbar");
const sidebarEl = document.getElementById("sidebar");
const sidebarEmptyEl = document.getElementById("sidebar-empty");
const homeEl = document.getElementById("home");
const contentEl = document.getElementById("content");


let vaultPath = null;
let selectedFilePath = null;

const rail = mountRail(railEl, {
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
    if (!vaultPath || state.mode === "onboarding") {
      return;
    }
    updateState({ sidebarOpen: !state.sidebarOpen });
    applySidebarOpen();
  },
});

const editor = mountEditor(contentEl);
const home = mountHome(homeEl);

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
  primarySidebarEl.classList.toggle("is-collapsed", !state.sidebarOpen);
  titlebar.setSidebarOpen(state.sidebarOpen);
}

function applySidebarPanel() {
  const showFiles = state.mode === "organize";
  sidebarEl.hidden = !showFiles;
  sidebarEmptyEl.hidden = showFiles;
}

function applyModeSidebar() {
  if (state.mode === "home" || state.mode === "organize") {
    updateState({ sidebarOpen: constants.sidebarOpenByMode[state.mode] });
  }
  applySidebarPanel();
  applySidebarOpen();
}

function showOnboarding() {
  updateState({ mode: "onboarding" });
  appEl.classList.remove("has-vault");
  shellEl.hidden = true;
  homeEl.hidden = true;
  contentEl.hidden = false;
  rail.setActive(null);
  emptyState.show();
}

function showHome() {
  updateState({ mode: "home" });
  appEl.classList.add("has-vault");
  emptyState.hide();
  shellEl.hidden = false;
  homeEl.hidden = false;
  contentEl.hidden = true;
  applyModeSidebar();
  rail.setActive("compose");
  home.focus();
}

function showOrganize() {
  updateState({ mode: "organize" });
  appEl.classList.add("has-vault");
  emptyState.hide();
  shellEl.hidden = false;
  homeEl.hidden = true;
  contentEl.hidden = false;
  applyModeSidebar();
  rail.setActive("organize");
}

async function openVault(nextPath) {
  vaultPath = nextPath;
  selectedFilePath = null;
  sidebar.clearSelection();
  await editor.clear();

  const name = vaultNameFromPath(vaultPath);
  toolbar.setVaultName(name);
  home.setVaultName(name);

  const tree = await window.smartnote.getTree(vaultPath);
  sidebar.setTree(tree);

  showHome();
}

async function renderEmpty() {
  vaultPath = null;
  selectedFilePath = null;
  sidebar.setTree([]);
  sidebar.clearSelection();
  await editor.clear();
  toolbar.setVaultName("");
  home.setVaultName("");
  applySidebarPanel();
  applySidebarOpen();
  showOnboarding();
}

renderEmpty();
