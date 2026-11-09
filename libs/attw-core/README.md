# attw-core

[@arethetypeswrong/core][attw] 0.18.5 を、TypeScript 7 だけで動かす置き換えである。
元のパッケージは TypeScript 5.6.1-rc を依存に持つので、tsdown や Vite+ の `pack.attw` を使うと TypeScript 5 が入る。
このパッケージは同じ API を TypeScript 7.1 の上で出すので、パッケージマネージャーの override で差し替えれば TypeScript 5 も 6 も入らない。

[attw]: https://github.com/arethetypeswrong/arethetypeswrong.github.io/tree/main/packages/core

## 公開先

- npm: [@r_masseater/attw-core](https://www.npmjs.com/package/@r_masseater/attw-core)

## 使い方

pnpm では `pnpm-workspace.yaml` の `overrides` で差し替える。

```yaml
overrides:
  "@arethetypeswrong/core": npm:@r_masseater/attw-core@latest
```

tsdown と Vite+ の `pack.attw` は `@arethetypeswrong/core` を import するので、設定はそのままでよい。

## 仕組み

- 元のパッケージの `dist/` を同梱し、その中の `typescript` の import を `src/typescript.ts` に向ける。
- `src/typescript.ts` は、元のパッケージが呼ぶ `ts.*` だけを持つ。
  モジュールの解決、プログラムの組み立て、シンボルの束縛は、TypeScript 5.6.1-rc の処理を TypeScript 7.1 の構文木の上で書き直してある。
- 型の問い合わせは、パッケージのファイルを仮想のファイルシステムとして TypeScript 7.1 の型検査器に見せて答える。
- 元のパッケージの `internal/multiCompilerHost.js` は、`src/compiler-hosts.ts` に差し替える。

## 元のパッケージとの違い

- `typesVersions` は TypeScript 5.6.1-rc として照合し、`ts.version` も `5.6.1-rc` を返す。結果を元のパッケージと揃えるためである。
- `versions.core` はこのパッケージの版を返す。
- 元のパッケージの `dist/` には `patches/@arethetypeswrong__core@0.18.5.patch` を当てる。
  TypeScript 7 の構文木に無い `escapedText` を `text` に読み替え、型定義の `typescript` の import を `typescript/sync` に向ける。

## テスト

- `upstream/core/test` は元のリポのテストを手を入れずに置いたものである。
  テストが読む `fixtures` と `snapshots` は、`upstream/core/` の直下に置く。
- `tests/` は、本物の @arethetypeswrong/core 0.18.5 と TypeScript 5.6.1-rc の結果と突き合わせる。
  入力は `tests/fixtures.json`、期待する結果は `tests/expected.json` にある。
- `tests/expected.json` は、このリポの外の空のディレクトリに `@arethetypeswrong/core@0.18.5` を入れて作る。
  `fixtures.json` の `fixtures` を `checkPackage` に、`hostLookups` を `internal/multiCompilerHost.js` の `CompilerHostWrapper` の `resolveModuleName` に渡す。
  `paths` は TypeScript 5.6.1-rc の `getRootLength`・`normalizePath`・`getNormalizedAbsolutePath`・`getDirectoryPath`・`combinePaths`・`getPathComponents` に、`packageNames` は `mangleScopedPackageName`・`unmangleScopedPackageName`・`getTypesPackageName` に渡す。
  返った値を `JSON.stringify` して書き出す。
  TypeScript 5 をこのリポの依存に入れないため、作る仕組みはリポに置かない。
