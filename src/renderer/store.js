export const state = {
    mode: "onboarding",
    vaultPath: null,
    sidebarOpen: false
};

const listeners = [];

export function subscribe(callback) {
    listeners.push(callback);
}

export function updateState(newState) {
    Object.assign(state, newState);
    listeners.forEach(fn => fn(state)); // Tell everyone the state changed
}