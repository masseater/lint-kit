import { Array as Arr, Option } from "effect";
import { defineConfig } from "vite-plus";

const local = (path: string): string => new URL(path, import.meta.url).pathname;

const UPSTREAM_DIST = new URL("./", import.meta.resolve("attw-core-upstream")).pathname;
const UPSTREAM_TESTS = local("upstream/core/test/");
const VIRTUAL_HOSTS = "\0attw-core-compiler-hosts";
const NODE_TEST_SHIM = "attw-core-node-test";
const VIRTUAL_NODE_TEST = `\0${NODE_TEST_SHIM}`;

const UPSTREAM_ROOTS: readonly string[] = [UPSTREAM_DIST, UPSTREAM_TESTS];

const isUpstream = (importer: string | undefined): boolean =>
  Option.fromNullishOr(importer).pipe(
    Option.exists((path) => UPSTREAM_ROOTS.some((root) => path.startsWith(root))),
  );

const UPSTREAM_REDIRECTS: readonly (readonly [(id: string) => boolean, string])[] = [
  [(id) => id.endsWith("/multiCompilerHost.js"), VIRTUAL_HOSTS],
  [(id) => id === "typescript", local("src/typescript.ts")],
];

const upstreamRedirect = (id: string, importer: string | undefined): Option.Option<string> =>
  Arr.findFirst(UPSTREAM_REDIRECTS, ([matches]) => matches(id)).pipe(
    Option.filter(() => isUpstream(importer)),
    Option.map(([, target]) => target),
  );

const redirect = (id: string, importer: string | undefined): Option.Option<string> =>
  Option.liftPredicate(VIRTUAL_NODE_TEST, () => id === NODE_TEST_SHIM).pipe(
    Option.orElse(() => upstreamRedirect(id, importer)),
  );

const VIRTUAL_MODULES: Readonly<Record<string, string>> = {
  [VIRTUAL_HOSTS]: [
    `import minimalLibDts from ${JSON.stringify(`${UPSTREAM_DIST}internal/minimalLibDts.js`)};`,
    `import { createCompilerHostWrapperWith, createCompilerHostsWith } from ${JSON.stringify(local("src/compiler-hosts.ts"))};`,
    "export const createCompilerHosts = (fs) => createCompilerHostsWith(fs, minimalLibDts);",
    "export function CompilerHostWrapper(fs, moduleResolution) {",
    "  return createCompilerHostWrapperWith(fs, moduleResolution, minimalLibDts);",
    "}",
  ].join("\n"),
  [VIRTUAL_NODE_TEST]:
    'export { afterAll as after, describe, test, test as default } from "vite-plus/test";',
};

const upstreamRedirects = {
  name: "attw-core-upstream-redirects",
  enforce: "pre",
  resolveId: {
    order: "pre",
    handler: (id: string, importer: string | undefined): string | undefined =>
      Option.getOrUndefined(redirect(id, importer)),
  },
  load: (id: string): string | undefined => VIRTUAL_MODULES[id],
} as const;

export default defineConfig({
  tsconfig: "tsconfig.json",
  plugins: [upstreamRedirects],
  pack: {
    entry: ["src/index.ts", "src/problems.ts", "src/types.ts", "src/utils.ts", "src/versions.ts"],
    platform: "node",
    plugins: [upstreamRedirects],
    deps: {
      onlyBundle: ["@arethetypeswrong/core"],
    },
    sourcemap: true,
    dts: { generator: "tsgo" },
    publint: { strict: true },
    attw: { profile: "esm-only", level: "error" },
  },
  resolve: {
    alias: [
      { find: /^attw-core-upstream$/u, replacement: `${UPSTREAM_DIST}index.js` },
      {
        find: /^attw-core-upstream\/(?<subpath>problems|types|utils|versions)$/u,
        replacement: `${UPSTREAM_DIST}$<subpath>.js`,
      },
      { find: /^@arethetypeswrong\/core$/u, replacement: local("src/index.ts") },
      { find: /^@arethetypeswrong\/core\/utils$/u, replacement: local("src/utils.ts") },
      { find: /^#internal\/(?<path>.*)$/u, replacement: `${UPSTREAM_DIST}internal/$<path>` },
      { find: /^node:test$/u, replacement: NODE_TEST_SHIM },
      { find: /^vitest$/u, replacement: "vite-plus/test" },
    ],
  },
  test: {
    testTimeout: 600_000,
    hookTimeout: 600_000,
    include: ["upstream/core/test/**/*.test.ts", "tests/**/*.test.ts"],
    server: {
      deps: {
        inline: [/@arethetypeswrong[+/]core/u],
      },
    },
    coverage: {
      provider: "v8",
      include: ["src/**"],
      reporter: ["text-summary", "json"],
    },
    reporters: ["default", "blob"],
    outputFile: {
      blob: local("../../.vitest-reports/attw-core.json"),
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
