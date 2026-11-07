import type { Command } from "./command.ts";
import { runBetterleaks, runDependencies } from "./repository-commands.ts";
import { runCommitlint, runSteiger, runTextlint } from "./text-commands.ts";

const COMMANDS: Readonly<Record<string, Command>> = {
  betterleaks: runBetterleaks,
  commitlint: runCommitlint,
  dependencies: runDependencies,
  steiger: runSteiger,
  textlint: runTextlint,
};

export { COMMANDS };
