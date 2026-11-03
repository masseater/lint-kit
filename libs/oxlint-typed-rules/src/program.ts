import {
  Array as Arr,
  Cause,
  Effect,
  Exit,
  Layer,
  ManagedRuntime,
  Option,
  String as Str,
  pipe,
} from "effect";
import { FetchHttpClient } from "effect/http";
import { OtlpSerialization, OtlpTracer } from "effect/observability";
import type { Node, SourceFile } from "typescript-7/ast";
import { createFileSystemLayer } from "typescript-7/fs";
import { API } from "typescript-7/sync";
import type {
  Checker,
  Program as NativeProgram,
  Project,
  Snapshot,
  Symbol as NativeSymbol,
  SymbolFlags,
} from "typescript-7/sync";

import { memoizeByKey } from "./memo.ts";

const tracing = OtlpTracer.layerFromConfig({
  resource: { serviceName: "oxlint-typed-rules" },
}).pipe(Layer.provide(OtlpSerialization.layerJson), Layer.provide(FetchHttpClient.layer));

const runtime = ManagedRuntime.make(tracing);

interface Overlay {
  readonly fileName: string;
  readonly text: string;
}

interface CompatSymbol {
  readonly native: NativeSymbol;
  readonly flags: SymbolFlags;
  readonly name: string;
  readonly getName: () => string;
  readonly getFlags: () => SymbolFlags;
  readonly getDeclarations: () => readonly Node[];
}

interface CompatChecker {
  readonly getSymbolAtLocation: (node: Node) => CompatSymbol | undefined;
  readonly getAliasedSymbol: (symbol: CompatSymbol) => CompatSymbol;
}

interface CompatProgram {
  readonly getSourceFile: (fileName: string) => SourceFile | undefined;
  readonly getSourceFiles: () => readonly SourceFile[];
  readonly getTypeChecker: () => CompatChecker;
}

const startApi = (): API => {
  const started = new API();
  process.once("beforeExit", () => {
    started.close();
    Effect.runFork(runtime.disposeEffect);
  });
  return started;
};

const api = startApi();

const snapshots = new Map<API, Snapshot>([[api, api.createSnapshot()]]);

const currentSnapshot = (): Snapshot =>
  Option.fromNullishOr(snapshots.get(api)).pipe(
    Option.getOrElse(() => {
      const created = api.createSnapshot();
      snapshots.set(api, created);
      return created;
    }),
  );

const isOwnSourceFile = (fileName: string): boolean =>
  !Str.includes("/node_modules/")(fileName) && !Str.endsWith(".d.ts")(fileName);

const compatSymbols = new WeakMap<NativeSymbol, CompatSymbol>();

const internCompatSymbol = (project: Project, native: NativeSymbol): CompatSymbol =>
  Option.fromNullishOr(compatSymbols.get(native)).pipe(
    Option.getOrElse(() => {
      const created: CompatSymbol = {
        native,
        flags: native.flags,
        name: native.name,
        getName: () => native.name,
        getFlags: () => native.flags,
        getDeclarations: () =>
          pipe(
            native.declarations,
            Arr.flatMap((handle) =>
              Option.fromNullishOr(handle.resolve(project)).pipe(Option.toArray),
            ),
          ),
      };
      compatSymbols.set(native, created);
      return created;
    }),
  );

const compatChecker = (project: Project, checker: Checker): CompatChecker => ({
  getSymbolAtLocation: (node) =>
    Option.fromNullishOr(checker.getSymbolAtLocation(node)).pipe(
      Option.map((native) => internCompatSymbol(project, native)),
      Option.getOrUndefined,
    ),
  getAliasedSymbol: (symbol) =>
    internCompatSymbol(project, checker.getAliasedSymbol(symbol.native)),
});

const ownSourceFiles = (program: NativeProgram): readonly SourceFile[] =>
  pipe(
    program.getSourceFileNames(),
    Arr.filter(isOwnSourceFile),
    Arr.flatMap((fileName) =>
      Option.fromNullishOr(program.getSourceFile(fileName)).pipe(Option.toArray),
    ),
  );

const cachedOwnSourceFiles = memoizeByKey(ownSourceFiles);

const compatPrograms = new WeakMap<NativeProgram, CompatProgram>();

const internCompatProgram = (project: Project): CompatProgram =>
  Option.fromNullishOr(compatPrograms.get(project.program)).pipe(
    Option.getOrElse(() => {
      const { program } = project;
      const checker = compatChecker(project, project.checker);
      const created: CompatProgram = {
        getSourceFile: program.getSourceFile.bind(program),
        getSourceFiles: () => cachedOwnSourceFiles(program),
        getTypeChecker: () => checker,
      };
      compatPrograms.set(program, created);
      return created;
    }),
  );

const matchesText = (project: Project, overlay: Overlay): boolean =>
  Option.fromNullishOr(project.program.getSourceFile(overlay.fileName)).pipe(
    Option.exists((sourceFile) => sourceFile.text === overlay.text),
  );

const directoryOf = (fileName: string): string => Str.replace(/[\\/][^\\/]*$/u, "")(fileName);

const directoryProjects = memoizeByKey(
  (_snapshot: Snapshot): Map<string, Project> => new Map<string, Project>(),
);

const defaultProject = (snapshot: Snapshot, fileName: string): Option.Option<Project> =>
  Option.fromNullishOr(snapshot.getDefaultProjectForFile(fileName)).pipe(
    Option.map((project) => {
      directoryProjects(snapshot).set(directoryOf(fileName), project);
      return project;
    }),
  );

const currentProject = (overlay: Overlay): Option.Option<Project> => {
  const snapshot = currentSnapshot();
  return Option.fromNullishOr(directoryProjects(snapshot).get(directoryOf(overlay.fileName))).pipe(
    Option.filter((project) => matchesText(project, overlay)),
    Option.orElse(() =>
      defaultProject(snapshot, overlay.fileName).pipe(
        Option.filter((project) => matchesText(project, overlay)),
      ),
    ),
  );
};

const openFile = (overlay: Overlay): Effect.Effect<Option.Option<Project>> =>
  Effect.sync(() => {
    const updated = currentSnapshot().update({
      openFiles: [overlay.fileName],
      fileSystem: createFileSystemLayer([[overlay.fileName, overlay.text]]),
    });
    snapshots.set(api, updated);
    return defaultProject(updated, overlay.fileName);
  }).pipe(
    Effect.withSpan("oxlint-typed-rules.open-file", {
      attributes: { fileName: overlay.fileName },
    }),
  );

const projectOfFile = (overlay: Overlay): Effect.Effect<Option.Option<Project>> =>
  Effect.suspend(() =>
    Option.match(currentProject(overlay), {
      onSome: Effect.succeedSome,
      onNone: () => openFile(overlay),
    }),
  );

const programFor = (overlay: Overlay): Option.Option<CompatProgram> =>
  Exit.match(runtime.runSyncExit(projectOfFile(overlay)), {
    onSuccess: Option.map(internCompatProgram),
    onFailure: (cause) => {
      throw Cause.squash(cause);
    },
  });

export type { CompatChecker, CompatProgram, CompatSymbol, Overlay };
export { programFor };
