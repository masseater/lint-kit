import { layer as fixtureLayer } from "@effect/platform-node/NodeServices";
import { layer } from "@effect/vitest";
import { assertTrue, deepStrictEqual, strictEqual } from "@effect/vitest/utils";
import {
  Effect,
  Exit,
  FileSystem,
  Option,
  Predicate,
  Ref,
  Sink,
  Stdio,
  Array as Arr,
  Record as Rec,
  String as Str,
  pipe,
} from "effect";

import { BETTERLEAKS } from "./binaries.ts";
import type { CommandError, CommandServices } from "./command.ts";
import { COMMANDS } from "./commands.ts";
import { commitEmpty, directoryWith, lines } from "./fixture.test.support.ts";
import { VendorDirectory } from "./vendor.ts";

interface Captured {
  readonly exit: Exit.Exit<void, CommandError>;
  readonly output: string;
}

const capturing = (
  command: Effect.Effect<void, CommandError, CommandServices>,
): Effect.Effect<Captured, never, CommandServices> =>
  Effect.gen(function* capture() {
    const written = yield* Ref.make<readonly (string | Uint8Array)[]>([]);
    const stdout = Sink.collect<string | Uint8Array>().pipe(
      Sink.mapEffect((chunks) => Ref.set(written, chunks)),
    );
    const stdio = Stdio.layerTest({ stdout: () => stdout });
    const exit = yield* Effect.exit(command.pipe(Effect.provide(stdio)));
    const chunks = yield* Ref.get(written);
    return { exit, output: pipe(chunks, Arr.filter(Predicate.isString), Arr.join("")) };
  });

const CONFIG = lines(
  "export default {",
  '  commitlint: { rules: { "type-empty": [2, "never"] } },',
  '  dependencyRules: { banned: { "use the stack": ["left-pad"] } },',
  '  betterleaks: { extend: { useDefault: true }, ignoredSecrets: ["0".repeat(64)] },',
  "  steiger: [",
  '    { meta: { name: "none", version: "0.0.0" }, ruleDefinitions: [{ name: "none/ok", check: () => ({ diagnostics: [] }) }] },',
  '    { rules: { "none/ok": "error" } },',
  "  ],",
  '  textlint: { ignores: ["skip/**"], rules: {} },',
  "};",
);

const manifest = (dependencies: Readonly<Record<string, string>>): string =>
  JSON.stringify({ name: "fixture", dependencies });

const REPOSITORY = {
  "vite.config.ts": CONFIG,
  "package.json": manifest({}),
  "pnpm-workspace.yaml": lines("packages:", "  - libs/*", '  - "!libs/ignored"'),
  "libs/a/package.json": manifest({ effect: "4.1.2" }),
  "libs/b/package.json": manifest({ effect: "4.1.2" }),
  "libs/ignored/package.json": manifest({ "left-pad": "1.0.0" }),
  "docs/guide.md": "# Guide\n",
  "skip/notes.md": "# Notes\n",
};

const run = (
  name: string,
  root: string,
  args: readonly string[],
): Effect.Effect<Captured, never, CommandServices> =>
  pipe(
    Rec.get(COMMANDS, name),
    Option.match({
      onNone: () => Effect.die(name),
      onSome: (command) => capturing(command(root, args)),
    }),
  );

const printsTextFiles = Effect.gen(function* printsTextFiles() {
  const root = yield* directoryWith(REPOSITORY);
  const { output } = yield* run("textlint", root, ["--print-files", "*.md"]);
  strictEqual(output, "docs/guide.md\0");
});

const lintsTextFiles = Effect.gen(function* lintsTextFiles() {
  const root = yield* directoryWith(REPOSITORY);
  const { exit } = yield* run("textlint", root, ["*.md"]);
  assertTrue(Exit.isSuccess(exit));
});

const passesConsistentDependencies = Effect.gen(function* passesConsistentDependencies() {
  const root = yield* directoryWith(REPOSITORY);
  const { exit } = yield* run("dependencies", root, []);
  assertTrue(Exit.isSuccess(exit));
});

const failsBannedDependencies = Effect.gen(function* failsBannedDependencies() {
  const root = yield* directoryWith({
    ...REPOSITORY,
    "libs/b/package.json": manifest({ "left-pad": "1.0.0" }),
  });
  const { exit } = yield* run("dependencies", root, []);
  assertTrue(Exit.isFailure(exit));
});

const IGNORE_FILE_CHECK = String.raw`test "$1" = --ignore-file && grep -qx "$(printf '0%.0s' $(seq 64))" "$2"`;

const FAKE_BETTERLEAKS = lines(
  "#!/bin/sh",
  'test "$1" = pass || exit 1',
  "shift",
  `printf %s "$BETTERLEAKS_CONFIG_TOML" | grep -q "useDefault = true" && ${IGNORE_FILE_CHECK}`,
);

const EXECUTABLE_MODE = 0o755;

const VENDORED_BETTERLEAKS = `vendor/betterleaks/${BETTERLEAKS.version}/betterleaks`;

const passesTheConfigToBetterleaks = Effect.gen(function* passesTheConfigToBetterleaks() {
  const root = yield* directoryWith({ ...REPOSITORY, [VENDORED_BETTERLEAKS]: FAKE_BETTERLEAKS });
  const fs = yield* FileSystem.FileSystem;
  yield* fs.chmod(`${root}/${VENDORED_BETTERLEAKS}`, EXECUTABLE_MODE).pipe(Effect.orDie);
  const vendored = (args: readonly string[]): Effect.Effect<Captured, never, CommandServices> =>
    run("betterleaks", root, args).pipe(Effect.provideService(VendorDirectory, `${root}/vendor`));
  const passed = yield* vendored(["pass"]);
  const failed = yield* vendored(["fail"]);
  const empty = yield* vendored([]);
  deepStrictEqual(
    pipe(
      [passed, failed, empty],
      Arr.map(({ exit }) => Exit.isSuccess(exit)),
    ),
    [true, false, false],
  );
});

const lintsTheCommitMessageFile = Effect.gen(function* lintsTheCommitMessageFile() {
  const root = yield* directoryWith({ ...REPOSITORY, COMMIT_EDITMSG: "feat: add\n" });
  const linted = yield* run("commitlint", root, [`${root}/COMMIT_EDITMSG`]);
  const missing = yield* run("commitlint", root, []);
  assertTrue(Exit.isSuccess(linted.exit));
  assertTrue(Exit.isFailure(missing.exit));
});

const lintsACommitRange = Effect.gen(function* lintsACommitRange() {
  const root = yield* directoryWith(REPOSITORY);
  yield* commitEmpty(root, "feat: first");
  yield* commitEmpty(root, "feat: second");
  yield* commitEmpty(root, "no type");
  const passed = yield* run("commitlint", root, ["--range", "HEAD~2..HEAD~1"]);
  const failed = yield* run("commitlint", root, ["--range", "HEAD~1..HEAD"]);
  const extra = yield* run("commitlint", root, ["--range", "HEAD~1..HEAD", "more"]);
  deepStrictEqual(
    pipe(
      [passed, failed, extra],
      Arr.map(({ exit }) => Exit.isSuccess(exit)),
    ),
    [true, false, false],
  );
});

const checksSlices = Effect.gen(function* checksSlices() {
  const root = yield* directoryWith({ ...REPOSITORY, "src/shared/index.ts": "export {};\n" });
  const { exit, output } = yield* run("steiger", root, ["src"]);
  assertTrue(Exit.isSuccess(exit));
  strictEqual(Str.trim(output), "");
});

layer(fixtureLayer)("vpa commands", (it) => {
  it.effect("prints the text files the textlint section selects", () => printsTextFiles);
  it.effect("lints the text files the textlint section selects", () => lintsTextFiles);
  it.effect("passes workspace manifests that agree", () => passesConsistentDependencies);
  it.effect("fails on a banned dependency in a workspace manifest", () => failsBannedDependencies);
  it.effect(
    "runs the vendored betterleaks with the betterleaks section and ignore file and reports its exit code",
    () => passesTheConfigToBetterleaks,
  );
  it.effect("lints the commit message file and needs one", () => lintsTheCommitMessageFile);
  it.effect("lints the first-parent commits of a revision range", () => lintsACommitRange);
  it.effect("checks slices with the steiger section", () => checksSlices);
});
