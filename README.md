# Music Bubble

[![CI](https://github.com/pdugan20/figma-music-bubble/actions/workflows/ci.yml/badge.svg)](https://github.com/pdugan20/figma-music-bubble/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![esbuild](https://img.shields.io/badge/esbuild-0.25-FFCF00?logo=esbuild&logoColor=black)](https://esbuild.github.io/)
[![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Figma Plugin](https://img.shields.io/badge/Figma-Plugin-F24E1E?logo=figma&logoColor=white)](https://www.figma.com/developers/plugins)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?logo=opensourceinitiative&logoColor=white)](LICENSE)

A Figma plugin that fills a selected Music Bubble component with real track data from
the iTunes API. Search any song, then one click sets the title, artist, album artwork,
and a dominant-color theme drawn from the cover art.

## Features

- iTunes search with album artwork and a live dominant-color swatch per result
- One-click fill of a selected Music Bubble: song title, artist, album art, themed color
- Contrast-aware light/dark text plus matching Apple Music logo treatment
- Enables the component's dynamic-color variant and keeps the tail color in sync
- Recently used and featured tracks, with debounced search

## Prerequisites

- [Node.js](https://nodejs.org) v22+
- [Figma desktop app](https://figma.com/downloads/)
- [Apple SF Pro typeface](https://developer.apple.com/fonts/)
- [iMessage Chat Builder UI kit](https://www.figma.com/community/file/1519446101653617639/imessage-chat-builder) (provides the Music Bubble component)

## Getting Started

```bash
git clone https://github.com/pdugan20/figma-music-bubble.git
cd figma-music-bubble
npm install
npm run build
```

Install in Figma: Plugins > Development > Import plugin from manifest... and select
`manifest.json`. Select a Music Bubble instance, run the plugin, search a song, and
click a result.

## Development

```bash
npm run watch         # Dev build, rebuilds on change
npm run build         # Production build into dist/
npm test              # Run tests
npm run test:coverage # Tests with coverage
npm run lint:fix      # ESLint with autofix
npm run style:write   # Prettier formatting
```

Git hooks (pre-commit lint-staged, commit-msg commitlint) are installed automatically
on `npm install` via `simple-git-hooks`.

## Tech Stack

- **Build**: esbuild (plugin bundle plus UI inlined into a single `dist/ui.html`)
- **Language**: TypeScript, vanilla DOM UI (no framework)
- **Data**: iTunes Search API
- **Testing**: Vitest (jsdom)
- **Quality**: ESLint 9, Prettier, markdownlint, Conventional Commits, release-please

## Documentation

- [Design Spec](docs/superpowers/specs/2026-06-25-figma-music-bubble-design.md) - Goals, component model, architecture, and the dynamic-color seam
- [Implementation Plan](docs/superpowers/plans/2026-06-25-figma-music-bubble.md) - Task-by-task build, module interfaces, and tests

## Related

- [chat-builder-plugin](https://github.com/pdugan20/chat-builder-plugin) - The iMessage AI Chat Builder the Music Bubble component ships with
- [iMessage Chat Builder UI kit](https://www.figma.com/community/file/1519446101653617639/imessage-chat-builder) - The Figma component library
