# Renderer

How the UI is split, and where a change goes. Read this before adding a feature.

The screen is a picture of state. A widget paints its region. It does not read `data-*` attributes or a form control to decide the next action. Shared facts live in one place and change through a named function.

## The pieces

```text
src/renderer/
  app.js                 boot only
  state.js               shared facts
  commands.js            synchronous outcomes
  shell.js               frame: what is visible, and where widgets mount
  transactions/
    session.js             open, replace, or restore the folder
  components/            one folder per region
```

`app.js` listens for the File menu, mounts the shell, and restores the saved vault. Feature work does not go there.

**State** holds the facts more than one region must agree on: `mode` (`onboarding`, `home`, or `organize`), `vaultPath`, `sidebarOpen`, and `selectedFilePath`. Read them with `getState()` or `subscribe`. `updateState` is only for `commands.js` and `transactions/session.js`.

**Commands** are one outcome each. `enterHome` closes the sidebar and clears the file. `enterOrganize` opens the sidebar and clears the file. `enterOnboarding` clears the vault. `toggleSidebar` flips the sidebar. `selectFile` sets the open file. Compose, Organize, and the sidebar toggle do nothing when no vault is open. The toggle also does nothing during onboarding.

**Transactions** are multi-step flows other screens can start, and whose steps those screens must not contain. `transactions/session.js` asks for a folder, inspects it, warns once about non-notes, saves settings, writes `vaultPath`, then calls `enterHome`. `boot` restores the saved folder or shows onboarding. `pickVault` opens the dialog. `vaultLabel` is the folder name for that path. A rejected folder is not saved.

**Shell** is the only module that looks up shell ids. It mounts each widget with a root node and shows or hides the frame from `mode`, `vaultPath`, and `sidebarOpen`. “Nothing here yet” in the sidebar column is shell copy.

**Widgets** own one region: onboarding, rail, titlebar, toolbar, sidebar, home, editor. Each `mount` takes that root and nothing else. A widget may keep a private model and paint from it. The file tree, which folders are expanded, the editor draft, the settings menu, and the onboarding tip stay in those files. They are not in `state.js`, because no other region paints them.

Who may import whom: widgets may import `state.js`, `commands.js`, and `transactions/session.js`. They do not import each other. Commands import only state. The vault transaction imports state and commands. The shell imports widgets and state. `app.js` imports the shell and the vault transaction.

## Where a change goes

Name the feature in one sentence, then open the matching place.

- This region alone changes. Edit that folder under `components/`. Autosave stays in the editor. A future preview stays in the editor.
- Several regions must agree, and nothing waits on disk. Add a function in `commands.js`. Call it from the widget. Do not write a fresh `updateState` patch in the widget.
- Several regions can start a multi-step flow (dialog, confirm, save). Add a file in `transactions/` named for the outcome. Do not grow `session.js` with unrelated steps. Do not put the steps in the widget.
- A widget effect becomes something a second screen must start. Move the flow into `transactions/`. Leave the paint in the widget. The widget calls the public function.
- A new region of the frame. Add `components/<name>/` and teach `shell.js` where it mounts and when it is visible.

If a change seems to need `app.js`, the shell, and the widget, the boundary is wrong. Fix the boundary before growing the feature.

`createNote` is already on the preload bridge. Saving a note from Home, when that is built, is the Home widget: keep the draft in Home, call `createNote` with `getState().vaultPath` and that draft. Add a command only if other regions must react. Writing the same `vaultPath` again will not reload the tree, because `subscribe` uses `Object.is`. Do not add a refresh bus until that feature needs a real signal.

## What not to add

A shared `utils` file. A router, until there is a URL. A component base class or a virtual DOM. Callback arguments on `mount`. A transaction file whose name repeats the word “transaction”. The file tree or the note body in global state.

Call `window.smartnote` from the widget that owns the action, or from the transaction when the action is the open-folder flow. Do not route that call through `app.js`.
