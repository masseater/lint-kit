import { layer } from "@effect/vitest";
import { deepStrictEqual } from "@effect/vitest/utils";
import { Array as Arr, Effect, Layer, Option, Record, String as Str, pipe } from "effect";

import tanstackQuery from "./tanstack-query.ts";
import tanstackRouter from "./tanstack-router.ts";
import type { Config } from "./upstream-plugin.ts";

type Configs = Readonly<Record<string, Config>>;

const configuredRules = (configs: Configs, name: string): readonly string[] =>
  pipe(
    Record.get(configs, name),
    Option.flatMap(({ rules }) => Option.fromNullishOr(rules)),
    Option.map(Record.keys),
    Option.getOrElse((): readonly string[] => []),
  );

const missingRules = (
  pluginName: string,
  configs: Configs,
  ruleIds: readonly string[],
): readonly string[] =>
  pipe(
    Record.keys(configs),
    Arr.flatMap((name) => configuredRules(configs, name)),
    Arr.filter((key) => !Arr.contains(ruleIds, Str.replace(`${pluginName}/`, "")(key))),
  );

const namesConfiguredRulesAfterThePlugin = Effect.sync(() => {
  deepStrictEqual(
    Arr.contains(
      configuredRules(tanstackQuery.configs, "flat/recommended-strict"),
      "tanstack-query/prefer-query-options",
    ),
    true,
  );
  deepStrictEqual(
    Record.get(tanstackRouter.configs, "flat/recommended"),
    Option.some<Config>({
      rules: {
        "tanstack-router/create-route-property-order": "warn",
        "tanstack-router/route-param-names": "error",
      },
    }),
  );
});

const configuresOnlyExistingRules = Effect.sync(() => {
  deepStrictEqual(
    [
      ...missingRules(
        tanstackQuery.meta.name,
        tanstackQuery.configs,
        Record.keys(tanstackQuery.rules),
      ),
      ...missingRules(
        tanstackRouter.meta.name,
        tanstackRouter.configs,
        Record.keys(tanstackRouter.rules),
      ),
    ],
    [],
  );
});

layer(Layer.empty)("upstream TanStack plugins", (it) => {
  it.effect(
    "names the configured rules after the plugin",
    () => namesConfiguredRulesAfterThePlugin,
  );
  it.effect("configures only rules the plugin has", () => configuresOnlyExistingRules);
});
