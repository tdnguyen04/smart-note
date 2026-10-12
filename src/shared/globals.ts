export const APP = {
  name: "Folio",
} as const;

export const MODES = ["onboarding", "home", "organize"] as const;

export type Mode = (typeof MODES)[number];

export type FocusDef = {
  id: string;
  label: string;
  /** Tag color on the light theme. */
  color: string;
  /** Same hue, lifted so it keeps 3:1 contrast on the dark theme. */
  colorDark: string;
  prompts: readonly string[];
};

export const FOCUSES = [
  {
    id: "literature",
    label: "Literature Insight",
    color: "#3d6b8c",
    colorDark: "#7fa8c6",
    prompts: [
      "What claim is this source actually making?",
      "Which passage is worth keeping, and why?",
    ],
  },
  {
    id: "research",
    label: "Research Idea",
    color: "#2a6f4e",
    colorDark: "#6fb592",
    prompts: [
      "What question is this idea trying to answer?",
      "What would you need in order to test this?",
    ],
  },
  {
    id: "lecture",
    label: "Lecture Note",
    color: "#8a6232",
    colorDark: "#c99a62",
    prompts: [
      "What was the main argument of this lecture?",
      "What should you be able to explain after this session?",
    ],
  },
  {
    id: "question",
    label: "Open Question",
    color: "#a33d55",
    colorDark: "#d9798f",
    prompts: [
      "What is still unresolved?",
      "What evidence would change your mind?",
    ],
  },
  {
    id: "synthesis",
    label: "Synthesis",
    color: "#4d5d73",
    colorDark: "#9aa9bd",
    prompts: [
      "How does this connect to something you already know?",
      "What is the through-line across these sources?",
    ],
  },
] as const satisfies readonly FocusDef[];

export type FocusId = (typeof FOCUSES)[number]["id"];

export const FOCUS_CHIPS_BEFORE_MORE = 3;

export const TITLE_RULE = {
  words: 3,
  chars: 15,
} as const;

/** Filename shape. The regex that matches it lives in shared/captureName. */
export const CAPTURE_NAME = {
  stem: "Note",
  extension: ".md",
  duplicatePrefix: " (",
  duplicateSuffix: ")",
} as const;

/**
 * Native window chrome. These must match `surface` and `ink` in
 * src/renderer/styles/tokens.css, because the OS paints them before the page loads.
 */
export const WINDOW_CHROME = {
  titlebarHeight: 36,
  light: { background: "#ffffff", symbol: "#1a1a1a" },
  dark: { background: "#1b1b1d", symbol: "#ececec" },
} as const;

export const TIMINGS_MS = {
  autosave: 400,
  successFlash: 1200,
  nudge: 5000,
  onboardingHint: 3200,
  /** Hover time before a tooltip opens. */
  tooltipDelay: 450,
  /** Moving to the next tooltip within this window opens it at once. */
  tooltipSkipDelay: 250,
  /** A saved note's card gliding from the capture box to the Organize icon. */
  noteFlight: 750,
} as const;

/**
 * The save chime: two soft bell notes a fifth apart (E5 then B5), the familiar
 * "done" interval. Synthesized at play time; there is no audio file.
 */
export const SAVE_CHIME = {
  /** Master volume, 0..1. */
  volume: 0.32,
  /** Scheduled this far ahead so the first note is never cut off while audio starts. */
  leadMs: 40,
  notes: [
    { hz: 659.25, delayMs: 0, decayMs: 320, level: 0.8 },
    { hz: 987.77, delayMs: 85, decayMs: 560, level: 1 },
  ],
  /** Overtones that make a sine sound like a mallet on wood or metal. */
  partials: [
    { ratio: 1, level: 1 },
    { ratio: 2, level: 0.25 },
    { ratio: 3.9, level: 0.12 },
  ],
} as const;

export const TEXT_EXTENSIONS = [
  ".md",
  ".markdown",
  ".txt",
  ".text",
  ".json",
  ".csv",
  ".log",
  ".yml",
  ".yaml",
] as const;

export type TextExtension = (typeof TEXT_EXTENSIONS)[number];

export const IPC_CHANNELS = {
  openDialog: "vault:open-dialog",
  getTree: "vault:get-tree",
  readFile: "vault:read-file",
  writeFile: "vault:write-file",
  inspect: "vault:inspect",
  confirmNonNotes: "vault:confirm-non-notes",
  createNote: "vault:create-note",
  getSettings: "settings:get",
  setSettings: "settings:set",
  vaultOpened: "vault:opened",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export const COPY = {
  sidebarEmpty: "Nothing here yet",
  sidebarRegion: "Files",
  titlebar: {
    showSidebar: "Show file sidebar",
    hideSidebar: "Hide file sidebar",
  },
  rail: {
    label: "App rail",
    compose: "Compose",
    organize: "Organize",
    newNote: "new note",
    newNotes: "new notes",
    profile: "Profile",
  },
  toolbar: {
    settings: "Settings",
    changeFolder: "Change folder",
    resetFolder: "Reset saved folder",
  },
  sidebar: {
    label: "Notes",
    today: "Today",
    yesterday: "Yesterday",
    untitled: "Untitled",
  },
  home: {
    headline: "Record a source",
    savingTo: "Saving to ",
    changeFolder: "Change folder",
    hintLabel: "Hint: ",
    closeHint: "Close hint",
    anotherQuestion: "Another question",
    showPrompt: "Show a prompt",
    placeholder: "A claim, a passage, or a point from your research…",
    inputLabel: "Record a source",
    save: "Save",
    savedButton: "Saved",
    saved: "Saved.",
    openInOrganize: "Open in Organize",
    dismiss: "Dismiss",
    moreTags: "More tags",
    hintFollowsTopic: "Questions follow the topic you pick.",
    hintChooseTopic: "Choose a topic for a more relevant question.",
    saveFailed: "Could not save this.",
  },
  onboarding: {
    tip: "An empty folder works best — keep readings and research together.",
    lead: "Open a folder for readings, lectures, and research.",
    chooseFolder: "Choose folder",
    tipLabel: "Tip: ",
  },
  editor: {
    textLabel: "Note text",
    noFile: "No file open",
    untitled: "Untitled",
    selectFile: "Select a file to read it.",
    unsupported: "Folio can’t edit this file type yet.",
    openFailed: "Could not open this file.",
    openError: "An error occurred while opening the file.",
  },
  vault: {
    chooseResearchTitle: "Choose a folder for your research",
    openFolderTitle: "Open folder",
    nonNotesMessage: "This folder has a few files Folio won’t open.",
    nonNotesDetailLead: "Things like images or PDFs are fine to leave here",
    nonNotesDetailTail: ". You can still keep readings and research here.",
    useFolder: "Use this folder",
    pickAnother: "Pick another",
    readFailed: "Failed to read file",
    writeFailed: "Failed to write file",
    createFailed: "Failed to create note",
    nameCollision: "Could not find a free filename",
  },
} as const;
