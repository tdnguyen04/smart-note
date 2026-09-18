export const state = {
    /** @type {"onboarding" | "home" | "organize"} */
    mode: "onboarding",
    /** @type {string | null} */
    vaultPath: null,
    /** @type {boolean} */
    sidebarOpen: false,

    /** @type {{ home: boolean, organize: boolean }} */
    /** Read-only preference for sidebar open state by mode. */
    sidebarOpenByMode: {
        home: false,
        organize: true
    },
    /** @type {string | null} */
    selectedFilePath: null
};

const listeners = [];

export function subscribe(callback) {
    listeners.push(callback);
}

export function updateState(newState) {
    Object.assign(state, newState);
    listeners.forEach(fn => fn(state)); // Tell everyone the state changed
}