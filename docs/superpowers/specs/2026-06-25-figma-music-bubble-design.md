# Figma Music Bubble — Design

## Overview

`figma-music-bubble` is a Figma plugin (display name **"Music Bubble"**) that fills a
selected "Music Bubble" component instance with real track data. You select a Music
Bubble instance, search the iTunes API for a song, and clicking a result populates the
bubble: it sets the Song Name / Artist Name text, fills the Album Art with the artwork
image, extracts the artwork's dominant color, and themes the bubble container, tail,
Apple Music logo, and text with that color (contrast-aware light/dark text).

The plugin is a modular, test-first rewrite of three working source files
(`code.ts`, `ui.html`, `manifest.json`) so we can iterate on top of it.

## Goals

- Faithful behavior to the working source files, with no functional regressions.
- Modular, testable code: every pure function (color math, theme decisions, color
  extraction, API parsing, recents) isolated from the thin IO / DOM / Figma shells.
- A clean seam for component acquisition so a future "build the component if it is
  missing" mode is a drop-in, not a rewrite.
- Full repo standardization matching the author's other plugin repos.

## Non-Goals (this iteration)

- Building the Music Bubble component in code (the seam is prepared, not implemented).
- Importing the component from a published team library.
- Any music source other than the iTunes Search API.
- Migrating the UI to React / figma-kit (vanilla DOM is intentional).

## Component model

The plugin is **kit-dependent** for now: the Music Bubble component must already exist
in the file, and the user selects an instance of it. This matches the sibling
`imessage-chat-builder` plugin, which gates its UI on the kit being present.

Acquisition is isolated behind a seam (`plugin/bubble-source.ts`) so the kit-dependent
behavior can later be swapped for a "build if missing" source without touching callers
or the fill logic. There is no Figma API to import a serialized `.fig` node tree, so a
future self-contained mode would mean constructing the component in code from the same
layer-name schema defined in `plugin/bubble-schema.ts`.

## Stack

- **Bundler:** esbuild — bundles `src/plugin/index.ts` → `dist/plugin.js`, and bundles
  `src/ui/main.ts` and inlines it into `dist/ui.html` (Figma requires a single
  self-contained UI file). `build.mjs` with a watch mode via esbuild context.
- **Language:** TypeScript throughout, including the UI (promoted from the inline
  `<script>`), with a shared `PluginMessage` type contract between threads.
- **UI:** vanilla DOM (no framework) — it is a debounced search list.
- **Tests:** Vitest (jsdom for DOM modules).
- **Lint/format:** ESLint flat config + `@figma/eslint-plugin-figma-plugins` + Prettier.
- **Standardization:** GitHub Actions CI (lint, type-check, test, build) · Dependabot ·
  release-please · `simple-git-hooks` + `lint-staged` + commitlint · `.nvmrc` (Node 22) ·
  `.editorconfig` · MIT LICENSE · README.

## Architecture

Split **where the bubble comes from** (swappable) from **what we do to it** (stable).

```
src/
  types.ts                 # RGB, TrackEntry, SelectionStatus, PluginMessage unions
  shared/color.ts          # PURE: darken, luminance, needsLightText, toHex

  plugin/
    index.ts               # entry: showUI, relaunch data, wire events + dispatch (thin)
    bubble-schema.ts       # PURE constants: layer names in one place
    bubble-source.ts       # THE SEAM: BubbleSource interface + resolve() result;
                           #   SelectionBubbleSource today, EnsureBubbleSource later
    selection.ts           # PURE-ish: getSelectionStatus(selection) -> status
    theme.ts               # PURE: computeBubbleTheme(dominant) -> theme decisions
    fill.ts                # fillBubble(instance, data): text/image/theme (source-agnostic)
    nodes.ts               # thin Figma node-finder wrappers (use bubble-schema names)

  ui/
    ui.html                # markup + CSS only
    main.ts                # controller (thin): wire DOM, selection state, search input
    itunes.ts              # searchTracks, upgradeArtwork, fetchArtworkBytes
    dominant-color.ts      # extractDominantColor (IO) + PURE pickDominant(pixels)
    recents.ts             # RecentsStore over a storage adapter (localStorage + fallback)
    render.ts              # makeItem, addSection (jsdom-testable)
    featured.ts            # featured list + loadFeatured

build.mjs                  # esbuild build/watch
manifest.json              # networkAccess + documentAccess
```

### Module responsibilities and interfaces

- **`types.ts`** — shared shapes. `RGB = { r: number; g: number; b: number }` (0–1).
  `TrackEntry = { trackName; artistName; artworkUrl; dominantColor: RGB | null }`.
  Message unions: UI→plugin `{ type: 'populate', trackName, artistName, artworkBytes:
  number[] | null, dominantColor: RGB | null }`; plugin→UI `{ type: 'selection', status:
  SelectionStatus }`. `SelectionStatus = { ok: boolean; message: string }`.

- **`shared/color.ts`** (PURE) — `darken(rgb, factor)`, `luminance(rgb)`,
  `needsLightText(bg)`, `toHex(rgb | null)`. Used by both threads.

- **`plugin/bubble-schema.ts`** (PURE) — layer-name constants: `SONG_NAME`,
  `ARTIST_NAME`, `ALBUM_ART`, `MESSAGE_CONTAINER`, `TAIL` ("Shape"), `APPLE_LOGO`
  (`"Apple Logo"` / `"Apple"`). The single source of truth for the structural contract.

- **`plugin/bubble-source.ts`** (SEAM) — `interface BubbleSource { resolve():
  BubbleResolution }` where `BubbleResolution = { ok: true; instance: InstanceNode } |
  { ok: false; message: string }`. `SelectionBubbleSource` validates the current
  selection (single Music Bubble instance with a "Song Name" layer).

- **`plugin/selection.ts`** — `getSelectionStatus(selection: readonly SceneNode[]):
  SelectionStatus`. Pure over the selection array; testable with fake nodes.

- **`plugin/theme.ts`** (PURE) — `computeBubbleTheme(dominant: RGB): { primary: RGB;
  dark: RGB; textColor: RGB; logoColor: RGB; logoOpacity: number }`. All color-decision
  logic extracted out of node mutation. `dark = darken(primary, 0.65)`;
  `lightText = needsLightText(primary)`; `textColor` = white if lightText else black;
  `logoColor` = white if lightText else `dark`; `logoOpacity` = 0.6 if lightText else 1.

- **`plugin/fill.ts`** — `fillBubble(instance, data)`: load fonts, set Song/Artist
  characters, replace/append the Album Art `IMAGE` fill from `data.artworkBytes`, and if
  `data.dominantColor` is present apply `computeBubbleTheme` to text, Message Container
  fills, the tail Shape fill, and Apple logo fills. Source-agnostic. Uses `nodes.ts`.

- **`plugin/nodes.ts`** — thin `findText(instance, name)`, `findByName(instance, name)`,
  `findAllByName(instance, predicate)` wrappers using `bubble-schema` names.

- **`plugin/index.ts`** — `figma.showUI`, `setRelaunchData`, post initial selection
  status, subscribe to `selectionchange`, and dispatch `populate` messages: resolve via
  `bubbleSource.resolve()`, then `fillBubble`, then notify.

- **`ui/main.ts`** — wires the DOM: search input (debounced), clear button, selection
  message handler (enable/disable populate), initial `renderDefault()`.

- **`ui/itunes.ts`** — `searchTracks(query, limit): Promise<TrackEntry[]>` (without
  color), `upgradeArtwork(url, size)` (`'100x100'` → e.g. `'600x600'`),
  `fetchArtworkBytes(url): Promise<number[] | null>`.

- **`ui/dominant-color.ts`** — `extractDominantColor(url): Promise<RGB | null>` (fetch →
  bitmap → 60×60 OffscreenCanvas → `pickDominant`). `pickDominant(data:
  Uint8ClampedArray): RGB | null` is PURE: skip alpha < 128 and near-white/near-black
  (avg < 40 or > 215), quantize to 4-bit buckets, return the averaged modal bucket.

- **`ui/recents.ts`** — `RecentsStore` over a `Storage`-like adapter that falls back to
  in-memory if `localStorage` throws (removes the inline shim). `get()`, `add(entry)`
  (dedupe by track+artist, unshift, cap at 5), `clear()`.

- **`ui/render.ts`** — `makeItem(entry, onClick): HTMLElement`,
  `addSection(area, label, onClear?)`. Pure DOM builders.

- **`ui/featured.ts`** — `FEATURED_SEARCHES` list and `loadFeatured(container)`.

## Data flow

1. Plugin starts → `index.ts` shows UI, posts initial `selection` status.
2. `selectionchange` → posts updated `selection` status → UI enables/disables populate.
3. User types → `main.ts` debounces → `itunes.searchTracks` → for each result
   `dominant-color.extractDominantColor` → `render.makeItem` rows.
4. No query → `renderDefault`: recents (if any) else featured via `featured.loadFeatured`.
5. Click result → `main.ts` guards on selection-ok → `itunes.fetchArtworkBytes` (600×600)
   → `recents.add` → `postMessage({ type: 'populate', ... })`.
6. `index.ts` receives `populate` → `bubbleSource.resolve()` → `fillBubble(instance,
   data)` → `figma.notify`.

## Error handling

- Network failures in search / featured / artwork degrade to empty-state messages in the
  UI; the plugin never throws to the user.
- `fillBubble` notifies and returns early if required layers are missing or the resolved
  selection is invalid.
- Missing `dominantColor` skips theming but still sets text and artwork.

## Manifest changes vs. source

```json
{
  "name": "Music Bubble",
  "id": "music-bubble-filler",
  "api": "1.0.0",
  "main": "dist/plugin.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "documentAccess": "dynamic-page",
  "relaunchButtons": [{ "command": "music-bubble-filler", "name": "Music Bubble" }],
  "networkAccess": {
    "allowedDomains": ["https://itunes.apple.com", "https://*.mzstatic.com"],
    "reasoning": "Searches the iTunes API for tracks and loads album artwork."
  }
}
```

`networkAccess` is required — without it, modern Figma blocks the iTunes and artwork
fetches with a CSP error.

## Testing

Vitest unit tests for the pure / near-pure modules:

- `shared/color` — luminance, needsLightText boundaries, darken, toHex (incl. null).
- `plugin/theme` — light artwork → black text + dark logo @ opacity 1; dark artwork →
  white text + white logo @ opacity 0.6.
- `plugin/selection` — empty / multi / non-instance / missing-Song-Name / ok.
- `ui/dominant-color` `pickDominant` — skips transparent + near-white/near-black, returns
  modal bucket average.
- `ui/recents` — add / dedupe / cap-at-5 / clear over a fake storage; in-memory fallback.
- `ui/itunes` — parse results into TrackEntry, upgradeArtwork size swap, fetchArtworkBytes
  with mocked fetch (success + failure → null).
- `ui/render` (jsdom) — makeItem produces expected structure; addSection clear button.

## Build

`build.mjs`:

- esbuild bundle `src/plugin/index.ts` → `dist/plugin.js` (target es2017, format iife,
  bundle, no external).
- esbuild bundle `src/ui/main.ts` to an in-memory IIFE string, inject into `src/ui/ui.html`
  (replacing a `<!-- BUNDLE -->` placeholder before `</body>`), write `dist/ui.html`.
- `--watch` flag uses esbuild contexts to rebuild both on change.

npm scripts: `build`, `watch`, `type-check`, `lint`, `lint:fix`, `style:check`,
`style:write`, `test`, `test:watch`, `test:coverage`.

## Standardization

CI workflow (style check, lint, type-check, test, build); Dependabot (npm +
github-actions, grouped); release-please; `simple-git-hooks` (pre-commit lint-staged,
commit-msg commitlint); `.nvmrc` (22), `.editorconfig`, `.gitignore`, `.prettierrc.yml`,
`.prettierignore`, `.markdownlint.json`, MIT LICENSE, README.
