import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure modules run in node; component tests opt into jsdom with `// @vitest-environment jsdom`.
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
