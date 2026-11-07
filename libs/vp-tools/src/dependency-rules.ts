import { Array as Arr, Option, Predicate, Record as Rec, String as Str, pipe } from "effect";
import { minimatch } from "minimatch";
import { intersects, validRange } from "semver";

import type { DependencyRules } from "./types.ts";
import type { Dependency } from "./workspace.ts";

const SINGLE = 1;

const bannedBy =
  (dependencies: readonly Dependency[]) =>
  ([reason, globs]: readonly [string, readonly string[]]): readonly string[] => {
    const isBanned = (name: string): boolean =>
      pipe(
        globs,
        Arr.some((glob) => minimatch(name, glob)),
      );
    return pipe(
      dependencies,
      Arr.filter((dependency) => isBanned(dependency.name)),
      Arr.map(
        (dependency) =>
          `${dependency.manifest} ${dependency.field}.${dependency.name} is banned: ${reason}`,
      ),
    );
  };

const bannedProblems = (
  rules: DependencyRules,
  dependencies: readonly Dependency[],
): readonly string[] =>
  pipe(Rec.toEntries(rules.banned ?? {}), Arr.flatMap(bannedBy(dependencies)));

const groupByName = (dependencies: readonly Dependency[]): readonly (readonly Dependency[])[] =>
  Rec.values(Arr.groupBy(dependencies, ({ name }) => name));

const describe = (dependencies: readonly Dependency[]): string => {
  const name = pipe(
    Arr.head(dependencies),
    Option.match({ onNone: () => "", onSome: (dependency) => dependency.name }),
  );
  const uses = pipe(
    dependencies,
    Arr.map((dependency) => `${dependency.manifest} ${dependency.field} ${dependency.specifier}`),
    Arr.join(", "),
  );
  return `${name}: ${uses}`;
};

const mismatchProblems = (dependencies: readonly Dependency[]): readonly string[] =>
  pipe(
    groupByName(dependencies),
    Arr.filter(
      (group) =>
        new Set(
          pipe(
            group,
            Arr.map(({ specifier }) => specifier),
          ),
        ).size > SINGLE,
    ),
    Arr.map((group) => `different specifiers for ${describe(group)}`),
  );

const isDisjoint = (ranges: readonly Dependency[]): boolean =>
  pipe(
    ranges,
    Arr.some((left) =>
      pipe(
        ranges,
        Arr.some((right) => !intersects(left.specifier, right.specifier)),
      ),
    ),
  );

const disjointRangeProblems = (peers: readonly Dependency[]): readonly string[] =>
  pipe(
    groupByName(peers),
    Arr.map((group) =>
      pipe(
        group,
        Arr.filter(({ specifier }) => validRange(specifier) !== null),
      ),
    ),
    Arr.filter(isDisjoint),
    Arr.map((ranges) => `peer ranges do not intersect for ${describe(ranges)}`),
  );

const isPeer = ({ field }: Dependency): boolean => field === "peerDependencies";

const versionProblems = (
  rules: DependencyRules,
  pinned: readonly Dependency[],
): readonly string[] => {
  if (rules.peerRanges !== "intersect") {
    return mismatchProblems(pinned);
  }
  const others = pipe(pinned, Arr.filter(Predicate.not(isPeer)));
  const peers = pipe(pinned, Arr.filter(isPeer));
  return [...mismatchProblems(others), ...disjointRangeProblems(peers)];
};

const checkDependencies = (
  rules: DependencyRules,
  dependencies: readonly Dependency[],
): readonly string[] => [
  ...bannedProblems(rules, dependencies),
  ...versionProblems(
    rules,
    pipe(
      dependencies,
      Arr.filter(({ specifier }) => !Str.startsWith("workspace:")(specifier)),
    ),
  ),
];

export { checkDependencies };
