import { layer } from "@effect/vitest";
import { deepStrictEqual } from "@effect/vitest/utils";
import { Effect, Layer } from "effect";

import { checkDependencies } from "./dependency-rules.ts";
import type { Dependency } from "./workspace.ts";

const used = (manifest: string, name: string, specifier: string): Dependency => ({
  manifest,
  field: "dependencies",
  name,
  specifier,
});

const peer = (manifest: string, specifier: string): Dependency => ({
  manifest,
  field: "peerDependencies",
  name: "vite-plus",
  specifier,
});

const reportsBannedDependencies = Effect.sync(() => {
  deepStrictEqual(
    checkDependencies({ banned: { "use vite-plus/test": ["vitest", "@vitest/*"] } }, [
      used("libs/a/package.json", "@vitest/ui", "5.0.0"),
      used("libs/a/package.json", "effect", "4.1.2"),
    ]),
    ["libs/a/package.json dependencies.@vitest/ui is banned: use vite-plus/test"],
  );
});

const reportsMismatchedSpecifiers = Effect.sync(() => {
  deepStrictEqual(
    checkDependencies({}, [
      used("a/package.json", "effect", "4.1.2"),
      used("b/package.json", "effect", "4.1.1"),
      used("c/package.json", "effect", "workspace:*"),
    ]),
    [
      "different specifiers for effect: a/package.json dependencies 4.1.2, b/package.json dependencies 4.1.1",
    ],
  );
});

const acceptsIntersectingPeers = Effect.sync(() => {
  const peers = [peer("a/package.json", ">=1.4.0"), peer("b/package.json", "^1.5.0")];
  deepStrictEqual(checkDependencies({ peerRanges: "intersect" }, peers), []);
  deepStrictEqual(checkDependencies({}, peers), [
    "different specifiers for vite-plus: a/package.json peerDependencies >=1.4.0, b/package.json peerDependencies ^1.5.0",
  ]);
});

const reportsDisjointPeers = Effect.sync(() => {
  deepStrictEqual(
    checkDependencies({ peerRanges: "intersect" }, [
      peer("a/package.json", "^1.0.0"),
      peer("b/package.json", "^2.0.0"),
    ]),
    [
      "peer ranges do not intersect for vite-plus: a/package.json peerDependencies ^1.0.0, b/package.json peerDependencies ^2.0.0",
    ],
  );
});

layer(Layer.empty)("dependency rules", (it) => {
  it.effect(
    "reports a dependency that matches a banned glob with its reason",
    () => reportsBannedDependencies,
  );
  it.effect(
    "reports packages that name one dependency with different specifiers",
    () => reportsMismatchedSpecifiers,
  );
  it.effect(
    "accepts different peer ranges that intersect when peers only need to intersect",
    () => acceptsIntersectingPeers,
  );
  it.effect("reports peer ranges that cannot both be satisfied", () => reportsDisjointPeers);
});
