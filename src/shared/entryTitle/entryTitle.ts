import { TITLE_RULE } from "../globals";
import { splitFrontmatter } from "../focus";

/** Title from the note itself: the first three words, and never more than 15 characters. */
export function formatEntryTitle(content: string): string {
  const text = splitFrontmatter(typeof content === "string" ? content : "").body;
  const words = text.trim().split(/\s+/).filter(Boolean).slice(0, TITLE_RULE.words);
  if (words.length === 0) {
    return "";
  }
  const joined = words.join(" ");
  if (joined.length <= TITLE_RULE.chars) {
    return joined;
  }
  return joined.slice(0, TITLE_RULE.chars).trimEnd();
}
