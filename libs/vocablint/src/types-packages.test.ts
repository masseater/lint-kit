import { layer } from "@effect/vitest";
import { deepStrictEqual } from "@effect/vitest/utils";
import { Effect, Array as Arr, pipe } from "effect";

import { dependencyEntries } from "./dependencies.ts";
import { directoryWith, fixtureLayer } from "./repository.test.support.ts";

const TYPES_MANIFEST = JSON.stringify({ types: "index.d.ts" });

const namesTypesPackagesByThePackageTheyDescribe = Effect.gen(
  function* namesTypesPackagesByThePackageTheyDescribe() {
    const packageDirectory = yield* directoryWith({
      "package.json": JSON.stringify({
        devDependencies: { "@types/node": "26.0.0", "@types/babel__core": "7.0.0" },
      }),
      "node_modules/@types/node/package.json": TYPES_MANIFEST,
      "node_modules/@types/node/index.d.ts": "export {};\n",
      "node_modules/@types/babel__core/package.json": TYPES_MANIFEST,
      "node_modules/@types/babel__core/index.d.ts": "export {};\n",
    });
    deepStrictEqual(
      pipe(
        yield* dependencyEntries(packageDirectory),
        Arr.map((entry) => entry.specifier),
      ),
      ["@babel/core", "node"],
    );
  },
);

layer(fixtureLayer)("dependencyEntries for @types packages", (it) => {
  it.effect(
    "names @types packages by the package they describe",
    () => namesTypesPackagesByThePackageTheyDescribe,
  );
});
