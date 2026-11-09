import { Effect, Option, Path, Record as Rec, Stdio, Array as Arr, pipe } from "effect";

import type { CommandEffect } from "./command.ts";
import { COMMANDS } from "./commands.ts";
import { checksFailed } from "./errors.ts";
import { runCli } from "./run-cli.ts";

const USAGE = pipe(
  [
    "Usage: vpa <command> [args]",
    "  actionlint [actionlint arguments...]",
    "  betterleaks <betterleaks arguments...>",
    "  commitlint <message-file> | --range <revision-range>",
    "  dependencies",
    "  steiger <dir...>",
    "  textlint [--print-files] <pathspec...>",
    "  zizmor [zizmor arguments...]",
  ],
  Arr.join("\n"),
);

const vpTools: CommandEffect = Effect.gen(function* main() {
  const stdio = yield* Stdio.Stdio;
  const path = yield* Path.Path;
  const [name = "", ...rest] = yield* stdio.args;
  return yield* pipe(
    Rec.get(COMMANDS, name),
    Option.match({
      onNone: () => Effect.fail(checksFailed(USAGE)),
      onSome: (command) => command(path.resolve("."), rest),
    }),
  );
});

runCli(vpTools);
