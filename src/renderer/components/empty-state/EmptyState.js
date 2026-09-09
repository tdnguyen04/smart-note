export function mountEmptyState(root, { onOpenVault }) {
  root.classList.add("empty-state");
  root.innerHTML = `
    <div class="empty-state__panel">
      <h1 class="empty-state__title">SmartNote</h1>
      <p class="empty-state__copy">Open a local folder to use as your vault.</p>
      <button type="button" class="empty-state__button">Open Vault</button>
    </div>
  `;

  const button = root.querySelector(".empty-state__button");
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
