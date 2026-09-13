/**
 * App ribbon: Compose / Organize on top, Profile at bottom.
 */
export function mountRail(root, { onCompose, onOrganize, onProfile }) {
  root.classList.add("ribbon");
  root.replaceChildren();

  const top = document.createElement("div");
  top.className = "ribbon__top";

  const bottom = document.createElement("div");
  bottom.className = "ribbon__bottom";

  const composeBtn = createRibbonButton({
    label: "Compose",
    glyph: "✎",
    onClick: () => onCompose?.(),
  });

  const organizeBtn = createRibbonButton({
    label: "Organize",
    glyph: "▤",
    onClick: () => onOrganize?.(),
  });

  const profileBtn = createRibbonButton({
    label: "Profile",
    glyph: "○",
    onClick: () => onProfile?.(),
  });

  top.append(composeBtn, organizeBtn);
  bottom.append(profileBtn);
  root.append(top, bottom);

  /** @type {"compose" | "organize" | null} */
  let active = null;

  function applyActive() {
    composeBtn.classList.toggle("is-active", active === "compose");
    organizeBtn.classList.toggle("is-active", active === "organize");
  }

  return {
    setActive(next) {
      active = next === "compose" || next === "organize" ? next : null;
      applyActive();
    },
  };
}

function createRibbonButton({ label, glyph, onClick, className = "ribbon__btn" }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = className;
  btn.title = label;
  btn.setAttribute("aria-label", label);
  btn.textContent = glyph;
  btn.addEventListener("click", () => onClick?.());
  return btn;
}
