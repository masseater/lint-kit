import { presets as effectPresets } from "@effect/tsgo/oxlint-presets";
import { defineConfig } from "vite-plus";

import aiSlopPlugin from "./libs/oxlint-plugin-decision-presets/dist/ai-slop.mjs";
import strictPlugin from "./libs/oxlint-plugin-decision-presets/dist/strict.mjs";

type Rules = Readonly<Record<string, "error" | readonly ["error", { readonly model: string }]>>;

const decisionModel = "openrouter/respan/span-01-lite";

const deciderModel = "openrouter/typesafe/jev-1.14";

const presetsDist = "./libs/oxlint-plugin-decision-presets/dist";

const deciderRuleIds: ReadonlySet<string> = new Set([
  "catch-hides-failure",
  "default-masks-missing-value",
  "reinvents-builtin",
]);

const allRulesOf = (
  plugin: Readonly<{ meta: { readonly name: string }; rules: object }>,
): Rules => {
  const ids = Object.keys(plugin.rules);
  const ruleOf = (id: string): string => `${plugin.meta.name}/${id}`;
  return {
    ...Object.fromEntries(ids.map((id) => [ruleOf(id), "error"] as const)),
    ...Object.fromEntries(
      ids
        .filter((id) => deciderRuleIds.has(id))
        .map((id) => [ruleOf(id), ["error", { model: deciderModel }]] as const),
    ),
  };
};

const decisionPresetRules: Rules = {
  ...allRulesOf(strictPlugin),
  ...allRulesOf(aiSlopPlugin),
};

const effectRules: Rules = Object.fromEntries(
  Object.values(effectPresets).flatMap((preset) =>
    Object.keys(preset.rules ?? {}).map((name) => [name, "error"] as const),
  ),
);

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: ["CHANGELOG.md", "libs/oxlint-typed-rules/upstream/src/__tests__/**"],
    sortImports: true,
    sortPackageJson: true,
  },
  lint: {
    ignorePatterns: ["libs/*/example/**", "libs/oxlint-typed-rules/upstream/src/__tests__/**"],
    plugins: [
      "eslint",
      "typescript",
      "unicorn",
      "oxc",
      "import",
      "jsdoc",
      "promise",
      "node",
      "vitest",
    ],
    categories: {
      correctness: "error",
      suspicious: "error",
      pedantic: "error",
      perf: "error",
      style: "error",
      restriction: "error",
      nursery: "error",
    },
    jsPlugins: [
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
      { name: "no-comments", specifier: "eslint-plugin-no-comments" },
      { name: strictPlugin.meta.name, specifier: `${presetsDist}/strict.mjs` },
      { name: aiSlopPlugin.meta.name, specifier: `${presetsDist}/ai-slop.mjs` },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "no-comments/disallowComments": ["error", { allow: ["oxlint-disable", "eslint-disable"] }],
      ...effectRules,
      ...decisionPresetRules,
      "eslint/sort-imports": "off",
      "eslint/sort-keys": "off",
      "import/no-named-export": "off",
      "import/prefer-default-export": "off",
      "eslint/no-undef": "off",
      "typescript/promise-function-async": "off",
      "oxc/no-rest-spread-properties": "off",
      "node/no-top-level-await": "off",
      "eslint/one-var": ["error", "never"],
      "typescript/prefer-readonly-parameter-types": [
        "error",
        {
          ignoreInferredTypes: true,
          allow: [
            {
              from: "package",
              package: "@oxlint/plugins",
              name: [
                "Context",
                "Location",
                "Node",
                "Range",
                "Rule",
                "RuleMeta",
                "SourceCode",
                "VisitorWithHooks",
              ],
            },
            {
              from: "package",
              package: "oxlint",
              name: ["InvalidTestCase", "Rule", "TestCases", "ValidTestCase"],
            },
            {
              from: "package",
              package: "typescript",
              name: [
                "Checker",
                "CompilerHost",
                "CompilerOptions",
                "Declaration",
                "Expression",
                "Node",
                "NumericLiteral",
                "ParsedCommandLine",
                "Program",
                "Project",
                "Signature",
                "Snapshot",
                "SourceFile",
                "StringLiteral",
                "Symbol",
                "Type",
                "TypeChecker",
                "TypeNode",
                "UnionTypeNode",
                "VariableDeclaration",
                "VariableDeclarationList",
              ],
            },
            {
              from: "package",
              package: "effect",
              name: ["Cause", "Context", "Effect", "Exit", "Layer", "Option", "Ref", "Stream"],
            },
            { from: "package", package: "@commitlint/types", name: ["QualifiedConfig"] },
            {
              from: "package",
              package: "@textlint/config-loader",
              name: ["TextlintLoadPackagesFromRawConfigResult"],
            },
            {
              from: "file",
              path: "src/types.ts",
              name: ["CommitlintConfig", "TextlintConfig", "ToolSections"],
            },
            {
              from: "package",
              package: "steiger",
              name: ["ConfigObject", "GlobalIgnore", "Plugin"],
            },
          ],
        },
      ],
      "eslint/no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      "eslint/new-cap": [
        "error",
        { capIsNewExceptionPattern: String.raw`^(Config|Context|Data|Schema)\.` },
      ],
      "vitest/require-hook": [
        "error",
        { allowedFunctionCalls: ["runAsWorker", "layer", "runCli"] },
      ],
      "typescript/no-empty-interface": ["error", { allowSingleExtends: true }],
      "typescript/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
    },
    overrides: [
      {
        files: [
          "**/*.config.ts",
          "libs/oxlint-plugin-decision/src/index.ts",
          "libs/oxlint-plugin-decision-presets/src/*.ts",
          "libs/oxlint-typed-rules/src/tanstack-start.ts",
        ],
        rules: { "import/no-default-export": "off" },
      },
      {
        files: ["tools/vocablint/src/oxlint.ts"],
        rules: {
          "import/no-default-export": "off",
          "import/no-nodejs-modules": "off",
          "node/no-sync": "off",
          "effecttsgo/node-builtin-import": "off",
          "effecttsgo/schema-sync": "off",
        },
      },
      {
        files: ["libs/*/tests/**", "**/*.test.ts"],
        rules: Object.fromEntries(Object.keys(decisionPresetRules).map((name) => [name, "off"])),
      },
    ],
    settings: {
      [strictPlugin.meta.name]: { model: decisionModel, timeoutMs: 60_000 },
      [aiSlopPlugin.meta.name]: { model: decisionModel, timeoutMs: 60_000 },
    },
    options: {
      typeAware: true,
      typeCheck: true,
      denyWarnings: true,
      reportUnusedDisableDirectives: "error",
    },
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["{libs,tools}/*/src/**", "{libs,tools}/*/dist/**/*.mjs"],
      excludeAfterRemap: true,
      reporter: ["json"],
    },
  },
  run: {
    cache: true,
    tasks: {
      fallow: [
        "fallow --production --fail-on-issues --quiet --format compact",
        "fallow dead-code --no-production --fail-on-issues --quiet --format compact",
        "fallow dead-code --no-production --quiet --format json | jq -e '[.prop_drilling_chains, .thin_wrappers, .duplicate_prop_shapes] | all(length == 0)' > /dev/null",
        "fallow dupes --fail-on-issues --quiet --format compact",
        "fallow security --fail-on-issues --quiet",
      ],
      "skills:check": [
        "intent validate libs/oxlint-plugin-decision/skills",
        "intent maintainer check",
      ],
      verify: {
        command:
          "vp run -r build && vp check && vp run -r test && vp test --merge-reports=.vitest-reports --coverage && vp run -r size && vp run actions-lint && vp run fallow && vp run audit",
        cache: false,
      },
      audit: {
        command:
          'before="$(cksum pnpm-workspace.yaml)"; vp pm audit --fix || exit; if [ "$before" != "$(cksum pnpm-workspace.yaml)" ]; then echo "vp pm audit --fix rewrote pnpm-workspace.yaml. Run vp install and commit the diff." >&2; exit 1; fi',
        cache: false,
      },
      betterleaks: {
        command:
          'go run github.com/betterleaks/betterleaks/v2@v2.0.0-rc.7 git . --config .betterleaks.toml --redact --no-banner --revision="$(git rev-parse -q --verify "$BETTERLEAKS_BASE" || echo origin/main)..HEAD"',
        cache: false,
      },
      "betterleaks:staged": {
        command:
          "git diff --cached --no-ext-diff --no-textconv --no-color --src-prefix=a/ --dst-prefix=b/ | go run github.com/betterleaks/betterleaks/v2@v2.0.0-rc.7 stdin --git-diff --config .betterleaks.toml --redact --no-banner",
        cache: false,
      },
      "actions-lint": {
        command:
          'uvx --from actionlint-py@1.7.12.25 actionlint && uvx zizmor@1.30.1 $(test -n "$CLAUDE_CODE_REMOTE" && echo --no-online-audits) .github && ast-grep scan --rule .github/rules/no-full-history-checkout.yml .github/workflows',
        cache: {
          env: ["CLAUDE_CODE_REMOTE"],
          untrackedEnv: [
            "GH_TOKEN",
            "HTTPS_PROXY",
            "https_proxy",
            "NO_PROXY",
            "no_proxy",
            "SSL_CERT_FILE",
          ],
        },
      },
    },
  },
});
