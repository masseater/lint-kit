import { Array as Arr, Option, Record, Schema, String as Str, pipe } from "effect";
import type { Plugin } from "vite-plus/lint/plugins";

import { rulesOf } from "./config-rules.ts";
import { optionallyTypedRules } from "./typed-rule.ts";

const Severities: Schema.Literals<readonly ["error", "warn", "off"]> = Schema.Literals([
  "error",
  "warn",
  "off",
]);

type Severity = typeof Severities.Type;

interface Config {
  readonly rules?: Readonly<Record<string, Severity>> | undefined;
}

type UpstreamPlugin = Plugin & {
  readonly meta: { readonly name: string };
  readonly configs: Readonly<Record<string, Config>>;
};

interface Upstream {
  readonly rules: Readonly<Record<string, unknown>>;
  readonly configs: Readonly<Record<string, unknown>>;
}

const ruleIdOf = (key: string): string => Arr.lastNonEmpty(Str.split(key, "/"));

const configOf =
  (name: string) =>
  (config: unknown): Config => ({
    rules: pipe(
      Arr.ensure(config),
      Arr.flatMap((entry) => Option.toArray(rulesOf(entry))),
      Arr.flatMap(Record.toEntries),
      Record.fromEntries,
      Record.filter(Schema.is(Severities)),
      Record.mapKeys((key) => `${name}/${ruleIdOf(key)}`),
    ),
  });

const upstreamPlugin = (name: string, upstream: Upstream): UpstreamPlugin => ({
  meta: { name },
  configs: pipe(upstream.configs, Record.map(configOf(name))),
  rules: optionallyTypedRules(upstream.rules),
});

export type { Config, Severity, Upstream, UpstreamPlugin };
export { upstreamPlugin };
