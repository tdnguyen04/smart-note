import { mountEmptyState } from "./components/empty-state/EmptyState.js";
import { mountSidebar } from "./components/sidebar/Sidebar.js";
import { mountToolbar } from "./components/toolbar/Toolbar.js";
import { mountTitlebar } from "./components/titlebar/Titlebar.js";
import { mountEditor } from "./components/editor/Editor.js";
import { mountRail } from "./components/rail/Rail.js";
import { mountHome } from "./components/home/Home.js";
import { state, subscribe, updateState, constants } from "./store.js";
import { initRouter } from "./router.js";
import { vaultNameFromPath } from "./utils.js";
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

mountRail(railEl, {
  onCompose: () => {
    if (state.vaultPath)
      updateState({
        mode: "home",
        sidebarOpen: constants.sidebarOpenByMode.home,
        selectedFilePath: null
      });
  },
  onOrganize: () => {
    if (state.vaultPath)
      updateState({
        mode: "organize",
        sidebarOpen: constants.sidebarOpenByMode.organize,
        selectedFilePath: null
      });
  },
  onProfile: () => {
    // Settings / Change vault move here later.
  },
});

mountTitlebar(titlebarEl, {
  onToggleSidebar: () => {
    if (!state.vaultPath || state.mode === "onboarding") {
      return;
    }
    updateState({ sidebarOpen: !state.sidebarOpen });
  },
});

mountEditor(contentEl);
const home = mountHome(homeEl);

const sidebar = mountSidebar(sidebarEl, {
  onSelect: ({ path }) => {
    updateState({ selectedFilePath: path })
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

mountEmptyState(emptyRoot, {
  onOpenVault: async () => {
    const selectedPath = await window.smartnote.openVaultDialog();
    if (!selectedPath) {
      return;
    }
    await openVault(selectedPath);
  },
});

// --- Initialize Router ---
// Pass the mounted components so the router can trigger their UI methods (like .focus() or .setActive())
initRouter({ home });

window.smartnote.onVaultOpened((selectedPath) => {
  openVault(selectedPath);
});

async function openVault(nextPath) {
  updateState({ vaultPath: nextPath, selectedFilePath: null });
  sidebar.clearSelection();

  const name = vaultNameFromPath(state.vaultPath);
  toolbar.setVaultName(name);
  home.setVaultName(name);

  const tree = await window.smartnote.getTree(state.vaultPath);
  sidebar.setTree(tree);

  updateState({ mode: "home", sidebarOpen: constants.sidebarOpenByMode.home });
}

async function renderEmpty() {
  updateState({ vaultPath: null, selectedFilePath: null });
  sidebar.setTree([]);
  sidebar.clearSelection();
  toolbar.setVaultName("");
  home.setVaultName("");
  updateState({ mode: "onboarding" });
}

renderEmpty();
