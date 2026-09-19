export const state = {
  /** @type {"onboarding" | "home" | "organize"} */
  mode: "onboarding",
  /** @type {string | null} */
  vaultPath: null,
  /** @type {boolean} */
  sidebarOpen: false,
  /** @type {string | null} */
  selectedFilePath: null,
};

export const constants = {
  /** Read-only default sidebar open state by mode. */
  sidebarOpenByMode: {
    home: false,
    organize: true,
  },
};

/** @type {{ selector: (s: typeof state) => unknown, onChange: Function, value: unknown }[]} */
const listeners = [];

/**
 * Subscribe to a slice of state. onChange runs when selector result changes (Object.is).
 * Runs once immediately with the current value.
 * @returns {() => void} unsubscribe
 */
export function subscribe(selector, onChange) {
  if (typeof selector !== "function" || typeof onChange !== "function") {
    throw new TypeError("subscribe(selector, onChange) requires two functions");
  }

  const value = selector(state);
  const entry = { selector, onChange, value };
  listeners.push(entry);
  onChange(value, undefined);

  // Unsubscribe
  return () => {
    const index = listeners.indexOf(entry);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

export function updateState(partial = {}) {
  Object.assign(state, partial);

  for (const entry of listeners) {
    const next = entry.selector(state);
    if (!Object.is(next, entry.value)) {
      const prev = entry.value;
      entry.value = next;
      entry.onChange(next, prev);
    }
  }
}
