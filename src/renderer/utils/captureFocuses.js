/**
 * Capture focuses. The id is what a note stores. Label, color, and prompts can change.
 */
const CAPTURE_FOCUSES = [
  {
    id: "emotions",
    label: "Emotions",
    color: "#c45c26",
    prompts: [
      "Take a breath. What's the mood right now?",
      "What's on your mind at this exact moment?",
    ],
  },
  {
    id: "learning",
    label: "Learning",
    color: "#2a6f4e",
    prompts: [
      "What is the core takeaway you want to remember?",
      "How would you explain what you just learned to a beginner?",
    ],
  },
  {
    id: "distractions",
    label: "Distractions",
    color: "#3d6b8c",
    prompts: [
      "What's nagging at your attention? Dump it here.",
      "Got a lingering to-do? Jot it down so you can refocus.",
    ],
  },
  {
    id: "past-hour",
    label: "Past hour",
    color: "#8a6232",
    prompts: [
      "Quick recap: where did your focus go over the last hour?",
      "What did you just wrap up?",
    ],
  },
  {
    id: "joy",
    label: "Joy",
    color: "#a33d55",
    prompts: [
      "Capture a good moment—what made you smile today?",
      "What is going really well right now?",
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
