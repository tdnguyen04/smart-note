import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import type { Plugin } from "vite";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Content-Security-Policy for the packaged renderer: nothing loads from the network.
 * Styles allow 'unsafe-inline' because Radix positions popovers and CodeMirror themes
 * itself with inline styles. Build-only: the dev server injects an inline refresh script.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
].join("; ");

function contentSecurityPolicy(): Plugin {
  return {
    name: "folio-csp",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: CONTENT_SECURITY_POLICY },
        injectTo: "head-prepend",
      },
    ],
  };
}

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
    plugins: [react(), tailwindcss(), contentSecurityPolicy()],
    build: {
      // electron-vite leaves the renderer unminified by default; minified code parses faster at startup.
      minify: true,
      // One chunk is right for an app read from local disk. The budget that matters is
      // ~300 KB gzip for the renderer JS (React + Radix + CodeMirror); 800 KB raw sits under it.
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        input: {
          index: resolve(root, "src/renderer/index.html"),
        },
        onwarn(warning, warn) {
          // Radix and Lucide mark files "use client" for server frameworks; meaningless here.
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
            return;
          }
          warn(warning);
        },
      },
    },
  },
});
