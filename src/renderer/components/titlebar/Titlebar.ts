import logoUrl from "../../../../assets/icon.svg";
import { toggleSidebar } from "../../commands";
import { APP } from "../../../shared/globals";
import { subscribe } from "../../state";

export function mountTitlebar(root: HTMLElement): void {
  root.classList.add("titlebar");
  root.replaceChildren();

  const left = document.createElement("div");
  left.className = "titlebar__left";

  const logo = document.createElement("img");
  logo.className = "titlebar__logo";
  logo.src = logoUrl;
  logo.alt = "";
  logo.draggable = false;

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "titlebar__toggle";
  toggleBtn.title = "Toggle file sidebar";
  toggleBtn.setAttribute("aria-label", "Toggle file sidebar");
  toggleBtn.textContent = "☰";
  toggleBtn.addEventListener("click", () => {
    toggleSidebar();
    toggleBtn.blur();
  });

  left.append(logo, toggleBtn);

  const title = document.createElement("div");
  title.className = "titlebar__title";
  title.textContent = APP.name;

  const right = document.createElement("div");
  right.className = "titlebar__right";

  root.append(left, title, right);

  function setSidebarOpen(open: boolean): void {
    toggleBtn.classList.toggle("is-active", open);
    toggleBtn.title = open ? "Hide file sidebar" : "Show file sidebar";
    toggleBtn.setAttribute("aria-label", open ? "Hide file sidebar" : "Show file sidebar");
  }

  subscribe(
    (s) => s.sidebarOpen,
    (sidebarOpen) => {
      setSidebarOpen(sidebarOpen);
    },
  );
}
