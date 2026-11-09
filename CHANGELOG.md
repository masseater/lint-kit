# Changelog

## [0.1.6](https://github.com/masseater/lint-kit/compare/v0.1.5...v0.1.6) (2026-11-09)


### Features

* **vp-tools:** attw-core を [@r](https://github.com/r)_masseater/vp-tools/attw に取り込む ([#107](https://github.com/masseater/lint-kit/issues/107)) ([2c1aa38](https://github.com/masseater/lint-kit/commit/2c1aa38d62570a32a35d89a533f11bdd8d0ea8cb))


### Bug Fixes

* **attw-core:** npm に出さない ([#106](https://github.com/masseater/lint-kit/issues/106)) ([3a89ea5](https://github.com/masseater/lint-kit/commit/3a89ea59c43967358d30f32b92146f1c2e86197f))

## [0.1.5](https://github.com/masseater/lint-kit/compare/v0.1.4...v0.1.5) (2026-11-09)


### Features

* **attw-core:** @arethetypeswrong/core を TypeScript 7 だけで動かす置き換えを足す ([#104](https://github.com/masseater/lint-kit/issues/104)) ([42db97d](https://github.com/masseater/lint-kit/commit/42db97df2515412bb9caafadd7573e57f2b24263))

## [0.1.4](https://github.com/masseater/lint-kit/compare/v0.1.3...v0.1.4) (2026-11-09)


### Features

* **oxlint-typed-rules:** @remotion/eslint-plugin を TypeScript 7 だけの環境で動かす ([#103](https://github.com/masseater/lint-kit/issues/103)) ([cd05946](https://github.com/masseater/lint-kit/commit/cd05946231f9489d3b3a31b1e74a46186d8c9a11))
* **vp-tools:** allow banned dependencies in chosen workspaces and fields ([#102](https://github.com/masseater/lint-kit/issues/102)) ([da9bac5](https://github.com/masseater/lint-kit/commit/da9bac5a196c7e5f62023da6b6331a916e26abc2))


### Bug Fixes

* **vp-tools:** depend on TypeScript 7.1 instead of an optional peer ([#100](https://github.com/masseater/lint-kit/issues/100)) ([08d7452](https://github.com/masseater/lint-kit/commit/08d745288c5614edf28c30339d8f537d20ed0b8e))

## [0.1.3](https://github.com/masseater/lint-kit/compare/v0.1.2...v0.1.3) (2026-11-09)


### Features

* **oxlint-typed-rules:** TanStack Query・Router と drizzle のルールを TypeScript 7 だけの環境で動かす ([#97](https://github.com/masseater/lint-kit/issues/97)) ([bf4992e](https://github.com/masseater/lint-kit/commit/bf4992ed054d8d364734b46ea66dc1e0a4966659))
* **vp-tools:** require exact versions in the dependencies of chosen workspaces ([#98](https://github.com/masseater/lint-kit/issues/98)) ([11c9dba](https://github.com/masseater/lint-kit/commit/11c9dbaa57fd2ddc8118f7be7adf6872e7c56f10))

## [0.1.2](https://github.com/masseater/lint-kit/compare/v0.1.1...v0.1.2) (2026-11-07)


### Features

* **oxlint-typed-rules:** [@eslint-react](https://github.com/eslint-react) を TypeScript 7 で動かす react エントリーを足す ([#92](https://github.com/masseater/lint-kit/issues/92)) ([292e751](https://github.com/masseater/lint-kit/commit/292e75179ceec4b3bf18e7eaef50e4ad7c858f78))
* vocablint と Steiger の FSD プラグインを TypeScript 7 だけで動かす ([#95](https://github.com/masseater/lint-kit/issues/95)) ([663344b](https://github.com/masseater/lint-kit/commit/663344bdc361e4a7d4e5e24855e84ad3a2794e65))
* **vp-tools:** gitleaks コマンドを betterleaks に置き換える ([#90](https://github.com/masseater/lint-kit/issues/90)) ([b7783ed](https://github.com/masseater/lint-kit/commit/b7783ede74b0e2332c7d65031488abf45da37423))
* **vp-tools:** lint the first-parent commits of a revision range ([#94](https://github.com/masseater/lint-kit/issues/94)) ([45b3621](https://github.com/masseater/lint-kit/commit/45b3621fa5cc7db10c165824d60cef7b4c77d898))
* **vp-tools:** vite.config.ts の設定で各種検査を動かす CLI を足す ([#89](https://github.com/masseater/lint-kit/issues/89)) ([1dc2f7c](https://github.com/masseater/lint-kit/commit/1dc2f7cb448c5ea64589a37377b0e367ea7bb6a3))


### Bug Fixes

* gitleaks タスクを足し、template の action を上げる ([#87](https://github.com/masseater/lint-kit/issues/87)) ([74b760a](https://github.com/masseater/lint-kit/commit/74b760a3175c874c81128d1651f55a84613fb2e0))
* template の credentials action を直した版に上げる ([#86](https://github.com/masseater/lint-kit/issues/86)) ([c48cf36](https://github.com/masseater/lint-kit/commit/c48cf363eeac66138610bd006bb36487e2d2cab9))
* **vp-tools:** メッセージのファイルが無い commitlint を使い方の誤りで落とす ([#91](https://github.com/masseater/lint-kit/issues/91)) ([3b79ea2](https://github.com/masseater/lint-kit/commit/3b79ea236ac76fb4543c646320b5d423a9dc4e90))

## [0.1.1](https://github.com/masseater/lint-kit/compare/v0.1.0...v0.1.1) (2026-11-04)


### Bug Fixes

* **deps:** effect 4.1.2 で出し直し、renovate を設定する ([#78](https://github.com/masseater/lint-kit/issues/78)) ([384727e](https://github.com/masseater/lint-kit/commit/384727e7179e72403ee49cf361f7672139e78a12))
* **typed-rules:** tanstack-start の plugin に meta.name の型を残す ([#80](https://github.com/masseater/lint-kit/issues/80)) ([74d4db0](https://github.com/masseater/lint-kit/commit/74d4db088b7e5f74d999a7e1448a880dec53e1a6))

## [0.1.0](https://github.com/masseater/lint-kit/compare/v0.0.4...v0.1.0) (2026-11-04)


### ⚠ BREAKING CHANGES

* a rule or location cutoff below 0.8 is a configuration error.
* **core:** checkRepository (and the internal dependencyEntries, readManifest, listConfigFiles and loadProjects) now require the RepositoryFiles service from @vocablint/core instead of FileSystem.FileSystem and Path.Path. Provide nodeRepositoryFiles (Layer<RepositoryFiles>, Node implementation backed by NodeServices) instead of NodeServices.layer. The change is needed because effect 4.0.2 marks FileSystem and Path as unstable APIs that exported signatures must not leak.
* 持ち主のタグを @canonical-values から @vocablint に改名する ([#22](https://github.com/masseater/lint-kit/issues/22))

### Features

* **audit:** 不要になった audit.ignore を verify で自動的に消す ([#72](https://github.com/masseater/lint-kit/issues/72)) ([3d2f63f](https://github.com/masseater/lint-kit/commit/3d2f63fd53fa30fb0797c0c903cc4ac8c12672d6))
* **core:** read the repository through a RepositoryFiles service for effect 4.0.2 ([#34](https://github.com/masseater/lint-kit/issues/34)) ([7b92d75](https://github.com/masseater/lint-kit/commit/7b92d75d3c439ba1338b99e493e0c9b5758b89e1))
* oxlint で型情報を要る ESLint ルールを動かすパッケージを切り出す ([#4](https://github.com/masseater/lint-kit/issues/4)) ([cbc9239](https://github.com/masseater/lint-kit/commit/cbc9239954dd2d3674749c56f79c2537c96044b1))
* oxlint-typed-rules と vocablint を取り込み lint-kit にまとめる ([1a1a218](https://github.com/masseater/lint-kit/commit/1a1a218d19e4d48c3d68f60167d9b4059149ae4b))
* refuse rule and location cutoffs below 0.8 ([75192dd](https://github.com/masseater/lint-kit/commit/75192dd49bb05b0a76e11d1dc4ccd19b5e63ca18))
* **skills:** install shared skills from masseater/skills and philtzjp/skills ([#28](https://github.com/masseater/lint-kit/issues/28)) ([a022c36](https://github.com/masseater/lint-kit/commit/a022c36e0d266621b31b8b7962442645cf285976))
* **verify:** fail verify on known dependency vulnerabilities ([#60](https://github.com/masseater/lint-kit/issues/60)) ([be9ab91](https://github.com/masseater/lint-kit/commit/be9ab91a72422d32ad38e82871c6ac8f1b877b4b))
* 型検査器を TypeScript 7（tsgo）の API で作る ([#15](https://github.com/masseater/lint-kit/issues/15)) ([0ff8960](https://github.com/masseater/lint-kit/commit/0ff8960b6bb574b3118414894129ec3c44bc5fe2))
* 持ち主のタグを [@canonical-values](https://github.com/canonical-values) から [@vocablint](https://github.com/vocablint) に改名する ([#22](https://github.com/masseater/lint-kit/issues/22)) ([b6f942c](https://github.com/masseater/lint-kit/commit/b6f942ce7f0f65a2505f4028b81d442579e12404))


### Bug Fixes

* audit の脆弱性を解消し、@effect/tsgo 0.55 の診断に合わせる ([#45](https://github.com/masseater/lint-kit/issues/45)) ([29d1af8](https://github.com/masseater/lint-kit/commit/29d1af8ae65c2de9714514d9f602dcb37a85a2a1))
* **ci:** switch zizmor offline audits on CLAUDE_CODE_REMOTE like the template ([4f96a2f](https://github.com/masseater/lint-kit/commit/4f96a2fd120ab076f898c0c997bb7c196f819170))
* **ci:** zizmor offline audits on CLAUDE_CODE_REMOTE (ZIZMOR_NO_ONLINE_AUDITS 廃止) ([2abcfa1](https://github.com/masseater/lint-kit/commit/2abcfa1bd5c4c08a52cdb98ccd55644ae205cc52))
* **decision:** リポ名が取れないときの帰属先を lint-kit にする ([#74](https://github.com/masseater/lint-kit/issues/74)) ([40f5a41](https://github.com/masseater/lint-kit/commit/40f5a41d37be500070ef3ed17a31742171c5904e))
* npm から入れても読み込めるようにし、性能の比較を README に書く ([#10](https://github.com/masseater/lint-kit/issues/10)) ([4336c02](https://github.com/masseater/lint-kit/commit/4336c02a2dcd8255beb5dfd3d8575ddbeb165bb6))
* **skills:** follow the setup-github rename to setup-template ([3b7aba8](https://github.com/masseater/lint-kit/commit/3b7aba82abff8a01740770d91d0d140cb6054b75))
* **skills:** follow the setup-github rename to setup-template ([ac68b76](https://github.com/masseater/lint-kit/commit/ac68b76692b9f6439d9ca00a1964fb1bd0eece67))
* 依存の TypeScript 6 を typescript-6 の別名で入れる ([#7](https://github.com/masseater/lint-kit/issues/7)) ([f2b6475](https://github.com/masseater/lint-kit/commit/f2b6475bf6803ce99b444e9b71d87be219affc08))

## [0.0.4](https://github.com/masseater/oxlint-plugin-decision/compare/v0.0.3...v0.0.4) (2026-10-12)


### Features

* OpenRouter のアプリをリポジトリと実行元（CI / Claude Code cloud / Claude Code / local）ごとに分ける ([#52](https://github.com/masseater/oxlint-plugin-decision/issues/52)) ([8f036a1](https://github.com/masseater/oxlint-plugin-decision/commit/8f036a1c0e33b50bd39f0a5e8967e99d7cafb1fc))


### Bug Fixes

* keep decision answers across CI runs and name the app on OpenRouter ([#51](https://github.com/masseater/oxlint-plugin-decision/issues/51)) ([1c0055e](https://github.com/masseater/oxlint-plugin-decision/commit/1c0055efc91d8ce74421415ce5159779ee37ce41))
* **release:** release the fix commits and stop parsing an empty PR output ([#48](https://github.com/masseater/oxlint-plugin-decision/issues/48)) ([aad2ba6](https://github.com/masseater/oxlint-plugin-decision/commit/aad2ba67f3df3de57ee05b53d1aee197e6059293))
* **release:** run up-to-date on the release PR before merging it ([#53](https://github.com/masseater/oxlint-plugin-decision/issues/53)) ([c069053](https://github.com/masseater/oxlint-plugin-decision/commit/c069053b221f2e56ba2cb9d777b314a748a00c69))

## [0.0.3](https://github.com/masseater/oxlint-plugin-decision/compare/v0.0.2...v0.0.3) (2026-10-12)


### Bug Fixes

* pass OPENROUTER_API_KEY to the publish workflow's verify ([#42](https://github.com/masseater/oxlint-plugin-decision/issues/42)) ([06e6fd8](https://github.com/masseater/oxlint-plugin-decision/commit/06e6fd8ebbaf844dd3508ad94e4d8f4fa72eff7e))
* **release:** release the fix commits and stop parsing an empty PR output ([#45](https://github.com/masseater/oxlint-plugin-decision/issues/45)) ([fed219c](https://github.com/masseater/oxlint-plugin-decision/commit/fed219c8952493aa3351ab902866dadc9795a507))

## [0.0.2](https://github.com/masseater/oxlint-plugin-decision/compare/v0.0.1...v0.0.2) (2026-10-12)


### ⚠ BREAKING CHANGES

* remove maxMatchesPerFile and send every match ([#24](https://github.com/masseater/oxlint-plugin-decision/issues/24))
* **presets:** sort the jev-lint rules into strict and review-only ([#26](https://github.com/masseater/oxlint-plugin-decision/issues/26))
* select matches with a function of the AST instead of nameMatches ([#22](https://github.com/masseater/oxlint-plugin-decision/issues/22))
* fail under CI by default when a model can't be asked ([#19](https://github.com/masseater/oxlint-plugin-decision/issues/19))
* register each decision rule as its own oxlint rule and drop decision/ask ([#10](https://github.com/masseater/oxlint-plugin-decision/issues/10))

### Features

* answer classify and severity rules on Respan models ([#9](https://github.com/masseater/oxlint-plugin-decision/issues/9)) ([35756a9](https://github.com/masseater/oxlint-plugin-decision/commit/35756a9f6981d258942fa588e66670ae3e356f77))
* explain why each match was or wasn't reported ([#17](https://github.com/masseater/oxlint-plugin-decision/issues/17)) ([8c10039](https://github.com/masseater/oxlint-plugin-decision/commit/8c100393687336a8034323976eec2eba2f2b1574))
* fail under CI by default when a model can't be asked ([#19](https://github.com/masseater/oxlint-plugin-decision/issues/19)) ([010c6c9](https://github.com/masseater/oxlint-plugin-decision/commit/010c6c9a9b6f7381afc4efac474171829c1ec6c6))
* let env rename the variables providers read the API key and base URL from ([#13](https://github.com/masseater/oxlint-plugin-decision/issues/13)) ([38b0dfc](https://github.com/masseater/oxlint-plugin-decision/commit/38b0dfc79e126fbcbd6982d13c2f4358951d15ad))
* override a rule's model from its oxlint rule options ([#16](https://github.com/masseater/oxlint-plugin-decision/issues/16)) ([557cd22](https://github.com/masseater/oxlint-plugin-decision/commit/557cd2299320cf58bb364db6737cbbeba8a557d1))
* **presets:** add domain-naming and prefer-schema-validation ([#20](https://github.com/masseater/oxlint-plugin-decision/issues/20)) ([ef6afcf](https://github.com/masseater/oxlint-plugin-decision/commit/ef6afcf22856cd78db8f5b76e56f0de54e823056))
* **presets:** add the ai-slop entry for padding coding agents leave behind ([#23](https://github.com/masseater/oxlint-plugin-decision/issues/23)) ([d4cd93e](https://github.com/masseater/oxlint-plugin-decision/commit/d4cd93ee57f387de0d858ff7eda086cfc1e97bd3))
* **presets:** add the jev-lint rules as the jev entry ([#21](https://github.com/masseater/oxlint-plugin-decision/issues/21)) ([f3ec81c](https://github.com/masseater/oxlint-plugin-decision/commit/f3ec81c6c6356a932d7a33e743800bfcb0299997))
* **presets:** flag schemas that hand-copy an imported library's types ([#32](https://github.com/masseater/oxlint-plugin-decision/issues/32)) ([600e2c4](https://github.com/masseater/oxlint-plugin-decision/commit/600e2c43c1337a00b5bb58e32a444f62f8e88c17))
* **presets:** sort the jev-lint rules into strict and review-only ([#26](https://github.com/masseater/oxlint-plugin-decision/issues/26)) ([7773da4](https://github.com/masseater/oxlint-plugin-decision/commit/7773da4fb1c05292127534d8f7ea1dfecda601cf))
* register each decision rule as its own oxlint rule and drop decision/ask ([#10](https://github.com/masseater/oxlint-plugin-decision/issues/10)) ([4bd8c2c](https://github.com/masseater/oxlint-plugin-decision/commit/4bd8c2c94cf255ff9eec14dc5f9406d52f3764f3))
* remove maxMatchesPerFile and send every match ([#24](https://github.com/masseater/oxlint-plugin-decision/issues/24)) ([57a674a](https://github.com/masseater/oxlint-plugin-decision/commit/57a674a2d3ff7174b2c7de2390f3cfbccde0a50d))
* select matches with a function of the AST instead of nameMatches ([#22](https://github.com/masseater/oxlint-plugin-decision/issues/22)) ([1add398](https://github.com/masseater/oxlint-plugin-decision/commit/1add398333804ed6f0ea89e480be84fd29e702b2))
* ship an agent skill with the API package through TanStack Intent ([#30](https://github.com/masseater/oxlint-plugin-decision/issues/30)) ([646b46f](https://github.com/masseater/oxlint-plugin-decision/commit/646b46f950c861d665b21c03f894f5e5b313cf51))
