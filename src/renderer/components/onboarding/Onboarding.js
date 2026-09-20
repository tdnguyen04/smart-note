import { subscribe } from "../../store.js";

const TIP_TEXT =
  "An empty folder works best — your notes stay in one place.";

/**
 * [View] First-run onboarding (choose a vault).
 * Owns: open-vault panel DOM.
 * Does not: vault dialog (onOpenVault callback).
 */
export function mountOnboarding(root, { onOpenVault }) {
  root.classList.add("onboarding");
  root.innerHTML = `
    <div class="onboarding__panel">
      <h1 class="onboarding__title">SmartNote</h1>
      <p class="onboarding__copy">
        <button
          type="button"
          class="onboarding__info"
          aria-label="Tip: ${TIP_TEXT}"
          aria-describedby="onboarding-tip"
        >
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 7.25V11" stroke-linecap="round" />
            <circle cx="8" cy="5" r="0.75" fill="currentColor" stroke="none" />
          </svg>
          <span class="onboarding__tooltip" id="onboarding-tip" role="tooltip">
            ${TIP_TEXT}
          </span>
        </button>
        <span>Open a local folder to use as your vault.</span>
      </p>
      <button type="button" class="onboarding__button">Open Vault</button>
    </div>
  `;

  const button = root.querySelector(".onboarding__button");
  const infoBtn = root.querySelector(".onboarding__info");
  let hintTimer = null;

  button.addEventListener("click", () => {
    onOpenVault();
  });

  function clearHint() {
    if (hintTimer != null) {
      window.clearTimeout(hintTimer);
      hintTimer = null;
    }
    infoBtn.classList.remove("is-hinting");
  }

  function playHint() {
    clearHint();
    infoBtn.classList.remove("is-attention");
    // Restart CSS animation.
    void infoBtn.offsetWidth;
    infoBtn.classList.add("is-attention", "is-hinting");
    hintTimer = window.setTimeout(() => {
      infoBtn.classList.remove("is-hinting");
      hintTimer = null;
    }, 3200);
  }

  infoBtn.addEventListener("pointerenter", clearHint);
  infoBtn.addEventListener("focus", clearHint);

  subscribe((s) => s.mode, (mode) => {
    if (mode === "onboarding") {
      // Let the panel paint first, then draw the eye to the tip.
      requestAnimationFrame(() => {
        requestAnimationFrame(playHint);
      });
      return;
    }
    clearHint();
    infoBtn.classList.remove("is-attention");
  });

  return {
    show() {
      root.hidden = false;
    },
    hide() {
      root.hidden = true;
    },
  };
}
