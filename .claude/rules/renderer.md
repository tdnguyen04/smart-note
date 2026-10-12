---
paths:
  - "src/renderer/**/*"
---

# Renderer

The screen is a picture of state.

- Shared facts live in `state.ts`: `mode`, `vaultPath`, `sidebarOpen`, `selectedFilePath`, `treeEpoch`. Read with `getState()` or `subscribe`. `subscribe` fires once immediately, then only when `Object.is` says the selected value changed.
- `commands.ts` holds one synchronous outcome per function (`enterHome`, `enterOrganize`, `enterOnboarding`, `toggleSidebar`, `selectFile`, `refreshTree`, `openCapturedNote`). Writing the same `vaultPath` again does not reload the tree; call `refreshTree`.
- `shell.ts` is the only module that looks up shell ids. Mode handling is an exhaustive `never` switch.
- Each widget exports `mount(root)` and nothing else. Its private state stays inside it.
- Call `window.smartnote` from the widget that owns the action, or from `vaultSession.ts` for the open-folder flow. Never route it through `app.ts`.
- CSS stays next to its widget, plus `styles/normalize.css`, `tokens.css`, `global.css`, linked from `index.html`.
- Rail labels, toolbar menu labels, and sidebar strings (Today, Yesterday, Untitled) are still inline. When you touch one, move it into `COPY` in `globals.ts`.
