# Music Bubble

A Figma plugin that fills a selected "Music Bubble" component instance with real
track data from the iTunes API: song and artist text, album artwork, and a
dominant-color theme applied to the bubble, tail, Apple Music logo, and text.

## Development

Requires Node 22 (see `.nvmrc`).

```bash
npm install
npm run watch    # development build
npm run build    # production build into dist/
```

### Quality checks

```bash
npm run type-check
npm run lint:fix
npm run style:write
npm test
```

## Import into Figma

1. Run `npm run build`
2. Open Figma desktop on a file that contains a Music Bubble component
3. Plugins menu → Development → Import plugin from manifest
4. Select `manifest.json` from this repo
5. Select a Music Bubble instance and run "Music Bubble"

## Architecture

- `src/plugin/` — main thread. `index.ts` wires events; `bubble-source.ts` is the
  seam for acquiring the target instance (kit-dependent today); `fill.ts` applies
  text, artwork, and `theme.ts` color decisions; `bubble-schema.ts` holds the
  layer-name contract.
- `src/ui/` — vanilla-DOM UI. `itunes.ts` (search), `dominant-color.ts` (artwork
  color), `recents.ts`, `render.ts`, `featured.ts`, wired by `main.ts`.
- `src/shared/color.ts` — color math shared by both threads.
- `build.mjs` — esbuild: bundles the plugin and inlines the UI bundle into `dist/ui.html`.
