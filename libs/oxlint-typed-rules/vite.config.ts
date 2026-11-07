import { Option } from "effect";
import { defineConfig } from "vite-plus";

const local = (path: string): string => new URL(path, import.meta.url).pathname;

const shims: Readonly<Record<string, string>> = {
  typescript: local("src/ts-compat.ts"),
  "ts-api-utils": local("src/ts-api-utils.ts"),
  "@typescript-eslint/utils": local("src/typescript-eslint-utils.ts"),
  "@typescript-eslint/typescript-estree": local(
    "node_modules/@typescript-eslint/typescript-estree/dist/simple-traverse.js",
  ),
};

const typescriptShims = {
  name: "typescript-shims",
  enforce: "pre",
  resolveId: {
    order: "pre",
    handler: (id: string): string | undefined => shims[id],
  },
} as const;

const UPSTREAM_REACT_SPEC =
  /\/upstream\/react\/plugins\/eslint-plugin-react-(?<plugin>[a-z-]+)\/src\/rules\/(?<rule>[^/]+)\/[^/]+\.spec\.ts$/u;

const VIRTUAL_RULE = "\0upstream-react-rule:";

const ruleParts = ({
  plugin,
  rule,
}: Readonly<Record<string, string | undefined>>): Option.Option<{
  readonly plugin: string;
  readonly rule: string;
}> => Option.all({ plugin: Option.fromNullishOr(plugin), rule: Option.fromNullishOr(rule) });

const upstreamRuleOf = (id: string, importer: string): Option.Option<string> =>
  Option.fromNullishOr(UPSTREAM_REACT_SPEC.exec(importer)).pipe(
    Option.flatMap(({ groups }) => Option.fromNullishOr(groups)),
    Option.flatMap(ruleParts),
    Option.filter(({ rule }) => id === `./${rule}`),
    Option.map(({ plugin, rule }) => `${VIRTUAL_RULE}${plugin}/${rule}`),
  );

const upstreamRuleModule = (id: string): Option.Option<string> =>
  Option.liftPredicate(id, (candidate) => candidate.startsWith(VIRTUAL_RULE)).pipe(
    Option.map((virtual) => virtual.slice(VIRTUAL_RULE.length).split("/")),
    Option.flatMap(([plugin, rule]) => ruleParts({ plugin, rule })),
    Option.map(({ plugin, rule }) =>
      [
        `import plugin from ${JSON.stringify(local("src/react.ts"))};`,
        `export const RULE_NAME = ${JSON.stringify(rule)};`,
        `export default plugin.rules[${JSON.stringify(`${plugin}-${rule}`)}];`,
      ].join("\n"),
    ),
  );

const upstreamReactRules = {
  name: "upstream-react-rules",
  enforce: "pre",
  resolveId: (id: string, importer: string | undefined): string | undefined =>
    Option.fromNullishOr(importer).pipe(
      Option.flatMap((spec) => upstreamRuleOf(id, spec)),
      Option.getOrUndefined,
    ),
  load: (id: string): string | undefined => Option.getOrUndefined(upstreamRuleModule(id)),
} as const;

export default defineConfig({
  plugins: [typescriptShims, upstreamReactRules],
  run: {
    tasks: {
      build: { command: "vp pack", cache: false },
      test: "vp test run --coverage",
      size: { command: "size-limit", dependsOn: ["build"], cache: false },
    },
  },
  pack: {
    entry: ["src/index.ts", "src/tanstack-start.ts", "src/react.ts"],
    platform: "node",
    sourcemap: true,
    plugins: [typescriptShims],
    deps: {
      alwaysBundle: [/^(?!effect(?:\/|$)|typescript\/)/u],
      neverBundle: [/^(?:effect(?:\/|$)|typescript\/)/u],
    },
    dts: { generator: "oxc" },
    publint: { strict: true },
    attw: { profile: "esm-only", level: "error" },
  },
  resolve: {
    alias: [
      { find: "@typescript-eslint/rule-tester", replacement: local("upstream/rule-tester.ts") },
      { find: "@local/testkit", replacement: local("upstream/react-testkit.ts") },
      {
        find: "../rules/no-async-client-component/no-async-client-component.rule",
        replacement: local("upstream/rules/no-async-client-component.ts"),
      },
      {
        find: "../rules/no-client-code-in-server-component/no-client-code-in-server-component.rule",
        replacement: local("upstream/rules/no-client-code-in-server-component.ts"),
      },
      { find: /^vitest$/u, replacement: "vite-plus/test" },
    ],
  },
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**", "dist/**/*.mjs"],
      excludeAfterRemap: true,
      autoAttachSubprocess: true,
      reporter: ["text-summary", "json"],
    },
    reporters: ["default", "blob"],
    outputFile: {
      blob: new URL("../../.vitest-reports/oxlint-typed-rules.json", import.meta.url).pathname,
    },
    server: {
      deps: {
        inline: ["@tanstack/eslint-plugin-start", /@eslint-react\//u, /eslint-plugin-react-/u],
      },
    },
    include: [
      "src/**/*.test.ts",
      "upstream/src/__tests__/*.test.ts",
      "upstream/react/plugins/**/*.spec.ts",
    ],
  },
});
