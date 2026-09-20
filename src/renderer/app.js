import { mountOnboarding } from "./components/onboarding/Onboarding.js";
import { mountSidebar } from "./components/sidebar/Sidebar.js";
import { mountToolbar } from "./components/toolbar/Toolbar.js";
import { mountTitlebar } from "./components/titlebar/Titlebar.js";
import { mountEditor } from "./components/editor/Editor.js";
import { mountRail } from "./components/rail/Rail.js";
import { mountHome } from "./components/home/Home.js";
import { state, updateState, constants } from "./store.js";
import { initRouter } from "./router.js";

const titlebarEl = document.getElementById("titlebar");
const onboardingEl = document.getElementById("onboarding");
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
mountHome(homeEl, { onChangeVault: () => pickAndOpenVault() });
mountSidebar(sidebarEl);

mountToolbar(toolbarEl, {
  onChangeVault: () => pickAndOpenVault(),
});

mountOnboarding(onboardingEl, {
  onOpenVault: () => pickAndOpenVault(),
});

initRouter();

window.smartnote.onVaultOpened((selectedPath) => {
  void openVault(selectedPath);
});

/**
 * Folder dialog → openVault (inspect / warn / persist).
 * @returns {Promise<boolean>}
 */
async function pickAndOpenVault() {
  const selectedPath = await window.smartnote.openVaultDialog();
  if (!selectedPath) {
    return false;
  }
  return openVault(selectedPath);
}

/**
 * Inspect for non-notes, optionally warn, persist, then enter Home.
 * @returns {Promise<boolean>}
 */
async function openVault(nextPath) {
  if (!nextPath) {
    return false;
  }

  const inspect = await window.smartnote.inspectVault(nextPath);
  if (inspect.nonNoteCount > 0) {
    const choice = await window.smartnote.confirmNonNotes(inspect);
    if (choice === "pick-another") {
      // Do not persist the rejected path; keep any previous settings.
      return pickAndOpenVault();
    }
  }

  await window.smartnote.setSettings({ mainVaultPath: nextPath });
  updateState({
    vaultPath: nextPath,
    selectedFilePath: null,
    mode: "home",
    sidebarOpen: constants.sidebarOpenByMode.home,
  });
  return true;
}

function renderOnboarding() {
  updateState({
    vaultPath: null,
    selectedFilePath: null,
    mode: "onboarding",
  });
}

async function boot() {
  const settings = await window.smartnote.getSettings();
  if (settings?.mainVaultPath) {
    const opened = await openVault(settings.mainVaultPath);
    if (!opened && !state.vaultPath) {
      await window.smartnote.setSettings({ mainVaultPath: null });
      renderOnboarding();
    }
    return;
  }
  renderOnboarding();
}

void boot();
