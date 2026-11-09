import { Array as Arr, Effect, Option, pipe } from "effect";

import type { Command } from "./command.ts";
import { lintCommitMessageFile, lintCommitMessages } from "./commitlint.ts";
import { loadSection } from "./config.ts";
import { checksFailed } from "./errors.ts";
import { listCommitMessages, listGitFiles } from "./git.ts";
import { finish, writeTo } from "./output.ts";
import { checkSlices } from "./steiger.ts";
import { lintTexts } from "./textlint.ts";

const PRINT_FILES = "--print-files";
const RANGE = "--range";
const RANGE_ARGS = 2;
const FILE_ARGS = 1;
const COMMITLINT_USAGE =
  "Usage: vpa commitlint <commit message file> | vpa commitlint --range <revision range>";

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

const startsWithRange = (args: readonly string[]): boolean =>
  pipe(
    Arr.head(args),
    Option.exists((arg) => arg === RANGE),
  );

const isRangeArgs = (args: readonly string[]): args is readonly [typeof RANGE, string] =>
  args.length === RANGE_ARGS && startsWithRange(args);

const isFileArgs = (args: readonly string[]): args is readonly [string] =>
  args.length === FILE_ARGS && !startsWithRange(args);

const runCommitlint: Command = (root, args) =>
  Effect.gen(function* commitlint() {
    const config = yield* loadSection(root, "commitlint");
    if (isRangeArgs(args)) {
      const [, range] = args;
      const messages = yield* listCommitMessages(root, range);
      return yield* finish(yield* lintCommitMessages(config, root, messages));
    }
    if (isFileArgs(args)) {
      const [messageFile] = args;
      return yield* finish(yield* lintCommitMessageFile(config, root, messageFile));
    }
    return yield* Effect.fail(checksFailed(COMMITLINT_USAGE));
  });

const runSteiger: Command = (root, targets) =>
  Effect.gen(function* steiger() {
    const config = yield* loadSection(root, "steiger");
    return yield* finish(yield* checkSlices(config, root, targets));
  });

export { runCommitlint, runSteiger, runTextlint };
