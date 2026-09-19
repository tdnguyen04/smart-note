import { subscribe } from "../../store.js";

export function mountTitlebar(root, { onToggleSidebar }) {
  root.classList.add("titlebar");
  root.replaceChildren();

  const left = document.createElement("div");
  left.className = "titlebar__left";

  const logo = document.createElement("img");
  logo.className = "titlebar__logo";
  logo.src = "../../assets/icon.svg";
  logo.alt = "";
  logo.draggable = false;

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "titlebar__toggle";
  toggleBtn.title = "Toggle file sidebar";
  toggleBtn.setAttribute("aria-label", "Toggle file sidebar");
  toggleBtn.textContent = "☰";
  toggleBtn.addEventListener("click", () => {
    onToggleSidebar?.();
    toggleBtn.blur();
  });

  left.append(logo, toggleBtn);

  const title = document.createElement("div");
  title.className = "titlebar__title";
  title.textContent = "SmartNote";

  const right = document.createElement("div");
  right.className = "titlebar__right";

  root.append(left, title, right);

  function setSidebarOpen(open) {
    const isOpen = Boolean(open);
    toggleBtn.classList.toggle("is-active", isOpen);
    toggleBtn.title = isOpen ? "Hide file sidebar" : "Show file sidebar";
    toggleBtn.setAttribute(
      "aria-label",
      isOpen ? "Hide file sidebar" : "Show file sidebar"
    );
  }

  subscribe((s) => s.sidebarOpen, setSidebarOpen);
}
