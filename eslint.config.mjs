import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

const channelLiteral = {
  selector: "Literal[value=/^[a-z]+:[a-z-]+$/]",
  message: "IPC channels live in src/shared/globals.ts. Use IPC_CHANNELS.",
};

const timingLiteral = {
  selector:
    "CallExpression[callee.name='setTimeout'] > Literal[value>=100], CallExpression[callee.name='setInterval'] > Literal[value>=100], CallExpression[callee.property.name='setTimeout'] > Literal[value>=100], CallExpression[callee.property.name='setInterval'] > Literal[value>=100]",
  message: "Timings live in TIMINGS_MS in src/shared/globals.ts.",
};

const modulePatterns = [
  ["**/captureName/*", "Import from src/shared/captureName (index.ts) only."],
  ["**/focus/*", "Import from src/shared/focus (index.ts) only."],
  ["**/entryTitle/*", "Import from src/shared/entryTitle (index.ts) only."],
  ["**/ipc/*", "Import from src/shared/ipc (index.ts) only."],
  ["**/vault/*", "Import from src/main/vault (index.ts) only."],
];

const processBoundary = "src/shared must not depend on a process. Move the code down or pass it in.";

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
    rules: {
      "no-restricted-syntax": ["error", channelLiteral, timingLiteral],
      "no-restricted-imports": [
        "error",
        {
          patterns: modulePatterns.map(([group, message]) => ({
            group: [group],
            message,
          })),
        },
      ],
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            { target: "./src/shared", from: "./src/main", message: processBoundary },
            { target: "./src/shared", from: "./src/preload", message: processBoundary },
            { target: "./src/shared", from: "./src/renderer", message: processBoundary },
            { target: "./src/renderer", from: "./src/main", message: processBoundary },
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
