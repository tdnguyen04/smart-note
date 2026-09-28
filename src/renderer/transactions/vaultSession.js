import { enterHome, enterOnboarding } from "../commands.js";
import { getState, updateState } from "../state.js";
import { isSamePath } from "../../utils/paths.js";

/**
 * Inspects the folder, warns once about non-notes, saves settings, and lands in Home.
 * A rejected folder is not saved. Returns false when path is missing or the user backs out.
 * @param {string | null | undefined} newPath
 * @returns {Promise<boolean>}
 */
async function establishSession(newPath) {
  if (!newPath) {
    return false;
  }

  const inspect = await window.smartnote.inspectVault(newPath);
  const settings = await window.smartnote.getSettings();
  const alreadyAccepted = isSamePath(
    newPath,
    settings?.acceptedNonNoteVaultPath
  );

  if (inspect.nonNoteCount > 0 && !alreadyAccepted) {
    const choice = await window.smartnote.confirmNonNotes(inspect);
    if (choice === "pick-another") {
      const intent =
        getState().mode === "onboarding" ? { intent: "onboarding" } : {};
      return promptNewSession(intent);
    }
  }

  const patch = { mainVaultPath: newPath };
  if (inspect.nonNoteCount > 0) {
    patch.acceptedNonNoteVaultPath = newPath;
  } else if (settings?.acceptedNonNoteVaultPath) {
    patch.acceptedNonNoteVaultPath = null;
  }

  await window.smartnote.setSettings(patch);
  updateState({ vaultPath: newPath });
  enterHome();
  return true;
}

/**
 * Asks for a folder, then opens it.
 * Returns false when the user cancels the dialog.
 * @param {{ intent?: "onboarding" | "change" }} [options]
 * @returns {Promise<boolean>}
 */
export async function promptNewSession(options = {}) {
  const selectedPath = await window.smartnote.openVaultDialog(options);
  if (!selectedPath) {
    return false;
  }
  return establishSession(selectedPath);
}

/**
 * Forgets the saved vault and shows onboarding.
 * Notes already written stay in the folder.
 * @returns {Promise<void>}
 */
export async function resetSavedVault() {
  await window.smartnote.setSettings({
    mainVaultPath: null,
    acceptedNonNoteVaultPath: null,
  });
  enterOnboarding();
}

/**
 * Restores the saved vault, or shows onboarding when there is nothing to open.
 * @returns {Promise<void>}
 */
export async function restoreSavedSession() {
  const settings = await window.smartnote.getSettings();
  if (settings?.mainVaultPath) {
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
