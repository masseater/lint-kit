import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/cli.ts", "src/oxlint.ts"],
    platform: "node",
    sourcemap: true,
    dts: {
      generator: "tsgo",
    },
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
  },
});
