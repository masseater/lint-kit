import tanstackRouter from "@tanstack/eslint-plugin-router";

import { upstreamPlugin } from "./upstream-plugin.ts";
import type { UpstreamPlugin } from "./upstream-plugin.ts";

const plugin: UpstreamPlugin = upstreamPlugin("tanstack-router", tanstackRouter);

export default plugin;
