import { mountEmptyState } from "./components/empty-state/EmptyState.js";

const appEl = document.getElementById("app");
const emptyRoot = document.getElementById("empty-state");
const workspaceEl = document.querySelector(".workspace");
const contentEl = document.getElementById("content");

let vaultPath = null;

const emptyState = mountEmptyState(emptyRoot, {
  onOpenVault: async () => {
    const selectedPath = await window.smartnote.openVaultDialog();
    if (!selectedPath) {
      return;
    }
    vaultPath = selectedPath;
    render();
  },
});

function render() {
  const hasVault = Boolean(vaultPath);

  appEl.classList.toggle("has-vault", hasVault);
  workspaceEl.hidden = !hasVault;

  if (!hasVault) {
    emptyState.show();
    contentEl.replaceChildren();
    return;
  }

  emptyState.hide();
  contentEl.replaceChildren();

  const note = document.createElement("p");
  note.className = "vault-opened";
  note.textContent = `Vault opened: ${vaultPath}`;
  contentEl.append(note);
}

render();
