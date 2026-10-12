import { FOCUSES, type FocusId } from "../globals";

export type Focus = (typeof FOCUSES)[number];

const FOCUS_FRONTMATTER = /^(---\r?\n[\s\S]*?\r?\n---)(\r?\n)?/;
const FOCUS_LINE = /^focus:\s*([A-Za-z0-9-]+)\s*$/;

/** Unknown ids, including older tags, are ignored. */
export function focusById(id: string | null | undefined): Focus | undefined {
  if (!id) {
    return undefined;
  }
  return FOCUSES.find((focus) => focus.id === id);
}

/**
 * One prompt. A focus id limits the pool to that tag. Otherwise any prompt is eligible.
 * Skips the previous prompt when another one exists.
 */
export function pickPrompt(focusId: string | null | undefined, previous: string | null | undefined): string {
  const focus = focusById(focusId);
  const pool: readonly string[] = focus
    ? focus.prompts
    : FOCUSES.flatMap((item) => [...item.prompts]);
  if (pool.length === 0) {
    return "";
  }
  const only = pool[0];
  if (pool.length === 1) {
    return only ?? "";
  }
  const choices =
    previous && pool.includes(previous) ? pool.filter((prompt) => prompt !== previous) : pool;
  const choice = choices[Math.floor(Math.random() * choices.length)];
  return choice ?? "";
}

/** Writes the focus id into frontmatter when the id is known. Otherwise returns the body. */
export function composeFrontmatter(note: { focusId?: string | null; body?: string }): string {
  const text = typeof note.body === "string" ? note.body : "";
  if (!note.focusId || !focusById(note.focusId)) {
    return text;
  }
  return `---\nfocus: ${note.focusId}\n---\n\n${text}`;
}

/**
 * Hides a leading focus block from the editor and keeps that block to write back.
 * Notes without focus metadata stay unchanged.
 */
export function splitFrontmatter(content: string): { prefix: string; body: string } {
  const text = typeof content === "string" ? content : "";
  const match = FOCUS_FRONTMATTER.exec(text);
  const block = match?.[1];
  if (!match || !block || !/^focus:\s*[A-Za-z0-9-]+\s*$/m.test(block)) {
    return { prefix: "", body: text };
  }

  let prefix = match[0];
  let body = text.slice(prefix.length);
  const separator = match[2];
  if (separator && /^\r?\n/.test(body)) {
    const blank = /^\r?\n/.exec(body)?.[0];
    if (blank) {
      prefix += blank;
      body = body.slice(blank.length);
    }
  }
  return { prefix, body };
}

/**
 * Focus id from the head of a capture note, or null when the block is missing or unclosed.
 * The id is not checked against the catalog; callers ignore unknown ids.
 */
export function readFocusId(head: string): string | null {
  const lines = head.split(/\r?\n/);
  const first = lines[0];
  if ((first ?? "").trim() !== "---") {
    return null;
  }

  let focus: string | null = null;
  for (let i = 1; i < lines.length; i += 1) {
    const line = (lines[i] ?? "").trim();
    if (line === "---") {
      return focus;
    }
    const match = FOCUS_LINE.exec(line);
    const id = match?.[1];
    if (id) {
      focus = id;
    }
  }
  return null;
}

export type { FocusId };
