import type { UserConfig as CommitlintUserConfig } from "@commitlint/types";
import type { TextlintRcConfig } from "@textlint/config-loader";
import type { defineConfig as defineSteigerConfig } from "steiger";

interface CommitlintConfig extends Readonly<CommitlintUserConfig> {}

type SteigerConfig = readonly ReturnType<typeof defineSteigerConfig>[number][];

interface GitleaksAllowlist {
  readonly description?: string;
  readonly condition?: "AND" | "OR";
  readonly commits?: readonly string[];
  readonly paths?: readonly string[];
  readonly regexTarget?: "match" | "line" | "secret";
  readonly regexes?: readonly string[];
  readonly stopwords?: readonly string[];
  readonly targetRules?: readonly string[];
}

interface GitleaksConfig {
  readonly extend?: Readonly<{
    useDefault?: boolean;
    path?: string;
    disabledRules?: readonly string[];
  }>;
  readonly allowlists?: readonly GitleaksAllowlist[];
  readonly ignoredFindings?: readonly string[];
}

interface TextlintConfig extends TextlintRcConfig {
  readonly ignores?: readonly string[];
}

interface DependencyRules {
  readonly banned?: Readonly<Record<string, readonly string[]>>;
  readonly peerRanges?: "identical" | "intersect";
}

interface ToolSections {
  readonly commitlint?: CommitlintConfig;
  readonly dependencyRules?: DependencyRules;
  readonly gitleaks?: GitleaksConfig;
  readonly steiger?: SteigerConfig;
  readonly textlint?: TextlintConfig;
}

declare module "vite" {
  interface UserConfig extends ToolSections {}
}

type ToolSection = keyof ToolSections;

export type {
  CommitlintConfig,
  DependencyRules,
  GitleaksAllowlist,
  GitleaksConfig,
  SteigerConfig,
  TextlintConfig,
  ToolSection,
  ToolSections,
};
