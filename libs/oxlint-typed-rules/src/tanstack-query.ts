import tanstackQuery from "@tanstack/eslint-plugin-query";

import { upstreamPlugin } from "./upstream-plugin.ts";
import type { UpstreamPlugin } from "./upstream-plugin.ts";

const plugin: UpstreamPlugin = upstreamPlugin("tanstack-query", tanstackQuery);

export default plugin;
