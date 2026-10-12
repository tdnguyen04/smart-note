import type { Mode } from "../shared/globals";

export type AppState = {
  mode: Mode | null;
  vaultPath: string | null;
  sidebarOpen: boolean;
  selectedFilePath: string | null;
  treeEpoch: number;
};

export type StatePatch = {
  mode?: Mode | null;
  vaultPath?: string | null;
  sidebarOpen?: boolean;
  selectedFilePath?: string | null;
  treeEpoch?: number;
};

const state: AppState = {
  mode: null,
  vaultPath: null,
  sidebarOpen: false,
  selectedFilePath: null,
  treeEpoch: 0,
};

type Listener = {
  selector: (state: AppState) => unknown;
  onChange: (next: unknown, prev: unknown) => void;
  value: unknown;
};

const listeners: Listener[] = [];

export function getState(): AppState {
  return { ...state };
}

export function subscribe<T>(selector: (state: AppState) => T, onChange: (next: T, prev: T | undefined) => void): () => void {
  if (typeof selector !== "function" || typeof onChange !== "function") {
    throw new TypeError("subscribe(selector, onChange) requires two functions");
  }

  const value = selector(state);
  const entry: Listener = {
    selector,
    onChange: (next, prev) => {
      onChange(next as T, prev as T | undefined);
    },
    value,
  };
  listeners.push(entry);
  onChange(value, undefined);

  return () => {
    const index = listeners.indexOf(entry);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

export function updateState(partial: StatePatch = {}): void {
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
