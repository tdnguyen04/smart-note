import { openCapturedNote, refreshTree } from "../../commands.js";
import { getState, subscribe } from "../../state.js";
import { promptNewSession } from "../../transactions/vaultSession.js";
import { getFolderNameFromPath } from "../../../utils/paths.js";
import {
  composeNoteContent,
  defaultFocuses,
  focusById,
  listFocuses,
  pickPrompt,
} from "../../utils/captureFocuses.js";
import { armSavedSound } from "../../utils/savedSound.js";

const SUCCESS_FLASH_MS = 1200;
const NUDGE_MS = 5000;
const VISIBLE_TAG_COUNT = 3;

/**
 * Mounts the Home capture panel into root.
 * Submit writes the draft as a note. The vault name calls promptNewSession.
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
  headline.textContent = "Jot it down";

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

  const vaultCaption = document.createElement("span");
  vaultCaption.className = "home__vault-label";

  const vaultName = document.createElement("button");
  vaultName.type = "button";
  vaultName.className = "home__vault-name";
  vaultName.title = "Change vault";
  vaultName.setAttribute("aria-label", "Change vault");
  vaultName.addEventListener("click", () => {
    void promptNewSession();
  });

  vaultCaption.append(document.createTextNode("Saving to "), vaultName);
  vaultLine.append(vaultIcon, vaultCaption);
  header.append(headline, vaultLine);

  const capture = document.createElement("div");
  capture.className = "home__capture";

  const tags = document.createElement("div");
  tags.className = "home__tags";

  const hint = document.createElement("p");
  hint.className = "home__hint";
  hint.hidden = true;

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

  const status = document.createElement("p");
  status.className = "home__status";
  status.hidden = true;

  const nudge = document.createElement("div");
  nudge.className = "home__nudge";
  nudge.hidden = true;
  nudge.setAttribute("role", "status");

  const nudgeText = document.createElement("span");
  nudgeText.className = "home__nudge-text";
  nudgeText.textContent = "Note saved.";

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "home__nudge-action";
  openBtn.textContent = "Open in Organize";
  openBtn.addEventListener("click", () => {
    const path = savedPath;
    hideNudge();
    if (path) {
      openCapturedNote(path);
    }
  });

  const dismissBtn = document.createElement("button");
  dismissBtn.type = "button";
  dismissBtn.className = "home__nudge-dismiss";
  dismissBtn.setAttribute("aria-label", "Dismiss");
  dismissBtn.textContent = "×";
  dismissBtn.addEventListener("click", () => {
    hideNudge();
  });

  nudge.append(nudgeText, openBtn, dismissBtn);

  let draft = "";
  let saving = false;
  let error = "";
  let savedPath = null;
  let successFlash = false;
  let flashTimer = null;
  let nudgeTimer = null;
  let selectedFocusId = null;
  let visibleIds = defaultFocuses().map((focus) => focus.id);
  let moreOpen = false;
  let hintText = "";

  function render() {
    if (input.value !== draft) {
      input.value = draft;
    }
    input.disabled = saving;
    submit.disabled = saving || !draft.trim();
    submit.classList.toggle("is-success", successFlash);

    status.hidden = !error;
    status.textContent = error;

    hint.hidden = !hintText;
    hint.textContent = hintText;
    const selected = focusById(selectedFocusId);
    hint.style.color = selected && hintText ? selected.color : "";

    nudge.hidden = !savedPath;
    paintTags();
  }

  function paintTags() {
    tags.replaceChildren();

    for (const id of visibleIds) {
      const focus = focusById(id);
      if (!focus) {
        continue;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "home__tag";
      button.classList.toggle("is-selected", selectedFocusId === id);
      button.style.setProperty("--tag-color", focus.color);
      button.setAttribute("aria-pressed", selectedFocusId === id ? "true" : "false");
      button.disabled = saving;
      button.append(tagDot(), tagLabel(focus.label));
      button.addEventListener("click", () => {
        selectedFocusId = selectedFocusId === id ? null : id;
        hintText = "";
        moreOpen = false;
        render();
      });
      tags.append(button);
    }

    const rest = listFocuses().filter((focus) => !visibleIds.includes(focus.id));
    if (rest.length > 0) {
      const moreWrap = document.createElement("div");
      moreWrap.className = "home__more";

      const moreBtn = document.createElement("button");
      moreBtn.type = "button";
      moreBtn.className = "home__more-button";
      moreBtn.textContent = "More";
      moreBtn.disabled = saving;
      moreBtn.setAttribute("aria-expanded", moreOpen ? "true" : "false");
      moreBtn.setAttribute("aria-haspopup", "menu");
      moreBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        moreOpen = !moreOpen;
        render();
      });
      moreWrap.append(moreBtn);

      if (moreOpen) {
        const menu = document.createElement("div");
        menu.className = "home__more-menu";
        menu.setAttribute("role", "menu");
        for (const focus of rest) {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "home__more-item";
          item.setAttribute("role", "menuitem");
          item.style.setProperty("--tag-color", focus.color);
          item.append(tagDot(), tagLabel(focus.label));
          item.addEventListener("click", () => {
            visibleIds = [
              ...visibleIds.slice(0, VISIBLE_TAG_COUNT - 1),
              focus.id,
            ];
            selectedFocusId = focus.id;
            hintText = "";
            moreOpen = false;
            render();
          });
          menu.append(item);
        }
        moreWrap.append(menu);
      }

      tags.append(moreWrap);
    }

    const hintBtn = document.createElement("button");
    hintBtn.type = "button";
    hintBtn.className = "home__hint-button";
    hintBtn.textContent = "Hint";
    hintBtn.disabled = saving;
    hintBtn.addEventListener("click", () => {
      hintText = pickPrompt(selectedFocusId, hintText);
      moreOpen = false;
      render();
    });
    tags.append(hintBtn);
  }

  function clearNudgeTimer() {
    if (nudgeTimer !== null) {
      window.clearTimeout(nudgeTimer);
      nudgeTimer = null;
    }
  }

  function hideNudge() {
    clearNudgeTimer();
    savedPath = null;
    render();
  }

  function showNudge() {
    clearNudgeTimer();
    render();
    nudgeTimer = window.setTimeout(() => {
      nudgeTimer = null;
      savedPath = null;
      render();
    }, NUDGE_MS);
  }

  function clearSuccessFlash() {
    if (flashTimer !== null) {
      window.clearTimeout(flashTimer);
      flashTimer = null;
    }
    successFlash = false;
  }

  function playSuccessFlash() {
    clearSuccessFlash();
    successFlash = true;
    render();
    flashTimer = window.setTimeout(() => {
      flashTimer = null;
      successFlash = false;
      render();
    }, SUCCESS_FLASH_MS);
  }

  async function submitNote() {
    const text = draft;
    if (!text.trim() || saving) {
      return;
    }
    const vaultPath = getState().vaultPath;
    if (!vaultPath) {
      return;
    }

    const playSavedSound = armSavedSound();
    saving = true;
    error = "";
    clearNudgeTimer();
    savedPath = null;
    moreOpen = false;
    render();

    try {
      const result = await window.smartnote.createNote(
        vaultPath,
        composeNoteContent({ focusId: selectedFocusId, body: text })
      );
      if (!result?.ok) {
        error = result?.message || "Could not save this note.";
        return;
      }
      draft = "";
      hintText = "";
      savedPath = result.path;
      refreshTree();
      playSuccessFlash();
      playSavedSound();
      showNudge();
      focus();
    } catch (caught) {
      console.error(caught);
      error = "Could not save this note.";
    } finally {
      saving = false;
      render();
    }
  }

  submit.addEventListener("click", (event) => {
    event.preventDefault();
    void submitNote();
  });

  input.addEventListener("input", () => {
    draft = input.value;
    if (error) {
      error = "";
    }
    render();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void submitNote();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!moreOpen || tags.contains(event.target)) {
      return;
    }
    moreOpen = false;
    render();
  });

  actions.append(submit);
  capture.append(tags, hint, input, actions, status);
  render();
  panel.append(header, capture);
  root.append(panel, nudge);

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

  subscribe((s) => s.vaultPath, (vaultPath) => {
    setVaultName(getFolderNameFromPath(vaultPath));
  });

  subscribe((s) => s.mode, (mode, prevMode) => {
    if (mode === "home" && prevMode !== "home") {
      focus();
    }
  });
}

function tagDot() {
  const dot = document.createElement("span");
  dot.className = "home__tag-dot";
  dot.setAttribute("aria-hidden", "true");
  return dot;
}

function tagLabel(text) {
  const label = document.createElement("span");
  label.textContent = text;
  return label;
}
