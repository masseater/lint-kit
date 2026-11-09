import { Array as Arr, Effect } from "effect";

import type { Command } from "./command.ts";
import { loadSection } from "./config.ts";
import { checkDependencies } from "./dependency-rules.ts";
import { finish } from "./output.ts";
import { listDependencies } from "./workspace.ts";

const runDependencies: Command = (root) =>
  Effect.gen(function* dependencies() {
    const rules = yield* loadSection(root, "dependencyRules");
    const problems = checkDependencies(rules, yield* listDependencies(root));
    return yield* finish({
      valid: Arr.isReadonlyArrayEmpty(problems),
      output: Arr.join(problems, "\n"),
    });
  });

export { runDependencies };
