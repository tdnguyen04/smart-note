import { COPY, FOCUS_CHIPS_BEFORE_MORE, FOCUSES, TIMINGS_MS, type FocusId } from "../../../shared/globals";
import { composeFrontmatter, focusById, pickPrompt } from "../../../shared/focus";
import { openCapturedNote, refreshTree } from "../../commands";
import { getState, subscribe } from "../../state";
import { promptNewSession } from "../../transactions/vaultSession";
import { armSavedSound } from "../../utils/savedSound";
import { getFolderNameFromPath } from "../../../utils/paths";

export function mountHome(root: HTMLElement): void {
  root.classList.add("home");
  root.replaceChildren();

  const panel = document.createElement("div");
  panel.className = "home__panel";

  const header = document.createElement("div");
  header.className = "home__header";

  const headline = document.createElement("h1");
  headline.className = "home__headline";
  headline.textContent = COPY.home.headline;

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
  vaultName.title = COPY.home.changeFolder;
  vaultName.setAttribute("aria-label", COPY.home.changeFolder);
  vaultName.addEventListener("click", () => {
    void promptNewSession();
  });

  vaultCaption.append(document.createTextNode(COPY.home.savingTo), vaultName);
  vaultLine.append(vaultIcon, vaultCaption);
  header.append(headline, vaultLine);

  const capture = document.createElement("div");
  capture.className = "home__capture";

  const tags = document.createElement("div");
  tags.className = "home__tags";

  const field = document.createElement("div");
  field.className = "home__field";

  const hintBar = document.createElement("div");
  hintBar.className = "home__hint-bar";
  hintBar.hidden = true;

  const hintIcon = document.createElement("span");
  hintIcon.className = "home__hint-icon";
  hintIcon.setAttribute("aria-hidden", "true");
  hintIcon.innerHTML = `
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3">
      <path d="M8 1.7a3.9 3.9 0 0 0-2.2 7.1c.35.3.55.7.55 1.15V11h3.3v-1.05c0-.45.2-.85.55-1.15A3.9 3.9 0 0 0 8 1.7z" />
      <path d="M6.5 12.4h3M6.9 13.8h2.2" stroke-linecap="round" />
    </svg>
  `.trim();

  const hint = document.createElement("p");
  hint.className = "home__hint";

  const hintLabel = document.createElement("span");
  hintLabel.className = "home__hint-label";
  hintLabel.textContent = COPY.home.hintLabel;

  const hintQuestion = document.createElement("span");
  hintQuestion.className = "home__hint-question";
  hint.append(hintLabel, hintQuestion);

  const hintClose = document.createElement("button");
  hintClose.type = "button";
  hintClose.className = "home__hint-close";
  hintClose.setAttribute("aria-label", COPY.home.closeHint);
  hintClose.textContent = "×";
  hintClose.addEventListener("click", () => {
    hintText = "";
    render();
  });

  const shuffleWrap = document.createElement("div");
  shuffleWrap.className = "home__hint-shuffle-wrap";

  const hintShuffle = document.createElement("button");
  hintShuffle.type = "button";
  hintShuffle.className = "home__hint-shuffle";
  hintShuffle.setAttribute("aria-label", COPY.home.anotherQuestion);
  hintShuffle.innerHTML = `
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
      <path d="M13.1 6.1A5.1 5.1 0 0 0 3.5 4.7" stroke-linecap="round" />
      <path d="M3.1 2.9v2.1h2.1" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M2.9 9.9a5.1 5.1 0 0 0 9.6 1.4" stroke-linecap="round" />
      <path d="M12.9 13.1v-2.1h-2.1" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `.trim();
  hintShuffle.addEventListener("click", () => {
    hintText = pickPrompt(selectedFocusId, hintText);
    moreOpen = false;
    render();
  });

  const hintTip = document.createElement("p");
  hintTip.className = "home__hint-tip";
  hintTip.id = "home-hint-tip";
  hintShuffle.setAttribute("aria-describedby", hintTip.id);

  function showTopicHint(on: boolean): void {
    tags.classList.toggle("is-hinted", on);
  }

  hintShuffle.addEventListener("mouseenter", () => {
    showTopicHint(true);
  });
  hintShuffle.addEventListener("mouseleave", () => {
    showTopicHint(false);
  });
  hintShuffle.addEventListener("focus", () => {
    if (hintShuffle.matches(":focus-visible")) {
      showTopicHint(true);
    }
  });
  hintShuffle.addEventListener("blur", () => {
    showTopicHint(false);
  });

  shuffleWrap.append(hintShuffle, hintTip);
  hintBar.append(hintIcon, hint, hintClose, shuffleWrap);

  const hintBtn = document.createElement("button");
  hintBtn.type = "button";
  hintBtn.className = "home__hint-button";
  hintBtn.setAttribute("aria-label", COPY.home.showPrompt);
  hintBtn.innerHTML = hintIcon.innerHTML;
  hintBtn.addEventListener("click", () => {
    hintText = pickPrompt(selectedFocusId, hintText);
    moreOpen = false;
    render();
  });

  const input = document.createElement("textarea");
  input.className = "home__input";
  input.placeholder = COPY.home.placeholder;
  input.setAttribute("aria-label", COPY.home.inputLabel);
  input.rows = 4;
  input.wrap = "soft";
  input.spellcheck = true;

  const actions = document.createElement("div");
  actions.className = "home__actions";

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "home__submit";
  submit.textContent = COPY.home.save;

  const status = document.createElement("p");
  status.className = "home__status";
  status.hidden = true;

  const nudge = document.createElement("div");
  nudge.className = "home__nudge";
  nudge.hidden = true;
  nudge.setAttribute("role", "status");

  const nudgeText = document.createElement("span");
  nudgeText.className = "home__nudge-text";
  nudgeText.textContent = COPY.home.saved;

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "home__nudge-action";
  openBtn.textContent = COPY.home.openInOrganize;
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
  dismissBtn.setAttribute("aria-label", COPY.home.dismiss);
  dismissBtn.textContent = "×";
  dismissBtn.addEventListener("click", () => {
    hideNudge();
  });

  nudge.append(nudgeText, openBtn, dismissBtn);

  let draft = "";
  let saving = false;
  let error = "";
  let savedPath: string | null = null;
  let successFlash = false;
  let flashTimer: number | null = null;
  let nudgeTimer: number | null = null;
  let selectedFocusId: FocusId | null = null;
  let visibleIds: FocusId[] = FOCUSES.slice(0, FOCUS_CHIPS_BEFORE_MORE).map((focus) => focus.id);
  let moreOpen = false;
  let hintText = "";

  function render(): void {
    if (input.value !== draft) {
      input.value = draft;
    }
    input.disabled = saving;
    submit.disabled = saving || !draft.trim();
    submit.classList.toggle("is-success", successFlash);

    status.hidden = !error;
    status.textContent = error;

    const hintOpen = Boolean(hintText);
    hintBar.hidden = !hintOpen;
    hintQuestion.textContent = hintText;
    hintBtn.hidden = hintOpen;
    hintBtn.disabled = saving;
    hintClose.disabled = saving;
    hintShuffle.disabled = saving;
    field.classList.toggle("has-hint", hintOpen);
    hintTip.textContent = selectedFocusId ? COPY.home.hintFollowsTopic : COPY.home.hintChooseTopic;

    nudge.hidden = !savedPath;
    paintTags();
  }

  function paintTags(): void {
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
        if (hintText) {
          hintText = pickPrompt(selectedFocusId, hintText);
        }
        moreOpen = false;
        render();
      });
      tags.append(button);
    }

    const rest = FOCUSES.filter((focus) => !visibleIds.includes(focus.id));
    if (rest.length > 0) {
      const moreWrap = document.createElement("div");
      moreWrap.className = "home__more";

      const moreBtn = document.createElement("button");
      moreBtn.type = "button";
      moreBtn.className = "home__more-button";
      moreBtn.setAttribute("aria-label", COPY.home.moreTags);
      moreBtn.disabled = saving;
      moreBtn.setAttribute("aria-expanded", moreOpen ? "true" : "false");
      moreBtn.setAttribute("aria-haspopup", "menu");
      moreBtn.innerHTML = `
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <circle cx="3.25" cy="8" r="1.15" fill="currentColor" />
          <circle cx="8" cy="8" r="1.15" fill="currentColor" />
          <circle cx="12.75" cy="8" r="1.15" fill="currentColor" />
        </svg>
      `.trim();
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
            visibleIds = [...visibleIds.slice(0, FOCUS_CHIPS_BEFORE_MORE - 1), focus.id];
            selectedFocusId = focus.id;
            if (hintText) {
              hintText = pickPrompt(selectedFocusId, hintText);
            }
            moreOpen = false;
            render();
          });
          menu.append(item);
        }
        moreWrap.append(menu);
      }

      tags.append(moreWrap);
    }
  }

  function clearNudgeTimer(): void {
    if (nudgeTimer !== null) {
      window.clearTimeout(nudgeTimer);
      nudgeTimer = null;
    }
  }

  function hideNudge(): void {
    clearNudgeTimer();
    savedPath = null;
    render();
  }

  function showNudge(): void {
    clearNudgeTimer();
    render();
    nudgeTimer = window.setTimeout(() => {
      nudgeTimer = null;
      savedPath = null;
      render();
    }, TIMINGS_MS.nudge);
  }

  function clearSuccessFlash(): void {
    if (flashTimer !== null) {
      window.clearTimeout(flashTimer);
      flashTimer = null;
    }
    successFlash = false;
  }

  function playSuccessFlash(): void {
    clearSuccessFlash();
    successFlash = true;
    render();
    flashTimer = window.setTimeout(() => {
      flashTimer = null;
      successFlash = false;
      render();
    }, TIMINGS_MS.successFlash);
  }

  async function submitNote(): Promise<void> {
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
        composeFrontmatter({ focusId: selectedFocusId, body: text }),
      );
      if (!result.ok) {
        error = result.message || COPY.home.saveFailed;
        return;
      }
      draft = "";
      hintText = "";
      savedPath = result.path;
      refreshTree();
      playSuccessFlash();
      playSavedSound();
      showNudge();
      focusInput();
    } catch (caught) {
      console.error(caught);
      error = COPY.home.saveFailed;
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
    const target = event.target;
    if (!moreOpen || !(target instanceof Node) || tags.contains(target)) {
      return;
    }
    moreOpen = false;
    render();
  });

  actions.append(submit);
  field.append(hintBar, hintBtn, input);
  capture.append(tags, field, actions, status);
  render();
  panel.append(header, capture);
  root.append(panel, nudge);

  function setVaultName(name: string): void {
    const label = name.trim();
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

  function focusInput(): void {
    requestAnimationFrame(() => {
      input.focus({ preventScroll: true });
    });
  }

  subscribe(
    (s) => s.vaultPath,
    (vaultPath) => {
      setVaultName(getFolderNameFromPath(vaultPath));
    },
  );

  subscribe(
    (s) => s.mode,
    (mode, prevMode) => {
      if (mode === "home" && prevMode !== "home") {
        focusInput();
      }
    },
  );
}

function tagDot(): HTMLSpanElement {
  const dot = document.createElement("span");
  dot.className = "home__tag-dot";
  dot.setAttribute("aria-hidden", "true");
  return dot;
}

function tagLabel(text: string): HTMLSpanElement {
  const label = document.createElement("span");
  label.textContent = text;
  return label;
}
