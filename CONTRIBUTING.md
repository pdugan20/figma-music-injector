# Contributing

Thanks for your interest in improving this plugin. This guide covers local setup, the
quality bar, and how changes get released.

## Prerequisites

- [Node.js](https://nodejs.org) v22+ (see `.nvmrc`)
- [Figma desktop app](https://figma.com/downloads/)
- [Apple SF Pro typeface](https://developer.apple.com/fonts/)
- The [iMessage UI Kit](https://www.figma.com/community/file/1519446101653617639/imessage-chat-builder) (provides the Music Bubble component)

## Setup

```bash
git clone https://github.com/pdugan20/figma-music-bubble.git
cd figma-music-bubble
npm install
npm run build
```

Git hooks (pre-commit lint-staged, commit-msg commitlint) are installed automatically on
`npm install` via `simple-git-hooks`. Then in Figma: Plugins > Development > Import plugin
from manifest... and select `manifest.json`.

## Development

```bash
npm run watch   # rebuilds on change
```

Before opening a PR, make sure all checks pass:

```bash
npm run style:check
npm run lint
npm run lint:md
npm run type-check
npm test
npm run build
```

## Code Standards

- New logic ships with Vitest tests; keep pure functions free of Figma/DOM/fetch calls.
- Figma API access stays in `src/plugin/`; the layer-name contract lives only in
  `src/plugin/bubble-schema.ts`.
- No emojis in code, logs, or console output.

## Commits and Pull Requests

- Commit messages and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `chore:`, etc.). PR titles are validated in CI.
- Open PRs against `main`. CI (lint, type-check, tests, build) must pass before merge.

## Releases

Versioning is automated with [release-please](https://github.com/googleapis/release-please).
Merging conventional commits to `main` opens a release PR; merging that PR bumps the version,
updates the changelog, tags the release, and attaches the built `dist/` artifacts.
