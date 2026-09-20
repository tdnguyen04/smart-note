/**
 * Settings are stored in a JSON file in the user's data directory.
 * Settings are used to store the main vault path and other settings.
 */

const { app } = require("electron");
const fs = require("fs/promises");
const path = require("path");

const SETTINGS_FILE = "settings.json";

const defaultSettings = {
  mainVaultPath: null,
  /** Last vault path the user accepted after a non-note heads-up (skip re-prompt). */
  acceptedNonNoteVaultPath: null,
};

function getSettingsPath() {
  return path.join(app.getPath("userData"), SETTINGS_FILE);
}

async function pathIsDirectory(dirPath) {
  if (!dirPath || typeof dirPath !== "string") {
    return false;
  }
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function readSettingsFile() {
  try {
    const raw = await fs.readFile(getSettingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { ...defaultSettings };
    }
    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch {
    return { ...defaultSettings };
  }
}

/**
 * Returns settings. If mainVaultPath is set but missing/not a directory, it is
 * treated as null (caller can treat that as “needs onboarding”).
 * acceptedNonNoteVaultPath is cleared when it is no longer a directory.
 */
async function getSettings() {
  const settings = await readSettingsFile();
  const mainVaultPath = (await pathIsDirectory(settings.mainVaultPath))
    ? settings.mainVaultPath
    : null;
  const acceptedNonNoteVaultPath = (await pathIsDirectory(
    settings.acceptedNonNoteVaultPath
  ))
    ? settings.acceptedNonNoteVaultPath
    : null;

  return {
    ...settings,
    mainVaultPath,
    acceptedNonNoteVaultPath,
  };
}

/**
 * Merges a partial settings object and writes settings.json.
 * Invalid mainVaultPath / acceptedNonNoteVaultPath values are stored as null.
 */
async function setSettings(partial = {}) {
  const current = await readSettingsFile();
  const next = {
    ...current,
    ...partial,
  };

  if (
    Object.prototype.hasOwnProperty.call(partial, "mainVaultPath") &&
    !(await pathIsDirectory(next.mainVaultPath))
  ) {
    next.mainVaultPath = null;
  }

  if (
    Object.prototype.hasOwnProperty.call(partial, "acceptedNonNoteVaultPath") &&
    next.acceptedNonNoteVaultPath != null &&
    !(await pathIsDirectory(next.acceptedNonNoteVaultPath))
  ) {
    next.acceptedNonNoteVaultPath = null;
  }

  await fs.mkdir(path.dirname(getSettingsPath()), { recursive: true });
  await fs.writeFile(
    getSettingsPath(),
    JSON.stringify(next, null, 2),
    "utf8"
  );

  return getSettings();
}

module.exports = {
  getSettings,
  setSettings,
  getSettingsPath,
};
