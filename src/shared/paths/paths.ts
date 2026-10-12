/**
 * Path helpers that work on both Windows and POSIX strings. They never touch the disk,
 * so the renderer can use them without asking main.
 */

const TRAILING_SEPARATORS = /[\\/]+$/;
const SEPARATOR = /[\\/]/;

function normalizePath(filePath: string | null | undefined): string {
  if (!filePath) {
    return "";
  }
  return filePath.replace(TRAILING_SEPARATORS, "").replace(/\\/g, "/").toLowerCase();
}

/** True when both paths name the same place, ignoring case, slash style and a trailing slash. */
export function isSamePath(pathA: string | null | undefined, pathB: string | null | undefined): boolean {
  const normalizedA = normalizePath(pathA);
  return Boolean(normalizedA) && normalizedA === normalizePath(pathB);
}

/** Last segment of a path: the folder or file name. Empty for an empty path. */
export function baseName(filePath: string | null | undefined): string {
  if (!filePath) {
    return "";
  }
  const parts = filePath.replace(TRAILING_SEPARATORS, "").split(SEPARATOR);
  return parts[parts.length - 1] || filePath;
}
