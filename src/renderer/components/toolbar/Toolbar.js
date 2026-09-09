export function mountToolbar(root, { onChangeVault, onToggleSidebar }) {
  root.classList.add("toolbar");
  root.replaceChildren();

  const nameEl = document.createElement("span");
  nameEl.className = "toolbar__name";
  nameEl.textContent = "";

  const actions = document.createElement("div");
  actions.className = "toolbar__actions";

  const changeBtn = document.createElement("button");
  changeBtn.type = "button";
  changeBtn.className = "toolbar__button";
  changeBtn.textContent = "Change vault";
  changeBtn.addEventListener("click", () => {
    onChangeVault?.();
  });

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "toolbar__button";
  toggleBtn.textContent = "Hide sidebar";
  toggleBtn.addEventListener("click", () => {
    onToggleSidebar?.();
  });

  actions.append(changeBtn, toggleBtn);
  root.append(nameEl, actions);

  return {
    setVaultName(name) {
      nameEl.textContent = name || "";
      nameEl.title = name || "";
    },
    setSidebarVisible(visible) {
      toggleBtn.textContent = visible ? "Hide sidebar" : "Show sidebar";
    },
  };
}
