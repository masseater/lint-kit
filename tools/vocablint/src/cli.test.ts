import { layer as nodeServicesLayer } from "@effect/platform-node/NodeServices";
import { layer } from "@effect/vitest";
import { deepStrictEqual, strictEqual } from "@effect/vitest/utils";
import {
  Array as Arr,
  Effect,
  FileSystem,
  Path,
  Record as Rec,
  Schema,
  Stream,
  pipe,
} from "effect";
import { ChildProcess } from "effect/process";

import { JSON_FLAG } from "./cli-contract.ts";

const PASSED = 0;
const FAILED = 1;

const FIXTURE_FILES: Readonly<Record<string, string>> = {
  "package.json": JSON.stringify({ name: "fixture" }),
  "tsconfig.json": JSON.stringify({
    compilerOptions: {
      strict: true,
      module: "nodenext",
      moduleResolution: "nodenext",
      target: "esnext",
      noEmit: true,
      skipLibCheck: true,
    },
    include: ["src"],
  }),
};

const DUPLICATED_SETS: Readonly<Record<string, string>> = {
  "src/a.ts": 'export type Mode = "light" | "dark";\n',
  "src/b.ts": 'export const MODES = ["dark", "light"] as const;\n',
};

const CLEAN_SOURCE: Readonly<Record<string, string>> = {
  "src/a.ts": "export const answer = 42;\n",
};

const ReportedProblems = Schema.fromJsonString(
  Schema.Array(Schema.Struct({ rule: Schema.String })),
);

const repositoryWith = Effect.fn("repositoryWith")(function* repositoryWith(
  sources: Readonly<Record<string, string>>,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const root = yield* fs.makeTempDirectoryScoped({ prefix: "vocablint-cli-" });
  yield* Effect.forEach(
    Rec.toEntries({ ...FIXTURE_FILES, ...sources }),
    ([name, source]) => {
      const file = path.join(root, name);
      return fs
        .makeDirectory(path.dirname(file), { recursive: true })
        .pipe(Effect.andThen(fs.writeFileString(file, source)));
    },
    { discard: true },
  );
  return root;
});

const textOf = <Err, Req>(
  stream: Stream.Stream<Uint8Array, Err, Req>,
): Effect.Effect<string, Err, Req> => stream.pipe(Stream.decodeText(), Stream.mkString);

const vocablintIn = Effect.fn("vocablintIn")(function* vocablintIn(
  root: string,
  args: readonly string[],
) {
  const path = yield* Path.Path;
  const cli = path.join(import.meta.dirname, "..", "dist", "cli.mjs");
  const handle = yield* ChildProcess.make(process.execPath, [cli, ...args], { cwd: root });
  const [stdout, stderr, status] = yield* Effect.all(
    [textOf(handle.stdout), textOf(handle.stderr), handle.exitCode],
    { concurrency: "unbounded" },
  );
  return { stdout, stderr, status: Number(status) };
});

const passesARepositoryWithoutProblems = Effect.gen(function* passesARepositoryWithoutProblems() {
  const run = yield* vocablintIn(yield* repositoryWith(CLEAN_SOURCE), []);
  deepStrictEqual(run, { stdout: "", stderr: "", status: PASSED });
});

const failsWithOneLinePerProblem = Effect.gen(function* failsWithOneLinePerProblem() {
  const run = yield* vocablintIn(yield* repositoryWith(DUPLICATED_SETS), []);
  strictEqual(run.status, FAILED);
  strictEqual(run.stderr, "");
  deepStrictEqual(
    pipe(
      run.stdout.trimEnd().split("\n"),
      Arr.map((line) => line.includes("duplicate-value-set")),
    ),
    [true, true],
  );
});

const printsProblemsAsJson = Effect.gen(function* printsProblemsAsJson() {
  const run = yield* vocablintIn(yield* repositoryWith(DUPLICATED_SETS), [JSON_FLAG]);
  strictEqual(run.status, PASSED);
  const problems = yield* Schema.decodeUnknownEffect(ReportedProblems)(run.stdout);
  deepStrictEqual(
    pipe(
      problems,
      Arr.map((problem) => problem.rule),
    ),
    ["duplicate-value-set", "duplicate-value-set"],
  );
});

const CLI_TIMEOUT = 120_000;

layer(nodeServicesLayer)("vocablint CLI", (it) => {
  it.effect(
    "passes a repository without problems",
    () => passesARepositoryWithoutProblems,
    CLI_TIMEOUT,
  );
  it.effect("fails with one line per problem", () => failsWithOneLinePerProblem, CLI_TIMEOUT);
  it.effect("prints the problems as JSON", () => printsProblemsAsJson, CLI_TIMEOUT);
});
