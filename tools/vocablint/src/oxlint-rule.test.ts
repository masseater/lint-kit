import { layer } from "@effect/vitest";
import type { Problem } from "@vocablint/core";
import { Effect, Layer } from "effect";
import { RuleTester } from "vite-plus/lint/plugins-dev";

import { vocablintPlugin } from "./oxlint-rule.ts";

const CWD = "/repository";
const FLAGGED = "/repository/src/flagged.ts";

const problem: Problem = {
  file: FLAGGED,
  line: 2,
  column: 14,
  rule: "library-value-set",
  message: "The values ascending, descending restate a dependency type.",
};

const runImmediately = (_name: string, body: () => void): void => {
  body();
};

const reportsTheProblemOnItsLine = Effect.sync(() => {
  RuleTester.describe = runImmediately;
  RuleTester.it = runImmediately;
  new RuleTester({ cwd: CWD }).run(
    "vocabulary",
    vocablintPlugin(() => [problem]).rules.vocabulary,
    {
      valid: [{ code: "type Order = string;\n", filename: "/repository/src/clean.ts" }],
      invalid: [
        {
          code: "const a = 1;\ntype Order = 'ascending' | 'descending';\n",
          filename: FLAGGED,
          errors: [
            {
              message:
                "[library-value-set] The values ascending, descending restate a dependency type.",
              line: 2,
              column: 13,
            },
          ],
        },
      ],
    },
  );
});

layer(Layer.empty)("vocablint oxlint plugin", (it) => {
  it.effect("reports the problem on its line", () => reportsTheProblemOnItsLine);
});
