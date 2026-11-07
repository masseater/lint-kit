import { Array as Arr, Effect } from "effect";
import type { PlatformError } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

import type { Command } from "./command.ts";
import { loadSection } from "./config.ts";
import { checkDependencies } from "./dependency-rules.ts";
import { checksFailed } from "./errors.ts";
import { toGitleaksToml } from "./gitleaks.ts";
import { finish } from "./output.ts";
import type { GitleaksConfig } from "./types.ts";
import { listDependencies } from "./workspace.ts";

const SUCCESS = 0;

const GITLEAKS_USAGE = "Usage: vp-tools gitleaks <gitleaks command...>";

const spawnGitleaks = (
  root: string,
  config: GitleaksConfig,
  [program, ...args]: readonly [string, ...string[]],
): Effect.Effect<
  ChildProcessSpawner.ExitCode,
  PlatformError.PlatformError,
  ChildProcessSpawner.ChildProcessSpawner
> =>
  Effect.gen(function* spawn() {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    return yield* spawner.exitCode(
      ChildProcess.make(program, args, {
        cwd: root,
        env: { GITLEAKS_CONFIG_TOML: toGitleaksToml(config) },
        extendEnv: true,
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
      }),
    );
  });

const runGitleaks: Command = (root, command) =>
  Effect.gen(function* gitleaks() {
    const config = yield* loadSection(root, "gitleaks");
    if (!Arr.isReadonlyArrayNonEmpty(command)) {
      return yield* Effect.fail(checksFailed(GITLEAKS_USAGE));
    }
    const exitCode = yield* spawnGitleaks(root, config, command);
    return yield* finish({ valid: exitCode === SUCCESS, output: "" });
  });

const runDependencies: Command = (root) =>
  Effect.gen(function* dependencies() {
    const rules = yield* loadSection(root, "dependencyRules");
    const problems = checkDependencies(rules, yield* listDependencies(root));
    return yield* finish({
      valid: Arr.isReadonlyArrayEmpty(problems),
      output: Arr.join(problems, "\n"),
    });
  });

export { runDependencies, runGitleaks };
