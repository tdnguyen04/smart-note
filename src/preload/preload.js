const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("smartnote", {
  openVaultDialog: () => ipcRenderer.invoke("vault:open-dialog"),
  getTree: (rootPath) => ipcRenderer.invoke("vault:get-tree", rootPath),
  onVaultOpened: (callback) => {
    const listener = (_event, vaultPath) => callback(vaultPath);
    ipcRenderer.on("vault:opened", listener);
    return () => ipcRenderer.removeListener("vault:opened", listener);
  },
  popupFileMenu: (position) => ipcRenderer.invoke("menu:popup-file", position),
});
