import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import { readdirSync } from "fs";
import tseslint from "typescript-eslint";

/**
 * A channel-shaped string passed to an IPC call. Scoped to calls because Tailwind classes
 * such as "hover:bg-surface-hover" have the same shape.
 */
const channelLiteral = {
  selector:
    "CallExpression[callee.name=/^(invoke|handle|on|send)$/] > Literal[value=/^[a-z]+:[a-z-]+$/], CallExpression[callee.property.name=/^(invoke|handle|handleOnce|on|once|send)$/] > Literal[value=/^[a-z]+:[a-z-]+$/]",
  message: "IPC channels live in src/shared/globals.ts. Use IPC_CHANNELS.",
};

const timingLiteral = {
  selector:
    "CallExpression[callee.name='setTimeout'] > Literal[value>=100], CallExpression[callee.name='setInterval'] > Literal[value>=100], CallExpression[callee.property.name='setTimeout'] > Literal[value>=100], CallExpression[callee.property.name='setInterval'] > Literal[value>=100]",
  message: "Timings live in TIMINGS_MS in src/shared/globals.ts.",
};

const hexColor = {
  selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
  message: "Colors live in src/renderer/styles/tokens.css. Use a token class such as text-ink or bg-surface.",
};

const innerHtml = {
  selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
  message: "Render elements instead. For an icon use <Icon> from ui/icon.",
};

/** Deep modules: import the folder (its index.ts), never a file inside it. */
const modulePatterns = [
  ["**/captureName/*", "Import from src/shared/captureName (index.ts) only."],
  ["**/captureTime/*", "Import from src/shared/captureTime (index.ts) only."],
  ["**/focus/*", "Import from src/shared/focus (index.ts) only."],
  ["**/entryTitle/*", "Import from src/shared/entryTitle (index.ts) only."],
  ["**/paths/*", "Import from src/shared/paths (index.ts) only."],
  ["**/ipc/*", "Import from src/shared/ipc (index.ts) only."],
  ["**/vault/*", "Import from src/main/vault (index.ts) only."],
  ["**/state/*", "Import from src/renderer/state (index.ts) only."],
  ["**/ui/*/*", "Import a ui primitive from its folder, e.g. ui/button (index.ts) only."],
  ["**/components/*/*", "Import a region from its folder, e.g. components/home (index.ts) only."],
].map(([group, message]) => ({ group: [group], message }));

/** Only commands.ts and transactions/* write app state. */
const noStateWrites = {
  group: ["**/state"],
  importNames: ["updateState"],
  message: "Regions read state with useAppState. To change it, call a function in commands.ts or a transaction.",
};

/** main.tsx boots the app and nothing else. */
const bootOnly = {
  group: ["./commands", "./state", "./components/*", "./ui/*"],
  message: "main.tsx is boot-only. Put this in App.tsx, a region, a command or a transaction.",
};

const processBoundary = "src/shared must not depend on a process. Move the code down or pass it in.";

/** Regions never import each other: each components/<name> may only import from itself. */
const regions = readdirSync("src/renderer/components", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const regionIsolation = regions.map((name) => ({
  target: `./src/renderer/components/${name}`,
  from: "./src/renderer/components",
  except: [`./${name}`],
  message: "Regions do not import each other. Share through state, a command, or a ui primitive.",
}));

export default tseslint.config(
  {
    ignores: ["out/**", "dist/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      // Without TypeScript extensions the import rules cannot resolve a path and silently skip it.
      "import/resolver": { node: { extensions: [".ts", ".tsx", ".js", ".mjs"] } },
    },
    rules: {
      "no-restricted-syntax": ["error", channelLiteral, timingLiteral],
      "no-restricted-imports": ["error", { patterns: modulePatterns }],
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            { target: "./src/shared", from: "./src/main", message: processBoundary },
            { target: "./src/shared", from: "./src/preload", message: processBoundary },
            { target: "./src/shared", from: "./src/renderer", message: processBoundary },
            { target: "./src/renderer", from: "./src/main", message: processBoundary },
            ...regionIsolation,
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    files: ["src/renderer/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.flat["recommended-latest"].rules,
      "react-hooks/exhaustive-deps": "error",
      "no-restricted-syntax": ["error", channelLiteral, timingLiteral, hexColor, innerHtml],
    },
  },
  {
    files: ["src/renderer/components/**", "src/renderer/ui/**", "src/renderer/App.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [...modulePatterns, noStateWrites] }],
    },
  },
  {
    files: ["src/renderer/main.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [...modulePatterns, noStateWrites, bootOnly] }],
    },
  },
  {
    files: ["src/shared/globals.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
