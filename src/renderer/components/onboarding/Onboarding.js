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
      <p class="onboarding__copy">Open a local folder to use as your vault.</p>
      <button type="button" class="onboarding__button">Open Vault</button>
    </div>
  `;

  const button = root.querySelector(".onboarding__button");
  button.addEventListener("click", () => {
    onOpenVault();
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
