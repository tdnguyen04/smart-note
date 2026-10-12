import type { Mode } from "../../shared/globals";

/**
 * The facts more than one region must agree on, and nothing else.
 * Writers: `commands.ts` and `transactions/*` only (lint enforces it).
 * Region-private state (tree expansion, editor text, menus, capture draft) lives in its region.
 *
 * The state object is replaced, never mutated, on every write. That lets React compare
 * snapshots with `Object.is` and lets readers hold a snapshot without it changing under them.
 */

export type AppState = {
  mode: Mode | null;
  vaultPath: string | null;
  sidebarOpen: boolean;
  selectedFilePath: string | null;
  /** Bumped to ask the sidebar to reload the tree for the same vault. */
  treeEpoch: number;
};

export type StatePatch = Partial<AppState>;

let state: Readonly<AppState> = {
  mode: null,
  vaultPath: null,
  sidebarOpen: false,
  selectedFilePath: null,
  treeEpoch: 0,
};

const listeners = new Set<() => void>();

/** Current snapshot. Never mutate it; write through a command. */
export function getState(): Readonly<AppState> {
  return state;
}

/** Notifies on every write. Callers decide whether the part they read changed. */
export function subscribeStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Merges a patch into a new snapshot. Writing identical values does not notify anyone. */
export function updateState(patch: StatePatch): void {
  const next = { ...state, ...patch };
  const changed = (Object.keys(next) as Array<keyof AppState>).some((key) => !Object.is(next[key], state[key]));
  if (!changed) {
    return;
  }
  state = next;
  for (const listener of listeners) {
    listener();
  }
}
