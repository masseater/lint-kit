import { Option, Record as Rec } from "effect";
import { defineConfig } from "vite-plus";

const BANNERS: Readonly<Record<string, string>> = { cli: "#!/usr/bin/env node" };

export default defineConfig({
  pack: {
    entry: ["src/index.ts", "src/cli.ts"],
    platform: "node",
    sourcemap: true,
    dts: { generator: "tsgo" },
    publint: { strict: true },
    attw: { profile: "esm-only", level: "error" },
    outputOptions: {
      banner: (chunk) => Option.getOrElse(Rec.get(BANNERS, chunk.name), () => ""),
    },
  },
  resolve: {
    dedupe: ["vitest"],
  },
  test: {
    testTimeout: 120_000,
    coverage: {
      provider: "v8",
      include: ["src/**"],
      reporter: ["text-summary", "json"],
    },
    reporters: ["default", "blob"],
    outputFile: {
      blob: new URL("../../.vitest-reports/vp-tools.json", import.meta.url).pathname,
    },
    server: {
      deps: {
        inline: ["@effect/vitest"],
      },
    },
  },
  run: {
    tasks: {
      build: { command: "vp pack", cache: false },
      test: "vp test run --coverage",
      size: { command: "size-limit", dependsOn: ["build"], cache: false },
    },
  },
});
