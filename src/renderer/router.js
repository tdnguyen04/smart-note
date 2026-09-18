import { state, subscribe, constants } from "./store.js";

// Note: We move the element selections here because only the router needs to hide/show them.
const appEl = document.getElementById("app");
const emptyRoot = document.getElementById("empty-state");
const shellEl = document.getElementById("shell");
const homeEl = document.getElementById("home");
const contentEl = document.getElementById("content");
const primarySidebarEl = document.getElementById("primary-sidebar");
const sidebarEl = document.getElementById("sidebar");
const sidebarEmptyEl = document.getElementById("sidebar-empty");


export function initRouter({ titlebar, rail, onboardingState, home }) {
  // We pass in references to the mounted components so the router can trigger their UI methods

  subscribe((state) => {
    // 1. App-level classes
    appEl.classList.toggle("has-vault", state.vaultPath !== null);

    // 2. Main View Routing (The Switch)
    shellEl.hidden = state.mode === "onboarding";
    emptyRoot.hidden = state.mode !== "onboarding";

    homeEl.hidden = state.mode !== "home";
    contentEl.hidden = (state.mode !== "organize" && state.mode !== "onboarding");

    // 3. Handle Component Visibility/States based on Mode
    if (state.mode === "home") home.focus();

    // 4. Handle Sidebar Visibility and State
    const showFiles = state.mode === "organize";
    sidebarEl.hidden = !showFiles;
    sidebarEmptyEl.hidden = showFiles;

    // Apply collapse classes
    primarySidebarEl.classList.toggle("is-collapsed", !state.sidebarOpen);
    titlebar.setSidebarOpen(state.sidebarOpen);
  });
}