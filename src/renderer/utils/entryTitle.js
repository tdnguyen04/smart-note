import { splitNoteContent } from "./captureFocuses.js";

const TITLE_WORDS = 3;
const TITLE_CHARS = 15;

/**
 * Title from the note itself: the first three words, and never more than 15 characters.
 * A leading focus block is skipped, so the tag line is not the title.
 * @param {string} content
 * @returns {string}
 */
export function entryTitle(content) {
  const text = splitNoteContent(typeof content === "string" ? content : "").body;
  const words = text.trim().split(/\s+/).filter(Boolean).slice(0, TITLE_WORDS);
  if (words.length === 0) {
    return "";
  }
  const joined = words.join(" ");
  if (joined.length <= TITLE_CHARS) {
    return joined;
  }
  return joined.slice(0, TITLE_CHARS).trimEnd();
}
