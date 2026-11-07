import { Option, Record as Rec } from "effect";
import { defineConfig } from "vite-plus";

const BANNERS: Readonly<Record<string, string>> = { cli: "#!/usr/bin/env node" };

const local = (path: string): string => new URL(path, import.meta.url).pathname;

const typescriptShim = {
  name: "typescript-shim",
  enforce: "pre",
  resolveId: {
    order: "pre",
    handler: (id: string): string | undefined =>
      Option.liftPredicate(id, (candidate) => candidate === "typescript").pipe(
        Option.map(() => local("src/fsd-typescript.ts")),
        Option.getOrUndefined,
      ),
  },
} as const;

export default defineConfig({
  plugins: [typescriptShim],
  pack: {
    entry: ["src/index.ts", "src/cli.ts", "src/fsd.ts"],
    platform: "node",
    plugins: [typescriptShim],
    deps: {
      alwaysBundle: [/^@feature-sliced\//u],
    },
    copy: [
      {
        from: local("node_modules/@feature-sliced/steiger-plugin/dist/parsers"),
        to: local("dist"),
      },
    ],
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
    alias: [
      { find: /^\.\.\/index\.js$/u, replacement: "@feature-sliced/filesystem" },
      { find: /^vitest$/u, replacement: "vite-plus/test" },
    ],
  },
  test: {
    testTimeout: 120_000,
    coverage: {
      provider: "v8",
      include: ["src/**"],
      reporter: ["text-summary", "json"],
    },
    include: ["src/**/*.test.ts", "upstream/filesystem/specs/*.spec.ts"],
    reporters: ["default", "blob"],
    outputFile: {
      blob: new URL("../../.vitest-reports/vp-tools.json", import.meta.url).pathname,
    },
    server: {
      deps: {
        inline: ["@effect/vitest", /@feature-sliced\//u],
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
