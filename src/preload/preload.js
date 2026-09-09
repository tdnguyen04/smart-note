const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("smartnote", {
  openVaultDialog: () => ipcRenderer.invoke("vault:open-dialog"),
});
