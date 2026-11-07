import type { UserConfig as CommitlintUserConfig } from "@commitlint/types";
import type { TextlintRcConfig } from "@textlint/config-loader";
import type { defineConfig as defineSteigerConfig } from "steiger";

interface CommitlintConfig extends Readonly<CommitlintUserConfig> {}

type SteigerConfig = readonly ReturnType<typeof defineSteigerConfig>[number][];

interface BetterleaksRule {
  readonly id: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
  readonly regex?: string;
  readonly path?: string;
  readonly valueGroup?: number;
  readonly specificity?: number;
  readonly tags?: readonly string[];
  readonly skipReport?: boolean;
  readonly filter?: string;
  readonly confidence?: "low" | "medium" | "high";
  readonly validate?: string;
  readonly analyze?: string;
  readonly revoke?: string;
}

interface BetterleaksConfig {
  readonly title?: string;
  readonly description?: string;
  readonly minVersion?: string;
  readonly prefilter?: string;
  readonly filter?: string;
  readonly extend?: Readonly<{
    useDefault?: boolean;
    path?: string;
    disabledRules?: readonly string[];
  }>;
  readonly rules?: readonly BetterleaksRule[];
  readonly ignoredSecrets?: readonly string[];
}

interface TextlintConfig extends TextlintRcConfig {
  readonly ignores?: readonly string[];
}

interface DependencyRules {
  readonly banned?: Readonly<Record<string, readonly string[]>>;
  readonly peerRanges?: "identical" | "intersect";
}

interface ToolSections {
  readonly betterleaks?: BetterleaksConfig;
  readonly commitlint?: CommitlintConfig;
  readonly dependencyRules?: DependencyRules;
  readonly steiger?: SteigerConfig;
  readonly textlint?: TextlintConfig;
}

declare module "vite" {
  interface UserConfig extends ToolSections {}
}

type ToolSection = keyof ToolSections;

export type {
  BetterleaksConfig,
  BetterleaksRule,
  CommitlintConfig,
  DependencyRules,
  SteigerConfig,
  TextlintConfig,
  ToolSection,
  ToolSections,
};
