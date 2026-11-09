import { Effect, FileSystem, Schema, Array as Arr, pipe } from "effect";

import type { CheckError, CheckServices } from "./check.ts";
import { runCaptured } from "./process.ts";
import type { Report } from "./report.ts";
import { withSection } from "./section-check.ts";
import type { FallowConfig } from "./types.ts";

const QUIET = ["--fail-on-issues", "--quiet", "--format", "compact"];

const RUNS: readonly (readonly string[])[] = [
  ["--skip", "dupes", ...QUIET],
  ["dead-code", "--no-production", ...QUIET],
  ["dupes", ...QUIET],
  ["security", "--fail-on-issues", "--quiet"],
];

const COMPONENT_SMELLS = Schema.Struct({
  prop_drilling_chains: Schema.Array(Schema.Unknown),
  thin_wrappers: Schema.Array(Schema.Unknown),
  duplicate_prop_shapes: Schema.Array(Schema.Unknown),
});

const decodeSmells = Schema.decodeUnknownEffect(Schema.fromJsonString(COMPONENT_SMELLS));

const componentSmells = (
  root: string,
  configFile: string,
): Effect.Effect<Report, CheckError, CheckServices> =>
  runCaptured({
    root,
    file: "fallow",
    args: ["dead-code", "--no-production", "--quiet", "--format", "json", "-c", configFile],
    output: "stdout",
  }).pipe(
    Effect.flatMap((report) => decodeSmells(report.output)),
    Effect.map((smells) => {
      const found = [
        ...smells.prop_drilling_chains,
        ...smells.thin_wrappers,
        ...smells.duplicate_prop_shapes,
      ];
      return {
        valid: Arr.isReadonlyArrayEmpty(found),
        output: JSON.stringify(smells),
      };
    }),
  );

const runFallow = (
  config: FallowConfig,
  root: string,
): Effect.Effect<Report, CheckError, CheckServices> =>
  Effect.gen(function* fallow() {
    const fs = yield* FileSystem.FileSystem;
    const directory = yield* fs.makeTempDirectoryScoped({ prefix: "vpa-fallow-" });
    const configFile = `${directory}/.fallowrc.json`;
    yield* fs.writeFileString(configFile, JSON.stringify(config));
    const reports = yield* pipe(
      RUNS,
      Effect.forEach((args) =>
        runCaptured({ root, file: "fallow", args: [...args, "-c", configFile] }),
      ),
    );
    const smells = yield* componentSmells(root, configFile);
    const all = [...reports, smells];
    return {
      valid: pipe(
        all,
        Arr.every((report) => report.valid),
      ),
      output: pipe(
        all,
        Arr.filter((report) => !report.valid),
        Arr.map((report) => report.output),
        Arr.join("\n"),
      ),
    };
  }).pipe(Effect.scoped);

const fallowCheck = withSection("fallow", (config, { root }) => runFallow(config, root));

export { fallowCheck };
