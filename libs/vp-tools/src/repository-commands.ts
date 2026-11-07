import { Array as Arr, Effect, FileSystem } from "effect";
import type { PlatformError, Scope } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

import { toBetterleaksToml, toIgnoreFile } from "./betterleaks.ts";
import type { Command } from "./command.ts";
import { loadSection } from "./config.ts";
import { checkDependencies } from "./dependency-rules.ts";
import { checksFailed } from "./errors.ts";
import { finish } from "./output.ts";
import type { BetterleaksConfig } from "./types.ts";
import { listDependencies } from "./workspace.ts";

const SUCCESS = 0;

const BETTERLEAKS_USAGE = "Usage: vp-tools betterleaks <betterleaks command...>";

const ignoreFileArgs = (
  config: BetterleaksConfig,
): Effect.Effect<
  readonly string[],
  PlatformError.PlatformError,
  FileSystem.FileSystem | Scope.Scope
> =>
  Effect.gen(function* ignoreFile() {
    const digests = toIgnoreFile(config);
    if (digests === "") {
      return [];
    }
    const fs = yield* FileSystem.FileSystem;
    const file = yield* fs.makeTempFileScoped({ prefix: "betterleaksignore-" });
    yield* fs.writeFileString(file, digests);
    return ["--ignore-file", file];
  });

const spawnBetterleaks = (
  root: string,
  config: BetterleaksConfig,
  [program, ...args]: readonly [string, ...string[]],
): Effect.Effect<
  ChildProcessSpawner.ExitCode,
  PlatformError.PlatformError,
  ChildProcessSpawner.ChildProcessSpawner | FileSystem.FileSystem
> =>
  Effect.gen(function* spawn() {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const ignore = yield* ignoreFileArgs(config);
    return yield* spawner.exitCode(
      ChildProcess.make(program, [...args, ...ignore], {
        cwd: root,
        env: { BETTERLEAKS_CONFIG_TOML: toBetterleaksToml(config) },
        extendEnv: true,
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
      }),
    );
  }).pipe(Effect.scoped);

const runBetterleaks: Command = (root, command) =>
  Effect.gen(function* betterleaks() {
    const config = yield* loadSection(root, "betterleaks");
    if (!Arr.isReadonlyArrayNonEmpty(command)) {
      return yield* Effect.fail(checksFailed(BETTERLEAKS_USAGE));
    }
    const exitCode = yield* spawnBetterleaks(root, config, command);
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

export { runBetterleaks, runDependencies };
