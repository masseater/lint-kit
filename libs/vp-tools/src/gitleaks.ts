import { Option, Array as Arr, pipe } from "effect";
import { stringify } from "smol-toml";

import type { GitleaksAllowlist, GitleaksConfig } from "./types.ts";

const FINGERPRINT = /^(?<commit>[^:]+):(?<file>.+):(?<rule>[^:]+):\d+$/u;

const escapeRegex = (text: string): string =>
  text.replaceAll(/[$()*+.?[\\\]^{|}]/gu, String.raw`\$&`);

const allowlistOfFinding = (fingerprint: string): Option.Option<GitleaksAllowlist> =>
  pipe(
    Option.fromNullishOr(FINGERPRINT.exec(fingerprint)),
    Option.flatMap((match) => Option.fromNullishOr(match.groups)),
    Option.flatMap((groups) =>
      Option.all({
        commit: Option.fromNullishOr(groups["commit"]),
        file: Option.fromNullishOr(groups["file"]),
        rule: Option.fromNullishOr(groups["rule"]),
      }),
    ),
    Option.map(({ commit, file, rule }) => ({
      description: `ignored finding ${fingerprint}`,
      condition: "AND",
      commits: [commit],
      paths: [`^${escapeRegex(file)}$`],
      targetRules: [rule],
    })),
  );

const toGitleaksToml = (config: GitleaksConfig): string => {
  const { ignoredFindings = [], allowlists = [], ...rest } = config;
  return stringify({
    ...rest,
    allowlists: [
      ...allowlists,
      ...pipe(ignoredFindings, Arr.map(allowlistOfFinding), Arr.getSomes),
    ],
  });
};

export { toGitleaksToml };
