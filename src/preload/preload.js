const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("smartnote", {
  openVaultDialog: () => ipcRenderer.invoke("vault:open-dialog"),
  getTree: (rootPath) => ipcRenderer.invoke("vault:get-tree", rootPath),
});
