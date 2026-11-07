import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: { command: "vp pack", cache: false },
      test: "vp test run --coverage",
    },
  },
  pack: {
    entry: ["src/cli.ts", "src/oxlint.ts"],
    platform: "node",
    sourcemap: true,
    dts: {
      generator: "tsgo",
      tsgo: { path: new URL("node_modules/.bin/tsc", import.meta.url).pathname },
    },
  },
  resolve: {
    dedupe: ["vitest"],
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**", "dist/**/*.mjs"],
      excludeAfterRemap: true,
      autoAttachSubprocess: true,
      reporter: ["text-summary", "json"],
    },
    reporters: ["default", "blob"],
    outputFile: { blob: new URL("../../.vitest-reports/vocablint.json", import.meta.url).pathname },
    server: {
      deps: {
        inline: ["@effect/vitest"],
      },
    },
  },
});
