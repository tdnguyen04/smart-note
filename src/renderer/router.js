import { subscribe } from "./store.js";

const appEl = document.getElementById("app");
const onboardingEl = document.getElementById("onboarding");
const shellEl = document.getElementById("shell");
const homeEl = document.getElementById("home");
const contentEl = document.getElementById("content");
const primarySidebarEl = document.getElementById("primary-sidebar");
const sidebarEl = document.getElementById("sidebar");
const sidebarEmptyEl = document.getElementById("sidebar-empty");

export function initRouter() {
  subscribe((s) => s.vaultPath, (vaultPath) => {
    appEl.classList.toggle("has-vault", vaultPath !== null);
  });

  subscribe((s) => s.mode, (mode) => {
    shellEl.hidden = mode === "onboarding";
    onboardingEl.hidden = mode !== "onboarding";
    homeEl.hidden = mode !== "home";
    contentEl.hidden = mode !== "organize" && mode !== "onboarding";

    const showFiles = mode === "organize";
    sidebarEl.hidden = !showFiles;
    sidebarEmptyEl.hidden = showFiles;
  });

  subscribe((s) => s.sidebarOpen, (sidebarOpen) => {
    primarySidebarEl.classList.toggle("is-collapsed", !sidebarOpen);
  });
}
