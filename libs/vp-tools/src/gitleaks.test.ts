import { layer } from "@effect/vitest";
import { assertFalse, assertTrue } from "@effect/vitest/utils";
import { Effect, Layer, String as Str } from "effect";

import { toGitleaksToml } from "./gitleaks.ts";

const convertsAFinding = Effect.sync(() => {
  const toml = toGitleaksToml({
    extend: { useDefault: true },
    ignoredFindings: ["0a1b2c:apps/web/src/app.ts:generic-api-key:12"],
  });
  assertTrue(Str.includes("useDefault = true")(toml));
  assertTrue(Str.includes('condition = "AND"')(toml));
  assertTrue(Str.includes('commits = [ "0a1b2c" ]')(toml));
  assertTrue(Str.includes(String.raw`paths = [ "^apps/web/src/app\\.ts$" ]`)(toml));
  assertTrue(Str.includes('targetRules = [ "generic-api-key" ]')(toml));
});

const keepsHandWrittenAllowlistsFirst = Effect.sync(() => {
  const toml = toGitleaksToml({
    allowlists: [{ description: "fixtures", paths: ["^fixtures/"] }],
    ignoredFindings: ["c0ffee:a.ts:rule:1"],
  });
  assertTrue(toml.indexOf("fixtures") < toml.indexOf("c0ffee"));
});

const dropsMalformedFingerprints = Effect.sync(() => {
  assertFalse(
    Str.includes("not-a-fingerprint")(toGitleaksToml({ ignoredFindings: ["not-a-fingerprint"] })),
  );
});

layer(Layer.empty)("gitleaks config", (it) => {
  it.effect(
    "turns an ignored finding into an allowlist bound to its commit, file and rule",
    () => convertsAFinding,
  );
  it.effect(
    "keeps hand-written allowlists before the converted findings",
    () => keepsHandWrittenAllowlistsFirst,
  );
  it.effect(
    "drops a fingerprint that does not have the commit:file:rule:line shape",
    () => dropsMalformedFingerprints,
  );
});
