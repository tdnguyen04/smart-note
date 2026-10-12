# Folio

Local Electron vault. npm package `smartnote`, window title `Folio`.
TypeScript, electron-vite, DOM widgets, plain CSS. No React, no Tailwind, no CSS modules.

## The one rule

`npm run check` is the definition of done (`tsc --noEmit && eslint . && vitest run`).
Run it before you say a task is finished. Fix what it reports; never add `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `as any` to get past it.
Error messages in this repo tell you what to do. Follow the message rather than working around it.

## Commands

- `npm start`: dev app (`electron-vite dev`)
- `npm run check`: typecheck, lint, tests
- `npm run dist`: build, then electron-builder on `out/`. Never point the builder at `src`.

## Where things live

- `src/shared/globals.ts`: every decided value (copy, timings, focuses, modes, IPC channel names, title and filename rules). Values only, no functions. New decided values go here.
- Deep modules: a folder whose `index.ts` is the only importable file. `shared/captureName`, `shared/focus`, `shared/entryTitle`, `shared/ipc`, `main/vault`, `preload/bridge`.
- Import direction is downward only: globals, then shared, then main / preload / renderer. Shared never imports a process; renderer never imports main.
- `src/main/`: window, IPC handlers (`ipc.ts`), disk, dialogs, `settings.ts`.
- `src/renderer/`: `app.ts` (boot only), `state.ts`, `commands.ts`, `transactions/`, `shell.ts`, `components/<widget>/`.

## Fixed names (do not rename)

- Bridge methods on `window.smartnote` and `main/vault` exports: `openVaultDialog`, `getTree`, `readFile`, `writeFile`, `inspectVault`, `confirmNonNotes`, `createNote`, `isTextLikePath`.
- The vault flow file is `src/renderer/transactions/vaultSession.ts`. There is no `session.js`, `boot`, `pickVault`, or `vaultLabel`.

## Where a change goes

- One region changes: edit that widget's folder under `components/`.
- Several regions must agree, nothing waits on disk: add a function to `commands.ts`.
- A multi-step flow: add a new file in `transactions/` named for the outcome.
- A new region of the frame: add `components/<name>/` and teach `shell.ts` where it mounts and when it shows.

## Rules the checker does not enforce yet

- Widgets do not import each other.
- Only `commands.ts` and `transactions/*` call `updateState`.
- `app.ts` stays boot-only.
- The file tree, editor draft, settings menu, and onboarding tip stay out of `state.ts`.
- A public `index.ts` past five functions gets split, not extended. `main/vault` is at eight and `focus` at five: split before adding.

When you notice one of these being broken, propose a lint rule that would catch it.

## Ignore

`docs/renderer-architecture.md` is stale (it describes `.js` files and functions that no longer exist). Do not follow it.
