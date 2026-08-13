# Music Injector Figma Plugin

[![CI](https://github.com/pdugan20/figma-music-injector/actions/workflows/ci.yml/badge.svg)](https://github.com/pdugan20/figma-music-injector/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/pdugan20/figma-music-injector?logo=github&logoColor=white)](https://github.com/pdugan20/figma-music-injector/releases/latest)
[![Figma Plugin](https://img.shields.io/badge/Figma-Community-F24E1E?logo=figma&logoColor=white)](https://www.figma.com/community/plugin/1652043984127056655/imessage-music-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?logo=opensourceinitiative&logoColor=white)](LICENSE)

A Figma plugin that fills Music Bubble components with real track data from iTunes.
Choose a song to update a selected bubble or insert a new one. The plugin adds the title,
artist, artwork, and a contrast-aware color theme sampled from the cover.

## Getting Started

```bash
git clone https://github.com/pdugan20/figma-music-injector.git
cd figma-music-injector
npm install
npm run build
```

Install in Figma: Plugins > Development > Import plugin from manifest... and select
`manifest.json`. Run the plugin, search for a song, and click a result. Select a Music
Bubble first to fill it, or run with nothing selected to insert a new one.

## Development

```bash
npm run watch         # Dev build, rebuilds on change
npm run build         # Production build into dist/
npm test              # Run tests
npm run test:coverage # Tests with coverage
npm run lint:fix      # ESLint with autofix
npm run style:write   # Prettier formatting
```
