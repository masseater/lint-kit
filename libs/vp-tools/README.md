# vp-tools

Betterleaks・commitlint・textlint・Steiger の設定と依存の規則を `vite.config.ts` に書き、そこから読んで動かす CLI である。
TypeScript 7 だけで動く Feature-Sliced Design の Steiger プラグインと @arethetypeswrong/core も同梱する。
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

## @arethetypeswrong/core の置き換え

`@r_masseater/vp-tools/attw` は [@arethetypeswrong/core][attw] 0.18.5 と同じ API を、TypeScript 7.1 だけで出す。
元のパッケージは TypeScript 5.6.1-rc を依存に持つので、Vite+ の `pack.attw` をそのまま使うと TypeScript 5 が入る。
`pack.attw.module` にこれを渡せば、`@arethetypeswrong/core` を入れずに同じ検査が動く。

```ts
import * as attw from "@r_masseater/vp-tools/attw";
import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    attw: { module: attw, profile: "esm-only", level: "error" },
  },
});
```

- 元のパッケージの `dist/` を `upstream/attw-core/lib` に置いて同梱し、その中の `typescript` の import を `src/attw/typescript.ts` に向ける。
- `src/attw/typescript.ts` は、元のパッケージが呼ぶ `ts.*` だけを持つ。
  モジュールの解決、プログラムの組み立て、シンボルの束縛は、TypeScript 5.6.1-rc の処理を TypeScript 7.1 の構文木の上で書き直してある。
- 型の問い合わせは、パッケージのファイルを仮想のファイルシステムとして TypeScript 7.1 の型検査器に見せて答える。
- 元のパッケージの `internal/multiCompilerHost.js` は、`src/attw/compiler-hosts.ts` に差し替える。
- `upstream/attw-core/lib` には `upstream/attw-core/lib.patch` を当ててある。
  TypeScript 7 の構文木に無い `escapedText` を `text` に読み替え、型定義の `typescript` の import を `typescript/sync` に向ける。
- `typesVersions` は TypeScript 5.6.1-rc として照合し、`ts.version` も `5.6.1-rc` を返す。結果を元のパッケージと揃えるためである。

### テスト

- `upstream/attw-core/test` は元のリポのテストを手を入れずに置いたものである。
  テストが読む `fixtures` と `snapshots` は `upstream/attw-core/` の直下に、元のパッケージの `src/` は `upstream/attw-core/src` に置く。
- `tests/attw` は、本物の @arethetypeswrong/core 0.18.5 と TypeScript 5.6.1-rc の結果と突き合わせる。
  入力は `tests/attw/fixtures.json`、期待する結果は `tests/attw/expected.json` にある。
- `tests/attw/expected.json` は、このリポの外の空のディレクトリに `@arethetypeswrong/core@0.18.5` を入れて作る。
  `fixtures.json` の `fixtures` を `checkPackage` に、`hostLookups` を `internal/multiCompilerHost.js` の `CompilerHostWrapper` の `resolveModuleName` に渡す。
  `paths` は TypeScript 5.6.1-rc の `getRootLength`・`normalizePath`・`getNormalizedAbsolutePath`・`getDirectoryPath`・`combinePaths`・`getPathComponents` に、`packageNames` は `mangleScopedPackageName`・`unmangleScopedPackageName`・`getTypesPackageName` に渡す。
  返った値を `JSON.stringify` して書き出す。
  TypeScript 5 をこのリポの依存に入れないため、作る仕組みはリポに置かない。

[attw]: https://github.com/arethetypeswrong/arethetypeswrong.github.io/tree/main/packages/core

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
- `dependencyRules.allowed` は、理由ごとに `banned` の例外を書く。`workspaces` のワークスペースの、`dependencies` の名前の glob に合う依存を禁止しない。`fields` を書くと、その欄（`devDependencies` など）の依存だけを例外にする。
- `dependencyRules.exactDependencies` は、理由ごとにワークスペースのディレクトリの glob を並べる。合うワークスペースの `dependencies` は正確な版でなければならず、ほかのワークスペースとの指定の一致は求めない。git の依存として読まれるパッケージのように、カタログを使えないものに使う。
- `dependencyRules.peerRanges` を `"intersect"` にすると、`peerDependencies` の範囲は重なれば通る。省くと、ほかの依存と同じく指定の一致を求める。`workspace:` の指定は比べない。
- `textlint.ignores` は git の glob で、それ以外のキーは `.textlintrc` と同じである。規則のパッケージは、リポのルートの `node_modules` から読む。

## ライセンス

MIT。`dist/fsd.mjs`・`dist/parsers`・`dist/attw.mjs` に同梱した元のパッケージのライセンスは `THIRD-PARTY-NOTICES` にある。
