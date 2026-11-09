import { runBetterleaks } from "./betterleaks-command.ts";
import { runActionlint, runZizmor } from "./binary-commands.ts";
import type { Command } from "./command.ts";
import { runDependencies } from "./repository-commands.ts";
import { runCommitlint, runSteiger, runTextlint } from "./text-commands.ts";

const COMMANDS: Readonly<Record<string, Command>> = {
  actionlint: runActionlint,
  betterleaks: runBetterleaks,
  commitlint: runCommitlint,
  dependencies: runDependencies,
  steiger: runSteiger,
  textlint: runTextlint,
  zizmor: runZizmor,
};

export { COMMANDS };
