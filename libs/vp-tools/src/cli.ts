import { runMain } from "@effect/platform-node/NodeRuntime";
import { layer as nodeServicesLayer } from "@effect/platform-node/NodeServices";
import {
  Cause,
  Effect,
  Option,
  Path,
  Record as Rec,
  Schema,
  Stdio,
  Array as Arr,
  pipe,
} from "effect";

import type { CommandEffect, CommandServices } from "./command.ts";
import { COMMANDS } from "./commands.ts";
import { VpToolsError, checksFailed } from "./errors.ts";
import { writeTo } from "./output.ts";

const USAGE = pipe(
  [
    "Usage: vp-tools <command> [args]",
    "  betterleaks <betterleaks command...>",
    "  commitlint <message-file> | --range <revision-range>",
    "  dependencies",
    "  steiger <dir...>",
    "  textlint [--print-files] <pathspec...>",
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

const reportFailure = <Failure>(
  cause: Cause.Cause<Failure>,
): Effect.Effect<void, never, Stdio.Stdio> => {
  const message = pipe(
    Cause.findErrorOption(cause),
    Option.filter(Schema.is(VpToolsError)),
    Option.match({
      onNone: () => Cause.pretty(cause),
      onSome: (error) => error.message,
    }),
  );
  return writeTo("stderr", `${message}\n`);
};

const runCli = <Failure>(program: Effect.Effect<void, Failure, CommandServices>): void => {
  runMain(program.pipe(Effect.tapCause(reportFailure), Effect.provide(nodeServicesLayer)), {
    disableErrorReporting: true,
  });
};

runCli(vpTools);
