import { mountEmptyState } from "./components/empty-state/EmptyState.js";
import { mountSidebar } from "./components/sidebar/Sidebar.js";
import { mountToolbar } from "./components/toolbar/Toolbar.js";
import { mountTitlebar } from "./components/titlebar/Titlebar.js";
import { mountEditor } from "./components/editor/Editor.js";
import { mountRail } from "./components/rail/Rail.js";
import { mountHome } from "./components/home/Home.js";
import { state, updateState, constants } from "./store.js";
import { initRouter } from "./router.js";

const titlebarEl = document.getElementById("titlebar");
const emptyRoot = document.getElementById("empty-state");
const railEl = document.getElementById("rail");
const toolbarEl = document.getElementById("toolbar");
const sidebarEl = document.getElementById("sidebar");
const homeEl = document.getElementById("home");
const contentEl = document.getElementById("content");

mountRail(railEl, {
  onCompose: () => {
    if (!state.vaultPath) {
      return;
    }
    updateState({
      mode: "home",
      sidebarOpen: constants.sidebarOpenByMode.home,
      selectedFilePath: null,
    });
  },
  onOrganize: () => {
    if (!state.vaultPath) {
      return;
    }
    updateState({
      mode: "organize",
      sidebarOpen: constants.sidebarOpenByMode.organize,
      selectedFilePath: null,
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
mountHome(homeEl);
mountSidebar(sidebarEl);

mountToolbar(toolbarEl, {
  onChangeVault: async () => {
    const selectedPath = await window.smartnote.openVaultDialog();
    if (!selectedPath) {
      return;
    }
    openVault(selectedPath);
  },
});

mountEmptyState(emptyRoot, {
  onOpenVault: async () => {
    const selectedPath = await window.smartnote.openVaultDialog();
    if (!selectedPath) {
      return;
    }
    openVault(selectedPath);
  },
});

initRouter();

window.smartnote.onVaultOpened((selectedPath) => {
  openVault(selectedPath);
});

function openVault(nextPath) {
  updateState({
    vaultPath: nextPath,
    selectedFilePath: null,
    mode: "home",
    sidebarOpen: constants.sidebarOpenByMode.home,
  });
}

function renderEmpty() {
  updateState({
    vaultPath: null,
    selectedFilePath: null,
    mode: "onboarding",
  });
}

renderEmpty();
