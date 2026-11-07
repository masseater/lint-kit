import { layer as fixtureLayer } from "@effect/platform-node/NodeServices";
import { layer } from "@effect/vitest";
import { assertTrue, deepStrictEqual, strictEqual } from "@effect/vitest/utils";
import {
  Effect,
  Exit,
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

import type { CommandError, CommandServices } from "./command.ts";
import { COMMANDS } from "./commands.ts";
import { directoryWith, lines } from "./fixture.test.support.ts";

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

const passesTheConfigToBetterleaks = Effect.gen(function* passesTheConfigToBetterleaks() {
  const root = yield* directoryWith(REPOSITORY);
  const script = `printf %s "$BETTERLEAKS_CONFIG_TOML" | grep -q "useDefault = true" && ${IGNORE_FILE_CHECK}`;
  const passed = yield* run("betterleaks", root, ["sh", "-c", script, "sh"]);
  const failed = yield* run("betterleaks", root, ["sh", "-c", "exit 1"]);
  const empty = yield* run("betterleaks", root, []);
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
  const { exit } = yield* run("commitlint", root, [`${root}/COMMIT_EDITMSG`]);
  assertTrue(Exit.isSuccess(exit));
});

const checksSlices = Effect.gen(function* checksSlices() {
  const root = yield* directoryWith({ ...REPOSITORY, "src/shared/index.ts": "export {};\n" });
  const { exit, output } = yield* run("steiger", root, ["src"]);
  assertTrue(Exit.isSuccess(exit));
  strictEqual(Str.trim(output), "");
});

layer(fixtureLayer)("vp-tools commands", (it) => {
  it.effect("prints the text files the textlint section selects", () => printsTextFiles);
  it.effect("lints the text files the textlint section selects", () => lintsTextFiles);
  it.effect("passes workspace manifests that agree", () => passesConsistentDependencies);
  it.effect("fails on a banned dependency in a workspace manifest", () => failsBannedDependencies);
  it.effect(
    "hands the betterleaks section and ignore file to the command and reports its exit code",
    () => passesTheConfigToBetterleaks,
  );
  it.effect("lints the commit message file", () => lintsTheCommitMessageFile);
  it.effect("checks slices with the steiger section", () => checksSlices);
});
