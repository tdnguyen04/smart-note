/**
 * Academic capture intents. The id is what a new note stores.
 * An id that is not in this list, including older journaling tags, is ignored.
 */
const CAPTURE_FOCUSES = [
  {
    id: "literature",
    label: "Literature Insight",
    color: "#3d6b8c",
    prompts: [
      "What claim is this source actually making?",
      "Which passage is worth keeping, and why?",
    ],
  },
  {
    id: "research",
    label: "Research Idea",
    color: "#2a6f4e",
    prompts: [
      "What question is this idea trying to answer?",
      "What would you need in order to test this?",
    ],
  },
  {
    id: "lecture",
    label: "Lecture Note",
    color: "#8a6232",
    prompts: [
      "What was the main argument of this lecture?",
      "What should you be able to explain after this session?",
    ],
  },
  {
    id: "question",
    label: "Open Question",
    color: "#a33d55",
    prompts: [
      "What is still unresolved?",
      "What evidence would change your mind?",
    ],
  },
  {
    id: "synthesis",
    label: "Synthesis",
    color: "#4d5d73",
    prompts: [
      "How does this connect to something you already know?",
      "What is the through-line across these sources?",
    ],
  },
];

const DEFAULT_VISIBLE = 3;

/**
 * @returns {typeof CAPTURE_FOCUSES}
 */
export function listFocuses() {
  return CAPTURE_FOCUSES.slice();
}

/**
 * The chips Home shows before the user opens More.
 * @returns {typeof CAPTURE_FOCUSES}
 */
export function defaultFocuses() {
  return CAPTURE_FOCUSES.slice(0, DEFAULT_VISIBLE);
}

/**
 * @param {string | null | undefined} id
 */
export function focusById(id) {
  if (!id) {
    return null;
  }
  return CAPTURE_FOCUSES.find((focus) => focus.id === id) || null;
}

/**
 * One prompt. A focus id limits the pool to that tag. Otherwise any prompt is eligible.
 * Skips the previous prompt when another one exists.
 * @param {string | null | undefined} focusId
 * @param {string | null | undefined} previous
 * @returns {string}
 */
export function pickPrompt(focusId, previous) {
  const focus = focusById(focusId);
  const pool = focus
    ? focus.prompts
    : CAPTURE_FOCUSES.flatMap((item) => item.prompts);
  if (pool.length === 0) {
    return "";
  }
  if (pool.length === 1) {
    return pool[0];
  }
  const choices =
    previous && pool.includes(previous)
      ? pool.filter((prompt) => prompt !== previous)
      : pool;
  return choices[Math.floor(Math.random() * choices.length)];
}

/**
 * Writes the focus id into frontmatter when the id is known. Otherwise returns the body.
 * @param {{ focusId?: string | null, body?: string }} note
 * @returns {string}
 */
export function composeNoteContent({ focusId, body }) {
  const text = typeof body === "string" ? body : "";
  if (!focusById(focusId)) {
    return text;
  }
  return `---\nfocus: ${focusId}\n---\n\n${text}`;
}

const FOCUS_FRONTMATTER = /^(---\r?\n[\s\S]*?\r?\n---)(\r?\n)?/;

/**
 * Hides a leading focus block from the editor and keeps that block to write back.
 * Notes without focus metadata stay unchanged.
 * @param {string} content
 * @returns {{ prefix: string, body: string }}
 */
export function splitNoteContent(content) {
  const text = typeof content === "string" ? content : "";
  const match = FOCUS_FRONTMATTER.exec(text);
  if (!match || !/^focus:\s*[A-Za-z0-9-]+\s*$/m.test(match[1])) {
    return { prefix: "", body: text };
  }

  let prefix = match[0];
  let body = text.slice(prefix.length);
  if (match[2] && /^\r?\n/.test(body)) {
    const blank = /^\r?\n/.exec(body)[0];
    prefix += blank;
    body = body.slice(blank.length);
  }
  return { prefix, body };
}
