# SmartNote

A simple local-vault notetaking app built with Electron (HTML, CSS, and JavaScript).

## Features (v1.0.0)

- Open a local folder as a vault
- Nested file tree in the sidebar
- Edit text-like notes (`.md`, `.txt`, and similar) with autosave
- Switch vaults from the toolbar or **File → Open Vault…**
- Custom single-line title bar (Windows)

## Develop

```bash
npm install
npm start
```

DevTools: `Ctrl+Shift+I` (development builds only).

## Build installer (Windows)

```bash
npm run dist
```

Output lands in `dist/`. Optional: put `assets/icon.ico` (and/or `icon.png`) in `assets/` so the installer and shortcuts use your brand mark. The title bar already uses `assets/icon.svg`.

## Project layout

```
src/main/       Electron main process, vault FS, menu
src/preload/    contextBridge API
src/renderer/   UI (components + styles)
assets/         Icons / build resources
```
