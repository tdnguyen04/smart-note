import { subscribe } from "../../store.js";

/**
 * App rail: Compose / Organize on top, Profile at bottom.
 */
export function mountRail(root, { onCompose, onOrganize, onProfile }) {
  root.classList.add("rail");
  root.replaceChildren();

  const top = document.createElement("div");
  top.className = "rail__top";

  const bottom = document.createElement("div");
  bottom.className = "rail__bottom";

  const composeBtn = createRailButton({
    label: "Compose",
    glyph: "✎",
    onClick: () => onCompose?.(),
  });

  const organizeBtn = createRailButton({
    label: "Organize",
    glyph: "▤",
    onClick: () => onOrganize?.(),
  });

  const profileBtn = createRailButton({
    label: "Profile",
    glyph: "○",
    onClick: () => onProfile?.(),
  });

  top.append(composeBtn, organizeBtn);
  bottom.append(profileBtn);
  root.append(top, bottom);

  subscribe(
    (s) => s.mode,
    (mode) => {
      composeBtn.classList.toggle("is-active", mode === "home");
      organizeBtn.classList.toggle("is-active", mode === "organize");
    }
  );
}

function createRailButton({ label, glyph, onClick, className = "rail__btn" }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = className;
  btn.title = label;
  btn.setAttribute("aria-label", label);
  btn.textContent = glyph;
  btn.addEventListener("click", () => onClick?.());
  return btn;
}
