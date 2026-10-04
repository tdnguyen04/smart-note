import { subscribe } from "../../state.js";
import { promptNewSession } from "../../transactions/vaultSession.js";

const TIP_TEXT =
  "An empty folder works best — keep readings and research together.";

/**
 * Mounts the first-run panel into root. Open Vault calls pickVault.
 */
export function mountOnboarding(root) {
  root.classList.add("onboarding");
  root.innerHTML = `
    <div class="onboarding__panel">
      <h1 class="onboarding__title">Folio</h1>
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
        <span>Open a folder for readings, lectures, and research.</span>
      </p>
      <button type="button" class="onboarding__button">Choose folder</button>
    </div>
  `;

  const button = root.querySelector(".onboarding__button");
  const infoBtn = root.querySelector(".onboarding__info");
  let hintTimer = null;

  button.addEventListener("click", () => {
    void promptNewSession({ intent: "onboarding" });
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
}
