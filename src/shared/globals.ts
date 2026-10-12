export const APP = {
  name: "Folio",
} as const;

export const MODES = ["onboarding", "home", "organize"] as const;

export type Mode = (typeof MODES)[number];

export type FocusDef = {
  id: string;
  label: string;
  color: string;
  prompts: readonly string[];
};

export const FOCUSES = [
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

export const TIMINGS_MS = {
  autosave: 400,
  successFlash: 1200,
  nudge: 5000,
  onboardingHint: 3200,
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
