# Changelog

## [0.4.0](https://github.com/pdugan20/figma-music-bubble/compare/v0.3.2...v0.4.0) (2026-07-01)


### Features

* outline album art with a faint contrast hairline ([d946346](https://github.com/pdugan20/figma-music-bubble/commit/d9463469284027655035a3e89b78a9a3252af245))
* polish bubble insertion (cascade placement, faint art hairline) ([6597618](https://github.com/pdugan20/figma-music-bubble/commit/65976189fd3c8d9a7b91407e3cc205d078112d65))


### Bug Fixes

* cascade inserted bubbles by rendered bounds instead of stacking ([f45d727](https://github.com/pdugan20/figma-music-bubble/commit/f45d727650dc3b50c10d88b3f8d199f684a5da0a))

## [0.3.2](https://github.com/pdugan20/figma-music-bubble/compare/v0.3.1...v0.3.2) (2026-06-29)


### Bug Fixes

* hide inserted bubble until populated to stop content flash ([#14](https://github.com/pdugan20/figma-music-bubble/issues/14)) ([61f7e6c](https://github.com/pdugan20/figma-music-bubble/commit/61f7e6ca0de59ddf6711a313b6071400777bcc12))

## [0.3.1](https://github.com/pdugan20/figma-music-bubble/compare/v0.3.0...v0.3.1) (2026-06-28)


### Bug Fixes

* prevent duplicate bubbles on double-click; refresh README ([#12](https://github.com/pdugan20/figma-music-bubble/issues/12)) ([7ec2898](https://github.com/pdugan20/figma-music-bubble/commit/7ec2898ab4b898f5e84dde48a4e4f1cf7df9f494))

## [0.3.0](https://github.com/pdugan20/figma-music-bubble/compare/v0.2.0...v0.3.0) (2026-06-28)


### Features

* enable track selection when no bubble is selected ([692942f](https://github.com/pdugan20/figma-music-bubble/commit/692942f4adbf62d187b905aaf938d88f81e08eda))
* follow Figma light/dark theme in the plugin panel ([7339a76](https://github.com/pdugan20/figma-music-bubble/commit/7339a76e0e08d7dc76e3016576a5db764b2c15f1))
* insert a new Music Bubble when none is selected ([a680cb6](https://github.com/pdugan20/figma-music-bubble/commit/a680cb6206103ed866c869e5b65939f35e519ff4))


### Bug Fixes

* keep inserted Music Bubble orientation correct and simplify empty-selection status ([10238c4](https://github.com/pdugan20/figma-music-bubble/commit/10238c44536ce9a167ca1711bafd7d6ca7e4d8ef))


### Documentation

* design spec for dark mode, auto-insert, and toast text ([97a5caf](https://github.com/pdugan20/figma-music-bubble/commit/97a5caf7107abba47212aaab37528e9d2b3cea1e))
* drop tech stack section, fold features into intro ([a31b1af](https://github.com/pdugan20/figma-music-bubble/commit/a31b1af3bec1e1198ee9e18c2c3dfe74c9cf40e1))
* implementation plan for dark mode, auto-insert, and toast ([f00bd98](https://github.com/pdugan20/figma-music-bubble/commit/f00bd98eaae0aee0db09ebc7d35161b37b6622a7))

## [0.2.0](https://github.com/pdugan20/figma-music-bubble/compare/v0.1.0...v0.2.0) (2026-06-25)


### Features

* add bubble source seam ([e6a82da](https://github.com/pdugan20/figma-music-bubble/commit/e6a82da6648f0f6330bc0062d4af9ff0bdff9aee))
* add bubble theme decision logic ([0e39219](https://github.com/pdugan20/figma-music-bubble/commit/0e39219967093d69d33b43cc13f6ece89ea218d3))
* add DOM render helpers ([34d47fe](https://github.com/pdugan20/figma-music-bubble/commit/34d47fee49de43d75d02aec3362fbb93b9a0aa12))
* add dominant color extraction ([eb8fdfa](https://github.com/pdugan20/figma-music-bubble/commit/eb8fdfa389c5d734983da6681c2848fc6b61bc89))
* add featured tracks loader ([9d53dc3](https://github.com/pdugan20/figma-music-bubble/commit/9d53dc3242243094ed1b9381fd8bc1d76c0d62ce))
* add iTunes search client ([47e52d5](https://github.com/pdugan20/figma-music-bubble/commit/47e52d5efae5aa0688370ff978a84a4ec2e16487))
* add layer schema and selection status ([cda1f99](https://github.com/pdugan20/figma-music-bubble/commit/cda1f999cd37bee16b19979c84c7599856a11f84))
* add node fill helpers and fillBubble operation ([ea4a923](https://github.com/pdugan20/figma-music-bubble/commit/ea4a9230d0a41a9fec24394f6f4cfc4fa998e862))
* add recents store with storage fallback ([abc2943](https://github.com/pdugan20/figma-music-bubble/commit/abc29439d16595822ec61b864e2d9da9106e5c0e))
* add shared RGB types and color math ([bcb17e2](https://github.com/pdugan20/figma-music-bubble/commit/bcb17e235d80a6135c4f349abab11f0ab770252b))
* add UI controller wiring search, recents, and populate ([f691653](https://github.com/pdugan20/figma-music-bubble/commit/f691653eae6a0c9e230f1bead6a754994a2671cb))
* rename plugin display name to 'iMessage Music Builder' ([04c0134](https://github.com/pdugan20/figma-music-bubble/commit/04c0134664e685a4d6a9e9f59920c85a21b80785))
* wire plugin entry to source, fill, and notify ([cf47c9c](https://github.com/pdugan20/figma-music-bubble/commit/cf47c9c182dab7bd3311046e3c42ea7379dd0200))


### Bug Fixes

* **ci:** use chore prefix so dependabot emits single-scope commit titles ([1d38175](https://github.com/pdugan20/figma-music-bubble/commit/1d38175e8a2cde9f0ecb5fde9db2c47d835776ea))
* clear pending search debounce on empty and single-char queries ([545d384](https://github.com/pdugan20/figma-music-bubble/commit/545d38428c7a7d7971a5f5f9fd2139bd74e89480))
* **plugin:** enable dynamic-colors variant and keep tail color in sync ([1c8b23e](https://github.com/pdugan20/figma-music-bubble/commit/1c8b23e87ea64f0faa4bf169de9f84576d65418b))
* revert project-wide type-checked lint, scope Figma plugin rule to src/ ([728832d](https://github.com/pdugan20/figma-music-bubble/commit/728832d95a779a33bceb816e0687aa7c0bc21dfd))
* **ui:** add footer bar, refine color dot, center loading spinner ([f081616](https://github.com/pdugan20/figma-music-bubble/commit/f0816163723a0aa85e48f26f439094a6308ee944))


### Documentation

* add missing @eslint/js devDependency to plan ([83c164a](https://github.com/pdugan20/figma-music-bubble/commit/83c164a99a3513699419dfe5da0c49f5857ce01a))
* add Music Bubble implementation plan ([6281f37](https://github.com/pdugan20/figma-music-bubble/commit/6281f37c33e0d5f61d06e5e8378a7777bec66b20))
* add Music Bubble plugin design spec ([f530a97](https://github.com/pdugan20/figma-music-bubble/commit/f530a97b287091fe74311310dc3932139dfc5265))
* rename repo to figma-music-bubble, title 'Apple Music Figma Plugin' ([78c5735](https://github.com/pdugan20/figma-music-bubble/commit/78c5735bc00fa67c4564bb8dae967f7781682497))
* restore curated badge row (CI, Figma, TypeScript, License) ([10b07f8](https://github.com/pdugan20/figma-music-bubble/commit/10b07f8bc57df1c63dcceb4f66d82ac0f69cea32))
* rewrite README with badges and metadata matching chat-builder-plugin ([e664512](https://github.com/pdugan20/figma-music-bubble/commit/e6645128e1ed5e7b6e93eace80e31e4e75ac4dbe))
* title README 'iMessage Music Bubble for Figma' ([44c05ff](https://github.com/pdugan20/figma-music-bubble/commit/44c05ff2fb536e6180061234241d07dcfd9bd6d0))
* title README 'iMessage Music Bubble' for family context ([f5d4c94](https://github.com/pdugan20/figma-music-bubble/commit/f5d4c94a9724593effedf8e2138951094c5a75f0))
* trim README badges, drop docs section, simplify features ([53381df](https://github.com/pdugan20/figma-music-bubble/commit/53381df7c0ff13fd1647df5e42d20e6c44a4cedc))
