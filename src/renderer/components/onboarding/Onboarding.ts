import { APP, COPY, TIMINGS_MS } from "../../../shared/globals";
import { subscribe } from "../../state";
import { promptNewSession } from "../../transactions/vaultSession";

export function mountOnboarding(root: HTMLElement): void {
  root.classList.add("onboarding");
  root.innerHTML = `
    <div class="onboarding__panel">
      <h1 class="onboarding__title">${APP.name}</h1>
      <p class="onboarding__copy">
        <button
          type="button"
          class="onboarding__info"
          aria-label="${COPY.onboarding.tipLabel}${COPY.onboarding.tip}"
          aria-describedby="onboarding-tip"
        >
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 7.25V11" stroke-linecap="round" />
            <circle cx="8" cy="5" r="0.75" fill="currentColor" stroke="none" />
          </svg>
          <span class="onboarding__tooltip" id="onboarding-tip" role="tooltip">
            ${COPY.onboarding.tip}
          </span>
        </button>
        <span>${COPY.onboarding.lead}</span>
      </p>
      <button type="button" class="onboarding__button">${COPY.onboarding.chooseFolder}</button>
    </div>
  `;

  const button = root.querySelector(".onboarding__button");
  const infoBtn = root.querySelector(".onboarding__info");
  if (!(button instanceof HTMLButtonElement) || !(infoBtn instanceof HTMLButtonElement)) {
    throw new Error("Onboarding markup is missing controls");
  }
  const tipButton: HTMLButtonElement = infoBtn;

  let hintTimer: number | null = null;

  button.addEventListener("click", () => {
    void promptNewSession({ intent: "onboarding" });
  });

  function clearHint(): void {
    if (hintTimer != null) {
      window.clearTimeout(hintTimer);
      hintTimer = null;
    }
    tipButton.classList.remove("is-hinting");
  }

  function playHint(): void {
    clearHint();
    tipButton.classList.remove("is-attention");
    const width = tipButton.offsetWidth;
    if (width < 0) {
      return;
    }
    tipButton.classList.add("is-attention", "is-hinting");
    hintTimer = window.setTimeout(() => {
      tipButton.classList.remove("is-hinting");
      hintTimer = null;
    }, TIMINGS_MS.onboardingHint);
  }

  tipButton.addEventListener("pointerenter", clearHint);
  tipButton.addEventListener("focus", clearHint);

  subscribe(
    (s) => s.mode,
    (mode) => {
      if (mode === "onboarding") {
        requestAnimationFrame(() => {
          requestAnimationFrame(playHint);
        });
        return;
      }
      clearHint();
      tipButton.classList.remove("is-attention");
    },
  );
}
