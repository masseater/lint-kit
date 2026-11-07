import { Effect, FileSystem, Path, Array as Arr, Record as Rec, pipe } from "effect";
import type { Scope } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

type FixtureServices =
  | ChildProcessSpawner.ChildProcessSpawner
  | FileSystem.FileSystem
  | Path.Path
  | Scope.Scope;

const writeFiles = (
  root: string,
  files: Readonly<Record<string, string>>,
): Effect.Effect<void, never, FileSystem.FileSystem | Path.Path> =>
  Effect.gen(function* write() {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    yield* pipe(
      Rec.toEntries(files),
      Effect.forEach(([file, source]) => {
        const target = path.join(root, file);
        return fs
          .makeDirectory(path.dirname(target), { recursive: true })
          .pipe(Effect.andThen(fs.writeFileString(target, source)));
      }),
      Effect.orDie,
    );
  });

const directoryWith = (
  files: Readonly<Record<string, string>>,
): Effect.Effect<string, never, FixtureServices> =>
  Effect.gen(function* directory() {
    const fs = yield* FileSystem.FileSystem;
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const root = yield* fs.makeTempDirectoryScoped({ prefix: "vp-tools-" }).pipe(Effect.orDie);
    yield* writeFiles(root, files);
    yield* spawner
      .exitCode(ChildProcess.make("git", ["init", "-q"], { cwd: root }))
      .pipe(Effect.orDie);
    return root;
  });

const lines = (...rows: readonly string[]): string => `${Arr.join(rows, "\n")}\n`;

export { directoryWith, lines };
export type { FixtureServices };
