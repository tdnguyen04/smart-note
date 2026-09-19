import { subscribe } from "../../store.js";
import { vaultNameFromPath } from "../../utils.js";

/**
 * Home capture UI. Submit is visual-only this phase.
 */
export function mountHome(root) {
  root.classList.add("home");
  root.replaceChildren();

  const panel = document.createElement("div");
  panel.className = "home__panel";

  const header = document.createElement("div");
  header.className = "home__header";

  const headline = document.createElement("h1");
  headline.className = "home__headline";
  headline.textContent = "What's on your mind?";

  const vaultLine = document.createElement("p");
  vaultLine.className = "home__vault";
  vaultLine.hidden = true;

  const vaultIcon = document.createElement("span");
  vaultIcon.className = "home__vault-icon";
  vaultIcon.setAttribute("aria-hidden", "true");
  vaultIcon.innerHTML = `
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4">
      <path d="M1.5 4.5h4l1.5 1.5H14.5v7.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" />
    </svg>
  `.trim();

  const vaultLabel = document.createElement("span");
  vaultLabel.className = "home__vault-label";

  const vaultName = document.createElement("span");
  vaultName.className = "home__vault-name";

  vaultLabel.append(document.createTextNode("Saving to "), vaultName);
  vaultLine.append(vaultIcon, vaultLabel);
  header.append(headline, vaultLine);

  const capture = document.createElement("div");
  capture.className = "home__capture";

  const input = document.createElement("textarea");
  input.className = "home__input";
  input.placeholder = "Capture a note…";
  input.setAttribute("aria-label", "Capture a note");
  input.rows = 4;
  input.wrap = "soft";
  input.spellcheck = true;

  const actions = document.createElement("div");
  actions.className = "home__actions";

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "home__submit";
  submit.textContent = "Submit";
  submit.addEventListener("click", (event) => {
    event.preventDefault();
    // Inert in Phase 2 — writing notes from Home comes later.
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit.click();
    }
  });

  actions.append(submit);
  capture.append(input, actions);
  panel.append(header, capture);
  root.append(panel);

  function setVaultName(name) {
    const label = (name || "").trim();
    if (!label) {
      vaultName.textContent = "";
      vaultLine.removeAttribute("title");
      vaultLine.hidden = true;
      return;
    }
    vaultName.textContent = label;
    vaultLine.title = label;
    vaultLine.hidden = false;
  }

  function focus() {
    // Defer so focus wins after rail/titlebar button clicks and unhide.
    requestAnimationFrame(() => {
      input.focus({ preventScroll: true });
    });
  }
  function clear() {
    input.value = "";
  }

  subscribe((s) => s.vaultPath, (vaultPath) => {
    setVaultName(vaultPath ? vaultNameFromPath(vaultPath) : "");
  });

  subscribe((s) => s.mode, (mode, prevMode) => {
    if (mode === "home" && prevMode !== "home") {
      focus();
    }
  });
}
