import eslintReact from "@eslint-react/eslint-plugin";
import { Array as Arr, Option, Predicate, Record, String as Str, pipe } from "effect";
import type { CreateRule, Plugin } from "vite-plus/lint/plugins";

import { isTypedRule, withOptionalTypeInformation, withTypeInformation } from "./typed-rule.ts";
import type { TypedRule } from "./typed-rule.ts";

interface Config {
  readonly rules?: Readonly<Record<string, unknown>> | undefined;
}

type ReactPlugin = Plugin & {
  readonly meta: { readonly name: string };
  readonly configs: Readonly<Record<string, Config>>;
};

const PREFIX = "@eslint-react/";

const rulesOf = (config: unknown): Option.Option<Readonly<Record<string, unknown>>> =>
  Option.liftPredicate(config, Predicate.hasProperty("rules")).pipe(
    Option.flatMap(({ rules }) => Option.liftPredicate(rules, Predicate.isReadonlyObject)),
  );

const configs: Readonly<Record<string, Config>> = pipe(
  eslintReact.configs,
  Record.map((config) => ({ rules: Option.getOrUndefined(rulesOf(config)) })),
);

const upstreamRules: Readonly<Record<string, unknown>> = Option.fromNullishOr(
  eslintReact.rules,
).pipe(Option.getOrElse(() => ({})));

const typeCheckedIds = Record.get(configs, "disable-type-checked").pipe(
  Option.map(({ rules }) => Record.keys(Option.getOrElse(Option.fromNullishOr(rules), () => ({})))),
  Option.getOrElse((): readonly string[] => []),
  Arr.map(Str.replace(PREFIX, "")),
);

const typeCheckedRules: ReadonlySet<unknown> = new Set(
  pipe(
    typeCheckedIds,
    Arr.flatMap((id) => Option.toArray(Record.get(upstreamRules, id))),
  ),
);

const withTypes = (rule: TypedRule): CreateRule =>
  Option.liftPredicate(rule, (candidate) => typeCheckedRules.has(candidate)).pipe(
    Option.match({ onSome: withTypeInformation, onNone: () => withOptionalTypeInformation(rule) }),
  );

const plugin: ReactPlugin = {
  meta: { name: "@eslint-react" },
  configs,
  rules: pipe(upstreamRules, Record.filter(isTypedRule), Record.map(withTypes)),
};

export type { Config, ReactPlugin };
export default plugin;
