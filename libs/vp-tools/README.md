# vp-tools

gitleaks・commitlint・textlint・Steiger の設定と依存の規則を `vite.config.ts` に書き、そこから読んで動かす CLI である。
各ツールのために `.gitleaks.toml`・`.gitleaksignore`・`.textlintrc`・`.textlintignore`・`steiger.config.ts`・syncpack の設定・`package.json` の `commitlint` を置かずに済む。
設定は Vite+ の `resolveConfigFromFile` で読み、型は `vite` の `UserConfig` を拡張して付ける。

## 公開先

- npm: [@r_masseater/vp-tools](https://www.npmjs.com/package/@r_masseater/vp-tools)

## 使い方

```sh
vp add -D @r_masseater/vp-tools
```

```ts
import fsd from "@feature-sliced/steiger-plugin";
import type {} from "@r_masseater/vp-tools";
import { defineConfig } from "vite-plus";

export default defineConfig({
  commitlint: { extends: ["@commitlint/config-conventional"] },
  dependencyRules: {
    banned: { "テストは vite-plus/test から読む": ["vitest", "@vitest/*"] },
    peerRanges: "intersect",
  },
  gitleaks: {
    extend: { useDefault: true },
    ignoredFindings: ["<commit>:<file>:<rule>:<line>"],
  },
  steiger: [...fsd.configs.recommended],
  textlint: {
    ignores: ["CHANGELOG.md"],
    rules: { "preset-ja-technical-writing": true },
  },
  run: {
    tasks: {
      gitleaks: "vp-tools gitleaks gitleaks git --redact --no-banner",
      dependencies: "vp-tools dependencies",
      steiger: "vp-tools steiger apps/*/src",
      textlint: "vp-tools textlint '*.md'",
    },
  },
});
```

`import type {} from "@r_masseater/vp-tools"` で、`defineConfig` に上の 5 つのキーの型が付く。

## コマンド

| コマンド                                          | 動き                                                                                                                                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vp-tools gitleaks <コマンド...>`                 | `gitleaks` セクションを TOML にして `GITLEAKS_CONFIG_TOML` に入れ、続くコマンドを動かす。`go run github.com/zricethezav/gitleaks/v8@v8.30.1 git` のように、gitleaks の起動方法はそのまま書く |
| `vp-tools commitlint <メッセージのファイル>`      | `commitlint` セクションでコミットメッセージを検査する。`#` で始まる行は読まない。commit-msg フックで `vp-tools commitlint "$1"` と書く                                                       |
| `vp-tools textlint [--print-files] <pathspec...>` | git が追跡するファイルと未追跡で無視されていないファイルのうち、pathspec に合い `ignores` に合わないものを textlint で検査する。`--print-files` は検査せず、そのファイルを NUL 区切りで出す  |
| `vp-tools steiger <ディレクトリ...>`              | `steiger` セクションで各ディレクトリを検査し、error の指摘があれば失敗する                                                                                                                   |
| `vp-tools dependencies`                           | `pnpm-workspace.yaml` の各パッケージの `package.json` を読み、禁止した依存と、同じ依存の指定の食い違いを報告する                                                                             |

## 設定

- `gitleaks.ignoredFindings` は `.gitleaksignore` と同じ指紋を受け、指紋ごとにコミット・パス・ルールを AND で絞った `[[allowlists]]` に変える。gitleaks の allowlist は行を指定できないので、同じコミットの同じファイルにある同じルールの指摘はまとめて通る。
- `dependencyRules.banned` は、理由ごとに禁止する依存名の glob を並べる。`*` は任意の文字列に合う。
- `dependencyRules.peerRanges` を `"intersect"` にすると、`peerDependencies` の範囲は重なれば通る。省くと、ほかの依存と同じく指定の一致を求める。`workspace:` の指定は比べない。
- `textlint.ignores` は git の glob で、それ以外のキーは `.textlintrc` と同じである。規則のパッケージは、リポのルートの `node_modules` から読む。
