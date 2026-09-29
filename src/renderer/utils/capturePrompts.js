/**
 * Capture prompts for the Home input placeholder.
 * Grouped by focus so tags can plug in later; Home only needs pickPrompt today.
 */
const CAPTURE_PROMPTS = [
  {
    id: "emotions",
    prompts: [
      "Take a breath. What's the mood right now?",
      "What's on your mind at this exact moment?",
    ],
  },
  {
    id: "learning",
    prompts: [
      "What is the core takeaway you want to remember?",
      "How would you explain what you just learned to a beginner?",
    ],
  },
  {
    id: "distractions",
    prompts: [
      "What's nagging at your attention? Dump it here.",
      "Got a lingering to-do? Jot it down so you can refocus.",
    ],
  },
  {
    id: "past-hour",
    prompts: [
      "Quick recap: where did your focus go over the last hour?",
      "What did you just wrap up?",
    ],
  },
  {
    id: "joy",
    prompts: [
      "Capture a good moment—what made you smile today?",
      "What is going really well right now?",
    ],
  },
];

const ALL_PROMPTS = CAPTURE_PROMPTS.flatMap((group) => group.prompts);

/**
 * Picks a prompt for the capture placeholder.
 * Avoids repeating the previous prompt when more than one exists.
 * @param {string | null | undefined} previous
 * @returns {string}
 */
export function pickPrompt(previous) {
  if (ALL_PROMPTS.length === 0) {
    return "Capture a note…";
  }
  if (ALL_PROMPTS.length === 1) {
    return ALL_PROMPTS[0];
  }

  const choices =
    previous && ALL_PROMPTS.includes(previous)
      ? ALL_PROMPTS.filter((prompt) => prompt !== previous)
      : ALL_PROMPTS;
  return choices[Math.floor(Math.random() * choices.length)];
}
