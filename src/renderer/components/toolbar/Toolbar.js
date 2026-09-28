import { subscribe } from "../../state.js";
import { promptNewSession, resetSavedVault } from "../../transactions/vaultSession.js";
import { getFolderNameFromPath } from "../../../utils/paths.js";

/**
 * Mounts the vault name and settings menu into root.
 * Change vault calls promptNewSession. Reset saved vault returns to onboarding.
 */
export function mountToolbar(root) {
  root.classList.add("toolbar");
  root.replaceChildren();

  const nameEl = document.createElement("span");
  nameEl.className = "toolbar__name";
  nameEl.textContent = "";

  const actions = document.createElement("div");
  actions.className = "toolbar__actions";

  const menuWrap = document.createElement("div");
  menuWrap.className = "toolbar__menu";

  const gearBtn = document.createElement("button");
  gearBtn.type = "button";
  gearBtn.className = "toolbar__icon-button";
  gearBtn.title = "Settings";
  gearBtn.setAttribute("aria-label", "Settings");
  gearBtn.setAttribute("aria-haspopup", "menu");
  gearBtn.setAttribute("aria-expanded", "false");
  gearBtn.textContent = "⚙";

  const menu = document.createElement("div");
  menu.className = "toolbar__dropdown";
  menu.hidden = true;
  menu.setAttribute("role", "menu");

  const changeItem = document.createElement("button");
  changeItem.type = "button";
  changeItem.className = "toolbar__dropdown-item";
  changeItem.setAttribute("role", "menuitem");
  changeItem.textContent = "Change vault";
  changeItem.addEventListener("click", () => {
    menuOpen = false;
    renderMenu();
    void promptNewSession();
  });

  const resetItem = document.createElement("button");
  resetItem.type = "button";
  resetItem.className = "toolbar__dropdown-item";
  resetItem.setAttribute("role", "menuitem");
  resetItem.textContent = "Reset saved vault";
  resetItem.addEventListener("click", () => {
    menuOpen = false;
    renderMenu();
    void resetSavedVault();
  });

  menu.append(changeItem, resetItem);
  menuWrap.append(gearBtn, menu);
  actions.append(menuWrap);
  root.append(nameEl, actions);

  let menuOpen = false;

  function renderMenu() {
    menu.hidden = !menuOpen;
    gearBtn.setAttribute("aria-expanded", menuOpen ? "true" : "false");
  }

  gearBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    menuOpen = !menuOpen;
    renderMenu();
  });

  document.addEventListener("click", (event) => {
    if (!menuWrap.contains(event.target)) {
      menuOpen = false;
      renderMenu();
    }
  });

  function setVaultName(name) {
    nameEl.textContent = name || "";
    nameEl.title = name || "";
  }

  subscribe((s) => s.vaultPath, (vaultPath) => {
    setVaultName(getFolderNameFromPath(vaultPath));
  });
}
