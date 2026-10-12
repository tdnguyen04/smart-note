# Folio

Local Electron vault. npm package `smartnote`, window title `Folio`.
TypeScript, electron-vite. Renderer: React 19, Tailwind CSS v4, Radix primitives (menu, tooltip), Lucide icons, CodeMirror 6.

## The one rule

`npm run check` is the definition of done (`tsc --noEmit && eslint . && vitest run`).
Run it before you say a task is finished. Fix what it reports; never add `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `as any` to get past it.
Error messages in this repo tell you what to do. Follow the message rather than working around it.

## Commands

- `npm start`: dev app (`electron-vite dev`)
- `npm run check`: typecheck, lint, tests
- `npm run build`: production bundles in `out/`. Renderer JS budget: ~300 KB gzip.
- `npm run dist`: build, then electron-builder on `out/`. Never point the builder at `src`.

## Where things live

- `src/shared/globals.ts`: every decided value (copy, timings, focuses, modes, IPC channel names, title and filename rules, window chrome colors). Values and types only, no functions. New decided values go here.
- `src/renderer/styles/tokens.css`: every design value (colors for light and dark, type scale, radii, shadows, frame sizes). Tailwind's defaults are cleared, so only token classes exist.
- Deep modules: a folder whose `index.ts` is the only importable file. `shared/captureName`, `shared/captureTime`, `shared/entryTitle`, `shared/focus`, `shared/ipc`, `shared/paths`, `main/vault`, `preload/bridge`, `renderer/state`, `renderer/ui/*`, `renderer/components/*`.
- Import direction is downward only: globals, then shared, then main / preload / renderer. Shared never imports a process; renderer never imports main.
- `src/main/`: window (`MainWindow.ts`), IPC handlers (`ipc.ts`), disk, dialogs, `settings.ts`.
- `src/renderer/`: `main.tsx` (boot only), `App.tsx` (the frame), `state/`, `commands.ts`, `transactions/`, `ui/`, `components/<region>/`, `styles/`.

## Fixed names (do not rename)

- Bridge methods on `window.smartnote`: `openVaultDialog`, `getTree`, `readFile`, `writeFile`, `inspectVault`, `confirmNonNotes`, `getSettings`, `setSettings`, `onVaultOpened`, `createNote`.
- `main/vault` exports: `openVaultDialog`, `getTree`, `readFile`, `writeFile`, `inspectVault`, `confirmNonNotes`, `createNote`, `isTextLikePath`.
- The vault flow file is `src/renderer/transactions/vaultSession.ts`. There is no `session.js`, `boot`, `pickVault`, or `vaultLabel`.

## Where a change goes

- One region changes: edit that region's folder under `components/`.
- Several regions must agree, nothing waits on disk: add a function to `commands.ts`.
- A multi-step flow: add a new file in `transactions/` named for the outcome.
- A new region of the frame: add `components/<name>/` and teach `App.tsx` where it mounts and when it shows.
- A new look (button style, popover, icon size): add or extend a primitive in `ui/`, built from tokens.

## Rules lint enforces

- Regions do not import each other (`import/no-restricted-paths`).
- Only `commands.ts` and `transactions/*` import `updateState`.
- `main.tsx` stays boot-only.
- Deep modules are imported through their `index.ts`.
- No hex colors and no `dangerouslySetInnerHTML` in the renderer.
- React hooks rules, with `exhaustive-deps` as an error.

## Rules the checker does not enforce yet

- The file tree, editor text, menus, capture draft, and onboarding tip stay out of `state/`.
- A public `index.ts` past five functions gets split, not extended. `main/vault` is at eight and `focus` at five: split before adding.
- Re-render budget: typing in the editor causes zero React renders; typing in the capture box renders only `CaptureForm`; changing the selected note renders only the two affected tree rows. Keep it that way (see `.claude/rules/renderer.md`).

When you notice one of these being broken, propose a lint rule that would catch it.

## Ignore

`docs/renderer-architecture.md` is stale (it describes `.js` files and functions that no longer exist). Do not follow it.
