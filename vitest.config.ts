import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test-utils/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: [
      "node_modules",
      ".next",
      // TODO: Fix chunker tests hanging issue in this environment
      "**/embeddings/chunker.test.ts",
    ],
    testTimeout: 10000, // 10 second timeout per test
    pool: "forks", // Use fork pool for better isolation
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially in single fork
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__mocks__/",
        "src/test-utils/",
        ".next/",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
