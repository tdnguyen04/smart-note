import { defineConfig } from "electron-vite";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(root, "src/main/main.ts"),
        },
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(root, "src/preload/bridge/index.ts"),
        },
      },
    },
  },
  renderer: {
    root: resolve(root, "src/renderer"),
    build: {
      rollupOptions: {
        input: {
          index: resolve(root, "src/renderer/index.html"),
        },
      },
    },
  },
});
