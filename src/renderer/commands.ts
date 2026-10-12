import { getState, updateState } from "./state";

/**
 * Synchronous outcomes several regions must agree on, one per function. With
 * transactions/*, the only writers of app state. Nothing here waits on disk; a flow
 * that does belongs in transactions/.
 */

export function enterHome(): void {
  if (!getState().vaultPath) {
    return;
  }
  updateState({
    mode: "home",
    sidebarOpen: false,
    selectedFilePath: null,
  });
}

export function enterOrganize(): void {
  if (!getState().vaultPath) {
    return;
  }
  updateState({
    mode: "organize",
    sidebarOpen: true,
    selectedFilePath: null,
  });
}

export function enterOnboarding(): void {
  updateState({
    vaultPath: null,
    selectedFilePath: null,
    mode: "onboarding",
  });
}

export function toggleSidebar(): void {
  const current = getState();
  if (!current.vaultPath || current.mode === "onboarding") {
    return;
  }
  updateState({ sidebarOpen: !current.sidebarOpen });
}

export function selectFile(path: string | null): void {
  updateState({ selectedFilePath: path });
}

export function refreshTree(): void {
  const current = getState();
  if (!current.vaultPath) {
    return;
  }
  updateState({ treeEpoch: current.treeEpoch + 1 });
}

export function openCapturedNote(path: string | null | undefined): void {
  if (!getState().vaultPath || !path) {
    return;
  }
  updateState({
    mode: "organize",
    sidebarOpen: true,
    selectedFilePath: path,
  });
}
