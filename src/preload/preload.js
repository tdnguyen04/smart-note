const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("smartnote", {
  openVaultDialog: (options) => ipcRenderer.invoke("vault:open-dialog", options),
  getTree: (rootPath) => ipcRenderer.invoke("vault:get-tree", rootPath),
  readFile: (filePath) => ipcRenderer.invoke("vault:read-file", filePath),
  writeFile: (filePath, content) =>
    ipcRenderer.invoke("vault:write-file", filePath, content),
  inspectVault: (rootPath) => ipcRenderer.invoke("vault:inspect", rootPath),
  confirmNonNotes: (payload) =>
    ipcRenderer.invoke("vault:confirm-non-notes", payload),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: (partial) => ipcRenderer.invoke("settings:set", partial),
  onVaultOpened: (callback) => {
    const listener = (_event, vaultPath) => callback(vaultPath);
    ipcRenderer.on("vault:opened", listener);
    return () => ipcRenderer.removeListener("vault:opened", listener);
  },
});
