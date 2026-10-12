import { app } from "electron";
import fs from "node:fs/promises";
import path from "path";
import type { Settings, SettingsPatch } from "../shared/ipc";

const SETTINGS_FILE = "settings.json";

const defaultSettings: Settings = {
  mainVaultPath: null,
  acceptedNonNoteVaultPath: null,
};

function getSettingsPath(): string {
  return path.join(app.getPath("userData"), SETTINGS_FILE);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asPath(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

async function pathIsDirectory(dirPath: string | null): Promise<boolean> {
  if (!dirPath) {
    return false;
  }
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function readSettingsFile(): Promise<Settings> {
  try {
    const raw = await fs.readFile(getSettingsPath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return { ...defaultSettings };
    }
    return {
      mainVaultPath: asPath(parsed["mainVaultPath"]),
      acceptedNonNoteVaultPath: asPath(parsed["acceptedNonNoteVaultPath"]),
    };
  } catch {
    return { ...defaultSettings };
  }
}

export async function getSettings(): Promise<Settings> {
  const settings = await readSettingsFile();
  const mainVaultPath = (await pathIsDirectory(settings.mainVaultPath)) ? settings.mainVaultPath : null;
  const acceptedNonNoteVaultPath = (await pathIsDirectory(settings.acceptedNonNoteVaultPath))
    ? settings.acceptedNonNoteVaultPath
    : null;

  return {
    mainVaultPath,
    acceptedNonNoteVaultPath,
  };
}

export async function setSettings(partial: SettingsPatch = {}): Promise<Settings> {
  const current = await readSettingsFile();
  const next: Settings = {
    ...current,
    ...partial,
  };

  if (Object.prototype.hasOwnProperty.call(partial, "mainVaultPath") && !(await pathIsDirectory(next.mainVaultPath))) {
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
  await fs.writeFile(getSettingsPath(), JSON.stringify(next, null, 2), "utf8");
  return getSettings();
}
