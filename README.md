# Apple Music Figma Plugin

[![CI](https://github.com/pdugan20/figma-music-bubble/actions/workflows/ci.yml/badge.svg)](https://github.com/pdugan20/figma-music-bubble/actions/workflows/ci.yml)
[![Figma Plugin](https://img.shields.io/badge/Figma-Plugin-F24E1E?logo=figma&logoColor=white)](https://www.figma.com/developers/plugins)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?logo=opensourceinitiative&logoColor=white)](LICENSE)

A Figma plugin that fills a Music Bubble component with real track data from the iTunes
API. Select a bubble and pick a song, or — with nothing selected — pick a track and the
plugin inserts a new bubble for you. One click sets the title, artist, album artwork, and
a dominant-color theme drawn from the cover art. Search results show album artwork with a
dominant-color swatch, text and the Apple Music logo adapt for light/dark contrast, the
plugin panel follows Figma's light or dark theme, and recently used and featured tracks
are a click away with debounced search.

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
`manifest.json`. Run the plugin, search a song, and click a result — select a Music
Bubble first to fill it, or run with nothing selected to drop in a new one.

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

## Related

- [figma-chat-builder](https://github.com/pdugan20/figma-chat-builder) - The iMessage AI Chat Builder the Music Bubble component ships with
- [imessage-ui-kit](https://www.figma.com/community/file/1519446101653617639/imessage-chat-builder) - The companion Figma component library
