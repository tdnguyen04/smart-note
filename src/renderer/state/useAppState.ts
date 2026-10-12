import { useSyncExternalStore } from "react";
import { getState, subscribeStore, type AppState } from "./store";

/**
 * Reads one value from app state and re-renders only when that value changes (`Object.is`).
 *
 * Keep selectors narrow and return primitives: `s => s.mode === "home"` re-renders on the
 * two transitions that matter, while `s => s` would re-render on every write.
 * A selector that builds a new object or array each call would re-render on every write too.
 */
export function useAppState<T>(selector: (state: Readonly<AppState>) => T): T {
  return useSyncExternalStore(subscribeStore, () => selector(getState()));
}
