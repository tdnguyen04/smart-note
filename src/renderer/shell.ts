import { mountEditor } from "./components/editor/Editor";
import { mountHome } from "./components/home/Home";
import { mountOnboarding } from "./components/onboarding/Onboarding";
import { mountRail } from "./components/rail/Rail";
import { mountSidebar } from "./components/sidebar/Sidebar";
import { mountTitlebar } from "./components/titlebar/Titlebar";
import { mountToolbar } from "./components/toolbar/Toolbar";
import { COPY } from "../shared/globals";
import { subscribe, type AppState } from "./state";

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing #${id}`);
  }
  return element;
}

function paintMode(mode: AppState["mode"]): void {
  switch (mode) {
    case null:
    case "onboarding":
    case "home":
    case "organize":
      return;
    default: {
      const _exhaustive: never = mode;
      throw new Error(_exhaustive);
    }
  }
}

export function mountShell(): void {
  const appEl = requireElement("app");
  const titlebar = requireElement("titlebar");
  const onboardingEl = requireElement("onboarding");
  const shellEl = requireElement("shell");
  const rail = requireElement("rail");
  const toolbar = requireElement("toolbar");
  const primarySidebarEl = requireElement("primary-sidebar");
  const sidebar = requireElement("sidebar");
  const sidebarEmptyEl = requireElement("sidebar-empty");
  const home = requireElement("home");
  const content = requireElement("content");
  const sidebarEmptyCopy = sidebarEmptyEl.querySelector("p");
  if (sidebarEmptyCopy) {
    sidebarEmptyCopy.textContent = COPY.sidebarEmpty;
  }

  mountRail(rail);
  mountTitlebar(titlebar);
  mountEditor(content);
  mountHome(home);
  mountSidebar(sidebar);
  mountToolbar(toolbar);
  mountOnboarding(onboardingEl);

  subscribe(
    (s) => s.vaultPath,
    (vaultPath) => {
      appEl.classList.toggle("has-vault", vaultPath !== null);
    },
  );

  subscribe(
    (s) => s.mode,
    (mode) => {
      paintMode(mode);
      shellEl.hidden = mode === null || mode === "onboarding";
      onboardingEl.hidden = !(mode === "onboarding");
      home.hidden = !(mode === "home");
      content.hidden = !(mode === "organize");
      sidebar.hidden = !(mode === "organize");
      sidebarEmptyEl.hidden = mode === "organize";
    },
  );

  subscribe(
    (s) => s.sidebarOpen,
    (sidebarOpen) => {
      primarySidebarEl.classList.toggle("is-collapsed", !sidebarOpen);
    },
  );
}
