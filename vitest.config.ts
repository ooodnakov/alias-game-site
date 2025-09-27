import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: [path.resolve(__dirname, "tests/setup/setup-tests.ts")],
    env: {
      ALIOSS_TEST_DB: "memory",
    },
    coverage: {
      provider: "v8",
    },
    exclude: ["**/tests/e2e/**"],
    include: ["tests/**/*.test.ts"],
  },
});
