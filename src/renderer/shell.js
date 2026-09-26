import { mountEditor } from "./components/editor/Editor.js";
import { mountHome } from "./components/home/Home.js";
import { mountOnboarding } from "./components/onboarding/Onboarding.js";
import { mountRail } from "./components/rail/Rail.js";
import { mountSidebar } from "./components/sidebar/Sidebar.js";
import { mountTitlebar } from "./components/titlebar/Titlebar.js";
import { mountToolbar } from "./components/toolbar/Toolbar.js";
import { subscribe } from "./state.js";

/**
 * Mounts every region and shows or hides the frame from mode, vaultPath, and sidebarOpen.
 * This is the only module that looks up shell ids.
 */
export function mountShell() {
  const appEl = document.getElementById("app");
  const titlebar = document.getElementById("titlebar");
  const onboardingEl = document.getElementById("onboarding");
  const shellEl = document.getElementById("shell");
  const rail = document.getElementById("rail");
  const toolbar = document.getElementById("toolbar");
  const primarySidebarEl = document.getElementById("primary-sidebar");
  const sidebar = document.getElementById("sidebar");
  const sidebarEmptyEl = document.getElementById("sidebar-empty");
  const home = document.getElementById("home");
  const content = document.getElementById("content");

  mountRail(rail);
  mountTitlebar(titlebar);
  mountEditor(content);
  mountHome(home);
  mountSidebar(sidebar);
  mountToolbar(toolbar);
  mountOnboarding(onboardingEl);

  subscribe((s) => s.vaultPath, (vaultPath) => {
    appEl.classList.toggle("has-vault", vaultPath !== null);
  });

  subscribe((s) => s.mode, (mode) => {
    shellEl.hidden = mode === "onboarding";
    onboardingEl.hidden = mode !== "onboarding";
    home.hidden = mode !== "home";
    content.hidden = mode !== "organize" && mode !== "onboarding";

    const showFiles = mode === "organize";
    sidebar.hidden = !showFiles;
    sidebarEmptyEl.hidden = showFiles;
  });

  subscribe((s) => s.sidebarOpen, (sidebarOpen) => {
    primarySidebarEl.classList.toggle("is-collapsed", !sidebarOpen);
  });
}
