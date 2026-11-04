import tanstackStart from "@tanstack/eslint-plugin-start";
import type { Plugin } from "vite-plus/lint/plugins";

import { typedRules } from "./typed-rule.ts";

type NamedPlugin = Plugin & { readonly meta: { readonly name: string } };

const plugin: NamedPlugin = {
  meta: { name: "tanstack-start" },
  rules: typedRules(tanstackStart.rules),
};

export default plugin;
