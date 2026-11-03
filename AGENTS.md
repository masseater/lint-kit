<!-- intent-maintainer:start -->

## Library Skill Maintenance

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before substantial library source, documentation, examples, tests, or skill work, run `vp exec intent meta generate-skill` and follow the packaged maintainer procedure.
Use the current request and repository evidence. For initial skills, propose a useful batch and reuse any scope already agreed with the maintainer.
Before handing off a skill batch or library change, run `vp exec intent maintainer review --json`. Follow the maintainer procedure to update affected guidance, run task checks, and record completed review outcomes. Report an evidence-backed no-op or missing evidence explicitly.
Create and incrementally maintain domain_map.yaml, skill_spec.md, and skill_tree.yaml in the established artifact location for every skill batch. Preserve prior tasks, maintainer decisions, and remaining work.
Keep maintainer decisions and changes in the repository; do not require the user to repeat the procedure in later sessions.
Use intent maintainer setup to initialize missing records, maintainer add to register skills, maintainer status to identify work, and maintainer sync to update generated metadata. Finish with intent maintainer check.
<!-- intent-maintainer:end -->

## 配置

- ワークスペースは apps・libs・tools・infra に分ける。
- 定数・設定値・スキーマ・ルールの ID は一か所で定義し、ほかはそこから参照する。

## 構成

- 手順とコマンドは CONTRIBUTING.md にある。
- プラグインは一致したノードをファイルの `Program:exit` まで溜め、モデルごとにまとめて問い合わせる。oxlint のルールは同期で動くので、問い合わせは synckit で `dist/openrouter-worker.mjs` のワーカーに渡し、ワーカーが並列に送って答えをディスクにキャッシュする。
- presets は質問の一覧を `createDecisionPlugin` に渡すだけで、ワークスペースのプラグインを参照する。判定の振る舞いはプラグイン側で直す。
- `libs/oxlint-plugin-decision/skills/write-decision-rules` は npm に同梱する Intent のスキルである。`vp run skills:check` で検査し、これは verify に含まれない。
- 1 つのテストファイルは、パッケージのディレクトリで `vp test --project=mock tests/<name>.test.ts` として動かす。
- `libs/oxlint-typed-rules` は型情報を要る ESLint のルールに、tsconfig ごとに TypeScript 6 の Program を作って `parserServices` を渡し、oxlint の JS プラグインとして動かす。移植したルールは元のプラグインを `devDependencies` に入れて `dist/` に同梱し、直す点はルートの `patches/` に置く。`@typescript-eslint/utils` は `eslint-utils` だけに差し替えて ESLint を同梱しない。
- TypeScript 6 は `typescript-6` の別名で依存に入れ、同梱したルールの `typescript` の import も `typescript-6` に書き換える。`typescript` の名前で入れると、使う側の pnpm が vite-plus などの peer をこの版に解決し、vitest が別の実体を読んでテストが落ちる。
- `libs/oxlint-typed-rules/upstream/src/__tests__` は元のリポのテストを手を入れずに置いたもので、パッケージの `vite.config.ts` の alias が oxlint の RuleTester と移植したルールへ向ける。ルールを足すときも元のテストをそのまま持ち込み、すべて通るまで出さない。`@tanstack/eslint-plugin-start` の `globals` は元のリポの lockfile と同じ版に固定する。
- vocablint の検査の本体は `libs/vocablint`（`@vocablint/core`）にあり、`tools/vocablint`（`@r_masseater/vocablint`）は CLI と oxlint プラグインだけを持つ。npm にはまだ出していない。`checkRepository` は tsconfig.json ごとにプログラムを作り、全プロジェクトから `@vocablint` の持ち主を集めてから各プロジェクトを解析し、最後に持ち主の無い値の集合の重複を突き合わせる。

## 計測

- 推測せず計測する。実装や修正の前に事実を確かめ、その結果だけで判断する。
- 機能開発の前に、AI が自分でデバッグできる仕組み（再現手段、ログやスパン、それを読む経路）を作る。
- 時間かお金を使う処理はすべてスパンにし、`OtlpTracer.layerFromConfig` で出す。計測のためだけにコマンドやプロセスを包まない。
- 判定と所要時間は `OXLINT_DECISION_EXPLAIN=json`、oxlint のルールごとの時間は `--debug=timings` で読む。
- 判断の根拠にする計測は、実際のモデルに問い合わせる lint で行う。モックのテストは計る仕組みの確認だけに使う。

## 判定

- decision lint は確信できるものだけを違反にする。取りこぼしは許容し、閾値を下げて拾いにいかない。

## 脆弱性

- `audit` は `vp pm audit --fix` で直す。修正版の無い勧告だけを `audit.ignore` に載せ、理由をコミットメッセージに書く。

## マージ

- マージ前に base を取り込み、手元の `vp run verify` を通してから自分でマージする。マージしてよいかは聞かない。ルールセットのバイパスや `--admin` は使わない。
- release-please のリリース PR は `verify` を手動実行して作り直す。`up-to-date` が承認待ちで取り込むものも無ければ、ユーザーに承認を頼む。

## 公開先

- デプロイ先や外部公開しているもの（サイト、API、npm パッケージなど）があれば、その URL を README に一覧で載せる。
