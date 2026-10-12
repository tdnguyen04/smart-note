export function normalizePath(filePath: string | null | undefined): string {
  if (!filePath || typeof filePath !== "string") {
    return "";
  }
  return filePath.replace(/[\\/]+$/, "").replace(/\\/g, "/").toLowerCase();
}

export function isSamePath(pathA: string | null | undefined, pathB: string | null | undefined): boolean {
  const normalizedA = normalizePath(pathA);
  const normalizedB = normalizePath(pathB);
  return Boolean(normalizedA) && normalizedA === normalizedB;
}

export function getFolderNameFromPath(folderPath: string | null | undefined): string {
  if (!folderPath) {
    return "";
  }
  const normalized = folderPath.replace(/[\\/]+$/, "");
  const parts = normalized.split(/[\\/]/);
  return parts[parts.length - 1] || folderPath;
}
