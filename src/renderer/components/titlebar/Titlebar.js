export function mountTitlebar(root, { onFileMenu }) {
  root.classList.add("titlebar");
  root.replaceChildren();

  const left = document.createElement("div");
  left.className = "titlebar__left";

  const logo = document.createElement("img");
  logo.className = "titlebar__logo";
  logo.src = "../../assets/icon.svg";
  logo.alt = "";
  logo.draggable = false;

  const fileBtn = document.createElement("button");
  fileBtn.type = "button";
  fileBtn.className = "titlebar__menu-button";
  fileBtn.textContent = "File";
  fileBtn.addEventListener("click", (event) => {
    const rect = fileBtn.getBoundingClientRect();
    onFileMenu?.({
      x: Math.round(rect.left),
      y: Math.round(rect.bottom),
    });
    event.currentTarget.blur();
  });

  left.append(logo, fileBtn);

  const title = document.createElement("div");
  title.className = "titlebar__title";
  title.textContent = "SmartNote";

  const right = document.createElement("div");
  right.className = "titlebar__right";

  root.append(left, title, right);

  return {
    el: root,
  };
}
