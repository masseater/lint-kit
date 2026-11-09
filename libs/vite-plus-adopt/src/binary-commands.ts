import { Effect } from "effect";
import type { FileSystem, Path, PlatformError, Stdio } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

import { ACTIONLINT, ZIZMOR } from "./binaries.ts";
import type { Binary } from "./binaries.ts";
import type { Command } from "./command.ts";
import type { VpToolsError } from "./errors.ts";
import { locateBinary } from "./install.ts";
import { finish } from "./output.ts";

const SUCCESS = 0;

const runVendored = ({
  root,
  binary,
  args,
  env = {},
}: {
  readonly root: string;
  readonly binary: Binary;
  readonly args: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
}): Effect.Effect<
  void,
  VpToolsError | PlatformError.PlatformError,
  ChildProcessSpawner.ChildProcessSpawner | FileSystem.FileSystem | Path.Path | Stdio.Stdio
> =>
  Effect.gen(function* run() {
    const file = yield* locateBinary(binary);
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const exitCode = yield* spawner.exitCode(
      ChildProcess.make(file, args, {
        cwd: root,
        env,
        extendEnv: true,
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
      }),
    );
    return yield* finish({ valid: exitCode === SUCCESS, output: "" });
  });

const passThrough =
  (binary: Binary): Command =>
  (root, args) =>
    runVendored({ root, binary, args });

const runActionlint = passThrough(ACTIONLINT);

const runZizmor = passThrough(ZIZMOR);

export { runActionlint, runVendored, runZizmor };
