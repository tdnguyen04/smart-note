import { enterHome, enterOnboarding } from "../commands";
import type { SettingsPatch, VaultDialogOptions } from "../../shared/ipc";
import { getState, updateState } from "../state";
import { isSamePath } from "../../utils/paths";

async function establishSession(newPath: string | null | undefined): Promise<boolean> {
  if (!newPath) {
    return false;
  }

  const inspect = await window.smartnote.inspectVault(newPath);
  const settings = await window.smartnote.getSettings();
  const alreadyAccepted = isSamePath(newPath, settings.acceptedNonNoteVaultPath);

  if (inspect.nonNoteCount > 0 && !alreadyAccepted) {
    const choice = await window.smartnote.confirmNonNotes(inspect);
    if (choice === "pick-another") {
      const intent: VaultDialogOptions = getState().mode === "onboarding" ? { intent: "onboarding" } : {};
      return promptNewSession(intent);
    }
  }

  const patch: SettingsPatch = { mainVaultPath: newPath };
  if (inspect.nonNoteCount > 0) {
    patch.acceptedNonNoteVaultPath = newPath;
  } else if (settings.acceptedNonNoteVaultPath) {
    patch.acceptedNonNoteVaultPath = null;
  }

  await window.smartnote.setSettings(patch);
  updateState({ vaultPath: newPath });
  enterHome();
  return true;
}

export async function promptNewSession(options: VaultDialogOptions = {}): Promise<boolean> {
  const selectedPath = await window.smartnote.openVaultDialog(options);
  if (!selectedPath) {
    return false;
  }
  return establishSession(selectedPath);
}

export async function resetSavedVault(): Promise<void> {
  await window.smartnote.setSettings({
    mainVaultPath: null,
    acceptedNonNoteVaultPath: null,
  });
  enterOnboarding();
}

export async function restoreSavedSession(): Promise<void> {
  const settings = await window.smartnote.getSettings();
  if (settings.mainVaultPath) {
    const opened = await establishSession(settings.mainVaultPath);
    if (!opened && !getState().vaultPath) {
      await window.smartnote.setSettings({
        mainVaultPath: null,
        acceptedNonNoteVaultPath: null,
      });
      enterOnboarding();
    }
    return;
  }
  enterOnboarding();
}
