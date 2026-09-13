/**
 * Home capture UI. Submit is visual-only this phase.
 */
export function mountHome(root) {
  root.classList.add("home");
  root.replaceChildren();

  const panel = document.createElement("div");
  panel.className = "home__panel";

  const headline = document.createElement("h1");
  headline.className = "home__headline";
  headline.textContent = "What's on your mind?";

  const vaultLine = document.createElement("p");
  vaultLine.className = "home__vault";
  vaultLine.hidden = true;

  const capture = document.createElement("div");
  capture.className = "home__capture";

  const input = document.createElement("textarea");
  input.className = "home__input";
  input.placeholder = "Capture a note…";
  input.setAttribute("aria-label", "Capture a note");
  input.rows = 3;
  input.wrap = "soft";
  input.spellcheck = true;

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

  capture.append(input, submit);
  panel.append(headline, vaultLine, capture);
  root.append(panel);

  return {
    focus() {
      input.focus();
    },
    clear() {
      input.value = "";
    },
    setVaultName(name) {
      const label = (name || "").trim();
      if (!label) {
        vaultLine.textContent = "";
        vaultLine.removeAttribute("title");
        vaultLine.hidden = true;
        return;
      }
      vaultLine.textContent = `Saving to ${label}`;
      vaultLine.title = label;
      vaultLine.hidden = false;
    },
  };
}
