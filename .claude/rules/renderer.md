---
paths:
  - "src/renderer/**/*"
---

# Renderer

The screen is a picture of state. React renders it; CodeMirror owns the note text.

## State

- Shared facts live in `state/store.ts`: `mode`, `vaultPath`, `sidebarOpen`, `selectedFilePath`, `treeEpoch`. The snapshot is replaced on every write, never mutated.
- Read with `useAppState(selector)`. It re-renders only when the selected value changes (`Object.is`), so return a primitive: `s => s.selectedFilePath === path`, not `s => s`. Outside React, read with `getState()`.
- `commands.ts` holds one synchronous outcome per function (`enterHome`, `enterOrganize`, `enterOnboarding`, `toggleSidebar`, `selectFile`, `refreshTree`, `openCapturedNote`). Writing the same `vaultPath` again does not reload the tree; call `refreshTree`.
- Region-private state stays in the region: tree data and expansion (sidebar), note text (editor), capture draft (`home/CaptureForm`), menus, onboarding tip.

## Frame and regions

- `App.tsx` is the only file that knows the layout. Mode handling is an exhaustive `never` switch.
- Each region exports one memoized component with no props from `components/<name>/index.ts`. A re-render of `App` then costs only the wrappers.
- Home, the tree and the editor stay mounted and are hidden with `hidden`, so drafts, expansion and the CodeMirror view survive switching.
- Call `window.smartnote` from the region that owns the action, or from `transactions/vaultSession.ts` for the folder flow. Never from `main.tsx` or `App.tsx`.

## Re-render rules

- Editor: create the `EditorView` once; switch notes with `view.setState`. Never put note text in React state. Autosave (`editor/autosave.ts`) and the header title run outside React.
- Tree: `treeModel.ts` is pure and tested. `mergeTree` keeps unchanged nodes' identity across reloads, and rows are `memo` components that get primitives, a node and stable callbacks.
- Put fast-changing state in the smallest component that shows it (example: `CaptureForm` owns the draft, not `Home`).
- Prefer CSS over state for hover and focus effects (example: the focus chips light up through `group-has-[[data-topic-hint]:hover]`).

## Design system

- Styling is Tailwind utilities built from `styles/tokens.css`. Default Tailwind colors, fonts, sizes, radii and shadows do not exist. Need a new value? Add a token.
- Light and dark come from the same token names; never branch on the theme in TypeScript. Focus tag colors use `focusTagStyle` + the `tag-color` utility.
- Use `ui/` primitives: `Icon` (Lucide, sizes sm/md/lg, 1.75 stroke), `IconButton` (always labelled, tooltip by default), `Button` (the one filled action), `Menu`/`MenuItem`, `Tooltip`.
- Copy lives in `COPY` in `shared/globals.ts`. Sentence case, no all-caps labels.
