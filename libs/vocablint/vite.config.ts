import { defineConfig } from "vite-plus";

export default defineConfig({
  run: { tasks: { test: "vp test run --coverage" } },
  resolve: {
    dedupe: ["vitest"],
  },
  test: {
    testTimeout: 120_000,
    coverage: {
      provider: "v8",
      include: ["src/**", "dist/**/*.mjs"],
      excludeAfterRemap: true,
      autoAttachSubprocess: true,
      reporter: ["text-summary", "json"],
    },
    reporters: ["default", "blob"],
    outputFile: {
      blob: new URL("../../.vitest-reports/vocablint-core.json", import.meta.url).pathname,
    },
    server: {
      deps: {
        inline: ["@effect/vitest"],
      },
    },
  },
});
