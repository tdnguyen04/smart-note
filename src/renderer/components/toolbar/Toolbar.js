export function mountToolbar(root, { onChangeVault }) {
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
    closeMenu();
    onChangeVault?.();
  });

  menu.append(changeItem);
  menuWrap.append(gearBtn, menu);
  actions.append(menuWrap);
  root.append(nameEl, actions);

  function closeMenu() {
    menu.hidden = true;
    gearBtn.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    menu.hidden = false;
    gearBtn.setAttribute("aria-expanded", "true");
  }

  gearBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!menuWrap.contains(event.target)) {
      closeMenu();
    }
  });

  return {
    setVaultName(name) {
      nameEl.textContent = name || "";
      nameEl.title = name || "";
    },
  };
}
