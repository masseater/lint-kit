# vp-tools

Betterleaks・commitlint・textlint・Steiger の設定と依存の規則を `vite.config.ts` に書き、そこから読んで動かす CLI である。
各ツールのために `.betterleaks.toml`・`.betterleaksignore`・`.textlintrc`・`.textlintignore`・`steiger.config.ts`・syncpack の設定・`package.json` の `commitlint` を置かずに済む。
設定は Vite+ の `resolveConfigFromFile` で読み、型は `vite` の `UserConfig` を拡張して付ける。

## 公開先

- npm: [@r_masseater/vp-tools](https://www.npmjs.com/package/@r_masseater/vp-tools)

## 使い方

```sh
vp add -D @r_masseater/vp-tools
```

```ts
import type {} from "@r_masseater/vp-tools";
import fsd from "@r_masseater/vp-tools/fsd";
import { defineConfig } from "vite-plus";

export default defineConfig({
  commitlint: { extends: ["@commitlint/config-conventional"] },
  dependencyRules: {
    banned: { "テストは vite-plus/test から読む": ["vitest", "@vitest/*"] },
    peerRanges: "intersect",
  },
  betterleaks: {
    extend: { useDefault: true },
    filter: 'matchesAny(finding.line, [`\\bCF_BEACON_TOKEN = "[0-9a-f]{32}"`])',
    ignoredSecrets: ["<秘密の SHA-256>"],
  },
  steiger: [...fsd.configs.recommended],
  textlint: {
    ignores: ["CHANGELOG.md"],
    rules: { "preset-ja-technical-writing": true },
  },
  run: {
    tasks: {
      betterleaks: "vp-tools betterleaks betterleaks git . --redact --no-banner",
      dependencies: "vp-tools dependencies",
      steiger: "vp-tools steiger apps/*/src",
      textlint: "vp-tools textlint '*.md'",
    },
  },
});
```

`import type {} from "@r_masseater/vp-tools"` で、`defineConfig` に上の 5 つのキーの型が付く。

## Feature-Sliced Design のプラグイン

`@r_masseater/vp-tools/fsd` は [@feature-sliced/steiger-plugin][fsd-plugin] 0.8.2 を同梱したもので、ルールと `configs.recommended` は元と同じである。
元のプラグインが使う [@feature-sliced/filesystem][fsd-filesystem] は、import の解決に TypeScript 5 の `ts.resolveModuleName` を使い、TypeScript 7 だけの環境では読み込めない。
同梱した版では、その解決を TypeScript 7.1 の `typescript/sync` の `createModuleResolver` で行う。
そのため `typescript` 7.1 を依存に持つ。使う側のほかの依存が TypeScript 5 を引き込んでいても、こちらは 7.1 を読む。

steiger 本体も `@feature-sliced/steiger-plugin` に依存し、それが TypeScript 5 を引き込む。
vp-tools は steiger の CLI を使わないので、`pnpm-workspace.yaml` の `overrides` で外せる。

```yaml
overrides:
  "steiger>@feature-sliced/steiger-plugin": "-"
```

[fsd-plugin]: https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd
[fsd-filesystem]: https://github.com/feature-sliced/filesystem

## コマンド

| コマンド                                          | 動き                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vp-tools betterleaks <コマンド...>`              | `betterleaks` セクションを TOML にして `BETTERLEAKS_CONFIG_TOML` に入れ、`ignoredSecrets` があれば一時ファイルに書いて `--ignore-file` を足し、続くコマンドを動かす。`go run github.com/betterleaks/betterleaks/v2@v2.0.0-rc.7 git .` のように、Betterleaks の起動方法はそのまま書く |
| `vp-tools commitlint <メッセージのファイル>`      | `commitlint` セクションでコミットメッセージを検査する。`#` で始まる行は読まない。commit-msg フックで `vp-tools commitlint "$1"` と書く                                                                                                                                               |
| `vp-tools commitlint --range <範囲>`              | `git log --first-parent` で範囲のコミットを並べ、各メッセージを検査する。CI で push された範囲を `vp-tools commitlint --range "$BEFORE..$HEAD"` と検査する                                                                                                                           |
| `vp-tools textlint [--print-files] <pathspec...>` | git が追跡するファイルと未追跡で無視されていないファイルのうち、pathspec に合い `ignores` に合わないものを textlint で検査する。`--print-files` は検査せず、そのファイルを NUL 区切りで出す                                                                                          |
| `vp-tools steiger <ディレクトリ...>`              | `steiger` セクションで各ディレクトリを検査し、error の指摘があれば失敗する                                                                                                                                                                                                           |
| `vp-tools dependencies`                           | `pnpm-workspace.yaml` の各パッケージの `package.json` を読み、禁止した依存と、同じ依存の指定の食い違いを報告する                                                                                                                                                                     |

## 設定

- `betterleaks.ignoredSecrets` は `.betterleaksignore` と同じく秘密の SHA-256 を並べる。それ以外のキーは `.betterleaks.toml` と同じで、通す指摘は `filter` と `prefilter` の式で書く。
- `dependencyRules.banned` は、理由ごとに禁止する依存名の glob を並べる。`*` は任意の文字列に合う。
- `dependencyRules.exactDependencies` は、理由ごとにワークスペースのディレクトリの glob を並べる。合うワークスペースの `dependencies` は正確な版でなければならず、ほかのワークスペースとの指定の一致は求めない。git の依存として読まれるパッケージのように、カタログを使えないものに使う。
- `dependencyRules.peerRanges` を `"intersect"` にすると、`peerDependencies` の範囲は重なれば通る。省くと、ほかの依存と同じく指定の一致を求める。`workspace:` の指定は比べない。
- `textlint.ignores` は git の glob で、それ以外のキーは `.textlintrc` と同じである。規則のパッケージは、リポのルートの `node_modules` から読む。

## ライセンス

MIT。`dist/fsd.mjs` と `dist/parsers` に同梱した元のパッケージのライセンスは `THIRD-PARTY-NOTICES` にある。
