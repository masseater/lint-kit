import { Array as Arr, Effect, Option, pipe } from "effect";

import type { Command } from "./command.ts";
import { lintCommitMessageFile } from "./commitlint.ts";
import { loadSection } from "./config.ts";
import { toolFailed } from "./errors.ts";
import type { VpToolsError } from "./errors.ts";
import { listGitFiles } from "./git.ts";
import { finish, writeTo } from "./output.ts";
import { checkSlices } from "./steiger.ts";
import { lintTexts } from "./textlint.ts";

const PRINT_FILES = "--print-files";

const runTextlint: Command = (root, args) =>
  Effect.gen(function* textlint() {
    const config = yield* loadSection(root, "textlint");
    const excluded = pipe(
      config.ignores ?? [],
      Arr.map((glob) => `:(glob,exclude)${glob}`),
    );
    const pathspecs = pipe(
      args,
      Arr.filter((arg) => arg !== PRINT_FILES),
    );
    const files = yield* listGitFiles(root, [...pathspecs, ...excluded]);
    if (Arr.contains(args, PRINT_FILES)) {
      return yield* writeTo(
        "stdout",
        pipe(
          files,
          Arr.map((file) => `${file}\0`),
          Arr.join(""),
        ),
      );
    }
    return yield* finish(yield* lintTexts(config, root, files));
  });

const messageFileOf = (args: readonly string[]): Effect.Effect<string, VpToolsError> =>
  Arr.head(args).pipe(
    Option.match({
      onSome: Effect.succeed,
      onNone: () => Effect.fail(toolFailed("commitlint")("no commit message file was given")),
    }),
  );

const runCommitlint: Command = (root, args) =>
  Effect.gen(function* commitlint() {
    const messageFile = yield* messageFileOf(args);
    const config = yield* loadSection(root, "commitlint");
    return yield* finish(yield* lintCommitMessageFile(config, root, messageFile));
  });

const runSteiger: Command = (root, targets) =>
  Effect.gen(function* steiger() {
    const config = yield* loadSection(root, "steiger");
    return yield* finish(yield* checkSlices(config, root, targets));
  });

export { runCommitlint, runSteiger, runTextlint };
