import { getState, updateState } from "./state.js";

/**
 * Shows Home with the sidebar closed and no file selected.
 * Does nothing when no vault is open.
 */
export function enterHome() {
  if (!getState().vaultPath) {
    return;
  }
  updateState({
    mode: "home",
    sidebarOpen: false,
    selectedFilePath: null,
  });
}

/**
 * Shows Organize with the sidebar open and no file selected.
 * Does nothing when no vault is open.
 */
export function enterOrganize() {
  if (!getState().vaultPath) {
    return;
  }
  updateState({
    mode: "organize",
    sidebarOpen: true,
    selectedFilePath: null,
  });
}

/**
 * Clears the open vault and shows onboarding.
 */
export function enterOnboarding() {
  updateState({
    vaultPath: null,
    selectedFilePath: null,
    mode: "onboarding",
  });
}

/**
 * Shows or hides the file sidebar.
 * Does nothing during onboarding or when no vault is open.
 */
export function toggleSidebar() {
  const current = getState();
  if (!current.vaultPath || current.mode === "onboarding") {
    return;
  }
  updateState({ sidebarOpen: !current.sidebarOpen });
}

/**
 * Opens path in the editor. Pass null to close the open file.
 * @param {string | null} path
 */
export function selectFile(path) {
  updateState({ selectedFilePath: path });
}
