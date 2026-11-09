import { Array as Arr, Effect, FileSystem } from "effect";
import type { PlatformError, Scope } from "effect";

import { toBetterleaksToml, toIgnoreFile } from "./betterleaks.ts";
import { BETTERLEAKS } from "./binaries.ts";
import { runVendored } from "./binary-commands.ts";
import type { Command } from "./command.ts";
import { loadSection } from "./config.ts";
import { checksFailed } from "./errors.ts";
import type { BetterleaksConfig } from "./types.ts";

const BETTERLEAKS_USAGE = "Usage: vpa betterleaks <betterleaks arguments...>";

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

const runBetterleaks: Command = (root, args) =>
  Effect.gen(function* betterleaks() {
    const config = yield* loadSection(root, "betterleaks");
    if (!Arr.isReadonlyArrayNonEmpty(args)) {
      return yield* Effect.fail(checksFailed(BETTERLEAKS_USAGE));
    }
    const ignore = yield* ignoreFileArgs(config);
    return yield* runVendored({
      root,
      binary: BETTERLEAKS,
      args: [...args, ...ignore],
      env: { BETTERLEAKS_CONFIG_TOML: toBetterleaksToml(config) },
    });
  }).pipe(Effect.scoped);

export { runBetterleaks };
