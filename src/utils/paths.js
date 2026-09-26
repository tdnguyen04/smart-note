function normalizePath(filePath) {
  if (!filePath || typeof filePath !== "string") {
    return "";
  }
  return filePath.replace(/[\\/]+$/, "").replace(/\\/g, "/").toLowerCase();
}

/**
 * 
 * @param {string} pathA in raw Electron format
 * @param {string} pathB in raw Electron format
 * @returns {boolean} true if the paths are the same, false otherwise
 */
function isSamePath(pathA, pathB) {
  const normalizedA = normalizePath(pathA);
  const normalizedB = normalizePath(pathB);
  return Boolean(normalizedA) && normalizedA === normalizedB;
}

/**
 * Get folder name from a path. Empty string when path is missing.
 * @param {string | null | undefined} folderPath
 * @returns {string} the folder name
 */
function getFolderNameFromPath(folderPath) {
  if (!folderPath) {
    return "";
  }
  const normalized = folderPath.replace(/[\\/]+$/, "");
  const parts = normalized.split(/[\\/]/);
  return parts[parts.length - 1] || folderPath;
}

export { isSamePath, getFolderNameFromPath };