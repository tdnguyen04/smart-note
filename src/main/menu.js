const { Menu, BrowserWindow, app } = require("electron");
const { openVaultDialog } = require("./vault");

async function openVaultFromMenu(focusedWindow) {
  const vaultPath = await openVaultDialog();
  if (!vaultPath) {
    return;
  }

  const win = focusedWindow || BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send("vault:opened", vaultPath);
  }
}

function buildFileSubmenu() {
  const fileSubmenu = [
    {
      label: "Open Vault…",
      accelerator: "CmdOrCtrl+O",
      click: async (_menuItem, browserWindow) => {
        await openVaultFromMenu(browserWindow);
      },
    },
    { type: "separator" },
  ];

  if (process.platform === "darwin") {
    fileSubmenu.push({ role: "close" });
  } else {
    fileSubmenu.push({ role: "quit" });
  }

  return fileSubmenu;
}

function createAppMenu() {
  const template = [
    {
      label: "File",
      submenu: buildFileSubmenu(),
    },
  ];

  if (process.platform === "darwin") {
    template.unshift({
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function popupFileMenu(browserWindow, x, y) {
  const menu = Menu.buildFromTemplate(buildFileSubmenu());
  const options = { window: browserWindow };
  if (typeof x === "number" && typeof y === "number") {
    options.x = Math.round(x);
    options.y = Math.round(y);
  }
  menu.popup(options);
}

module.exports = { createAppMenu, popupFileMenu };
