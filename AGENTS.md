# Repository guidance

## Work modes

- Default to exploration for design iterations, prototypes, and small changes. Make focused edits directly; do not require a formal spec, separate plan, worktree, or TDD.
- Apply production rigor when the user explicitly asks to ship, harden, prepare a release, or use strict TDD. Match verification to risk and obey any stronger test requirements below.
- Ask before deployments, production-data changes, live service mutations, schema migrations, or security-rule changes.

## Project Overview

A Figma plugin (figma-music-injector) that injects real track data into a selected "Music
Bubble" component instance (from the iMessage UI kit): song title, artist, album artwork,
and a dominant-color theme drawn from the cover art, with contrast-aware text and a faint
hairline so a same-toned cover does not blend into the bubble.

## Essential Commands

```bash
npm run watch         # Dev build, rebuilds on change
npm run build         # Production build into dist/
npm run type-check    # tsc --noEmit
npm run lint:fix      # ESLint with autofix
npm run style:write   # Prettier formatting
npm run lint:md       # markdownlint
npm test              # Vitest
npm run test:coverage # Vitest with coverage
```

When checking for errors, run all four: `style:write`, `lint`, `type-check`, `test`.

## Architecture

Two threads communicate over a typed `postMessage` contract. Pure logic is isolated from
the thin IO / DOM / Figma shells so it can be unit-tested.

- `src/plugin/` — main thread. `index.ts` wires events; `bubble-source.ts` is the seam for
  acquiring the target instance (kit-dependent today); `fill.ts` applies text, artwork, and
  `theme.ts` color decisions; `bubble-schema.ts` holds the layer-name and variant-property
  contract.
- `src/ui/` — vanilla-DOM UI. `itunes.ts` (search), `dominant-color.ts` (artwork color),
  `recents.ts`, `render.ts`, `featured.ts`, wired by `main.ts`.
- `src/shared/color.ts` — color math shared by both threads.
- `build.mjs` — esbuild: bundles the plugin and inlines the UI bundle into `dist/ui.html`.

## Key Rules

- All Figma API access lives in `src/plugin/`; the UI thread never touches the Figma API.
- The Music Bubble layer-name and variant-property contract is the single source of truth in
  `src/plugin/bubble-schema.ts` — do not inline those strings elsewhere.
- The plugin requires the Music Bubble component to be present in the file and uses Apple
  SF Pro; long titles truncate via the component's text-truncation settings.
- Keep pure functions free of Figma/DOM/fetch calls so they stay unit-testable.

## Code Review Rules

- Flag Figma API access outside `src/plugin/` or DOM/fetch access in pure shared logic.
- Flag layer names or variant-property strings duplicated outside
  `src/plugin/bubble-schema.ts`, or message-contract changes without typed validation and
  tests on both plugin and UI sides.
- Flag document mutations before the target instance, required layers, fonts, artwork,
  and theme inputs are validated, or failure paths that leave a partially updated bubble.

## Standards

- TDD with Vitest; new logic ships with tests.
- Conventional Commits (commitlint enforces commit messages; PR titles validated in CI).
- No emojis in code, logs, or console output.
- Versioning is automated via release-please on push to `main`.
