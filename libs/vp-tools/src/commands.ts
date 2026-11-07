import type { Command } from "./command.ts";
import { runDependencies, runGitleaks } from "./repository-commands.ts";
import { runCommitlint, runSteiger, runTextlint } from "./text-commands.ts";

const COMMANDS: Readonly<Record<string, Command>> = {
  commitlint: runCommitlint,
  dependencies: runDependencies,
  gitleaks: runGitleaks,
  steiger: runSteiger,
  textlint: runTextlint,
};

export { COMMANDS };
