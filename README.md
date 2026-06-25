# Music Bubble

[![CI](https://github.com/pdugan20/figma-music-bubble/actions/workflows/ci.yml/badge.svg)](https://github.com/pdugan20/figma-music-bubble/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?logo=opensourceinitiative&logoColor=white)](LICENSE)

A Figma plugin that fills a selected Music Bubble component with real track data from
the iTunes API. Search any song, then one click sets the title, artist, album artwork,
and a dominant-color theme drawn from the cover art.

## Features

- iTunes search with album artwork and a dominant-color swatch per result
- One-click fill of a selected Music Bubble: title, artist, album art, and a color theme from the cover
- Contrast-aware light/dark text and Apple Music logo
- Recently used and featured tracks, with debounced search

## Prerequisites

- [Node.js](https://nodejs.org) v22+
- [Figma desktop app](https://figma.com/downloads/)
- [Apple SF Pro typeface](https://developer.apple.com/fonts/)
- [iMessage UI Kit](https://www.figma.com/community/file/1519446101653617639/imessage-chat-builder) (provides the Music Bubble component)

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

## Related

- [chat-builder-plugin](https://github.com/pdugan20/chat-builder-plugin) - The iMessage AI Chat Builder the Music Bubble component ships with
- [iMessage UI Kit](https://www.figma.com/community/file/1519446101653617639/imessage-chat-builder) - The companion Figma component library
