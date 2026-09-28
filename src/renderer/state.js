const state = {
  /** @type {"onboarding" | "home" | "organize" | null} */
  mode: null,
  /** @type {string | null} */
  vaultPath: null,
  /** @type {boolean} */
  sidebarOpen: false,
  /** @type {string | null} */
  selectedFilePath: null,
  /** Bumps when a note is created so the file tree reloads. */
  treeEpoch: 0,
};

/** @type {{ selector: (s: typeof state) => unknown, onChange: Function, value: unknown }[]} */
const listeners = [];

/**
 * A copy of the shared facts: mode, vaultPath, sidebarOpen, selectedFilePath, treeEpoch.
 * Read this. Change those facts through a command or the vault transaction.
 */
export function getState() {
  return { ...state };
}

/**
 * Runs onChange when the selector result changes (Object.is).
 * Also runs once immediately with the current value.
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

  return () => {
    const index = listeners.indexOf(entry);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Merges a partial into shared state and notifies selectors that changed.
 * Callers: commands.js and transactions/vault.js.
 */
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
