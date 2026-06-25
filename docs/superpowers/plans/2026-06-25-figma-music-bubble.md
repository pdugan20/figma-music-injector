# Figma Music Bubble Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular, test-first Figma plugin that fills a selected "Music Bubble" component instance with iTunes track data (text, artwork, dominant-color theming).

**Architecture:** Two threads communicate over a typed `postMessage` contract. Pure logic (color math, theme decisions, color extraction, API parsing, recents) lives in isolated, unit-tested modules; thin shells hold the Figma/DOM/fetch calls. Component acquisition is isolated behind a `BubbleSource` seam so a future "build if missing" mode is a drop-in.

**Tech Stack:** TypeScript · esbuild · Vitest (jsdom) · ESLint (flat) + Prettier · Node 22.

## Global Constraints

- Repo: `/Users/patdugan/Documents/GitHub/figma-music-bubble`. Branch `main`.
- Plugin manifest `name`: `Music Bubble`; `id`: `music-bubble-filler`; `editorType`: `["figma"]`; `documentAccess`: `dynamic-page`.
- Manifest MUST include `networkAccess.allowedDomains` = `["https://itunes.apple.com", "https://*.mzstatic.com"]`.
- `RGB` channels are floats 0–1. iTunes pixel thresholds are 0–255.
- No emojis in code/logs/console. Commit messages: conventional-commits, no AI attribution.
- UI is vanilla DOM (no React). Figma requires a single self-contained `dist/ui.html` (UI JS inlined).
- Layer-name contract lives ONLY in `src/plugin/bubble-schema.ts`.
- Node 22 (`.nvmrc`).

---

### Task 1: Scaffolding & build toolchain

**Files:**

- Create: `package.json`, `tsconfig.json`, `tsconfig.eslint.json`, `build.mjs`, `vitest.config.ts`, `eslint.config.mjs`, `.prettierrc.yml`, `.prettierignore`, `.editorconfig`, `.nvmrc`, `manifest.json`, `src/ui/ui.html`, `src/plugin/index.ts` (stub), `src/ui/main.ts` (stub)

**Interfaces:**

- Produces: `npm run build` → `dist/plugin.js` + `dist/ui.html`; `npm test`, `npm run lint`, `npm run type-check` all runnable.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "figma-music-bubble",
  "version": "0.1.0",
  "description": "Figma plugin that fills a Music Bubble component with iTunes track data.",
  "license": "MIT",
  "author": "Patrick Dugan",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node build.mjs",
    "watch": "node build.mjs --watch",
    "type-check": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "style:check": "prettier --check .",
    "style:write": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.3",
    "@figma/eslint-plugin-figma-plugins": "^1.0.0",
    "@figma/plugin-typings": "^1.114.0",
    "@vitest/coverage-v8": "^3.0.0",
    "esbuild": "^0.25.0",
    "eslint": "^9.39.3",
    "eslint-config-prettier": "^10.1.3",
    "globals": "^17.4.0",
    "jsdom": "^26.0.0",
    "prettier": "^3.8.1",
    "typescript": "^5.7.0",
    "typescript-eslint": "^8.57.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "types": ["@figma/plugin-typings"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `tsconfig.eslint.json`**

```json
{ "extends": "./tsconfig.json", "include": ["src/**/*", "*.mjs", "*.ts"] }
```

- [ ] **Step 4: Create `.nvmrc`, `.editorconfig`, `.prettierrc.yml`, `.prettierignore`**

`.nvmrc`:

```text
22
```

`.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

`.prettierrc.yml`:

```yaml
singleQuote: true
semi: false
printWidth: 100
trailingComma: es5
```

`.prettierignore`:

```text
dist
coverage
node_modules
```

- [ ] **Step 5: Create `eslint.config.mjs`**

```js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import figma from '@figma/eslint-plugin-figma-plugins'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { '@figma/figma-plugins': figma },
    rules: { ...figma.configs.recommended.rules },
    languageOptions: { globals: { ...globals.browser } },
  },
  prettier
)
```

- [ ] **Step 6: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [['src/ui/**', 'jsdom']],
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 7: Create `manifest.json`**

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

- [ ] **Step 8: Create `src/ui/ui.html`** — copy the markup + `<style>` from the source `ui.html` verbatim, but REMOVE the inline `<script>` localStorage shim in `<head>` and REMOVE the inline logic `<script>` before `</body>`, and add a `<!-- BUNDLE -->` placeholder where the UI JS will be injected.

```html
<!doctype html>
<html>
  <head>
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
      }
      #plugin-root {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      body {
        display: block;
        font-family: var(--font-family, Inter, sans-serif);
        font-size: 11px;
      }

      .search-row {
        padding: var(--spacer-2, 8px) var(--spacer-3, 12px);
        border-bottom: 1px solid var(--figma-color-border, #e5e5e5);
      }
      .input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      #search-input {
        width: 100%;
        height: 28px;
        padding: 0 40px 0 0;
        border: none;
        background: var(--figma-color-bg, #fff);
        color: var(--figma-color-text, #1a1a1a);
        font-family: var(--font-family, Inter, sans-serif);
        font-size: 11px;
        outline: none;
        box-sizing: border-box;
      }
      #search-input::placeholder {
        color: var(--figma-color-text-secondary, #aaa);
      }

      #clear-btn {
        position: absolute;
        right: 0;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--figma-color-bg-brand, #0d99ff);
        font-size: 11px;
        font-family: var(--font-family, Inter, sans-serif);
        padding: 0;
        line-height: 1;
        display: none;
        white-space: nowrap;
      }
      #clear-btn:hover {
        opacity: 0.75;
      }

      #results-area {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px 4px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--figma-color-text-secondary, #999);
      }
      .section-clear {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--figma-color-bg-brand, #0d99ff);
        font-size: 11px;
        font-family: var(--font-family, Inter, sans-serif);
        font-weight: 400;
        text-transform: none;
        letter-spacing: 0;
        padding: 0;
      }
      .section-clear:hover {
        opacity: 0.75;
      }

      .result-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 12px;
        cursor: pointer;
        position: relative;
        transition: background 0.1s;
      }
      .result-item::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 66px;
        right: 12px;
        height: 1px;
        background: var(--figma-color-border, #e5e5e5);
      }
      .result-item:last-child::after {
        display: none;
      }
      .result-item:hover {
        background: var(--figma-color-bg-secondary, #f5f5f5);
      }

      .artwork-wrap {
        position: relative;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
      }
      .artwork {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        object-fit: cover;
        background: var(--figma-color-bg-secondary, #f0f0f0);
        display: block;
      }
      .color-dot {
        position: absolute;
        bottom: -3px;
        right: -3px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 1.5px solid var(--figma-color-bg, #fff);
      }

      .track-info {
        flex: 1;
        min-width: 0;
      }
      .track-name {
        font-weight: 600;
        color: var(--figma-color-text, #1a1a1a);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .artist-name {
        color: var(--figma-color-text-secondary, #777);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
      }

      .empty-state,
      .loading {
        padding: 16px 12px;
        color: var(--figma-color-text-secondary, #888);
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div id="plugin-root">
      <div class="search-row">
        <div class="input-wrap">
          <input type="text" id="search-input" placeholder="Search artist or song..." />
          <button id="clear-btn">Clear</button>
        </div>
      </div>
      <div id="results-area">
        <div class="loading">Loading&hellip;</div>
      </div>
      <fig-footer>
        <label id="status-label">Select a Music Bubble layer</label>
      </fig-footer>
    </div>
    <!-- BUNDLE -->
  </body>
</html>
```

- [ ] **Step 9: Create stub entry files so the build has something to bundle**

`src/plugin/index.ts`:

```ts
figma.showUI(__html__, { width: 320, height: 480 })
```

`src/ui/main.ts`:

```ts
export {}
```

- [ ] **Step 10: Create `build.mjs`**

```js
import esbuild from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'

const watch = process.argv.includes('--watch')

const pluginOpts = {
  entryPoints: ['src/plugin/index.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2017',
  outfile: 'dist/plugin.js',
}

async function buildUi() {
  const result = await esbuild.build({
    entryPoints: ['src/ui/main.ts'],
    bundle: true,
    format: 'iife',
    target: 'es2017',
    write: false,
  })
  const js = result.outputFiles[0].text
  const template = await readFile('src/ui/ui.html', 'utf8')
  const html = template.replace('<!-- BUNDLE -->', `<script>${js}</script>`)
  await mkdir('dist', { recursive: true })
  await writeFile('dist/ui.html', html)
}

if (watch) {
  const ctx = await esbuild.context(pluginOpts)
  await ctx.watch()
  await buildUi()
  console.log('[watch] built; rebuilding plugin on change (re-run for UI changes)')
} else {
  await esbuild.build(pluginOpts)
  await buildUi()
  console.log('[build] dist/plugin.js + dist/ui.html')
}
```

- [ ] **Step 11: Install and verify build**

Run: `npm install && npm run build`
Expected: `dist/plugin.js` and `dist/ui.html` created; `dist/ui.html` contains a `<script>` (no `<!-- BUNDLE -->`).

- [ ] **Step 12: Verify lint/type/test run**

Run: `npm run type-check && npm run lint && npm test`
Expected: type-check + lint pass; vitest reports "no test files" (exit 0).

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "chore: scaffold plugin toolchain (esbuild, vitest, eslint, manifest)"
```

---

### Task 2: Shared types and color math

**Files:**

- Create: `src/types.ts`, `src/shared/color.ts`, `src/shared/color.test.ts`

**Interfaces:**

- Produces: `RGB`, `TrackEntry`, `SelectionStatus`, `PopulateMessage`, `SelectionMessage` (in `types.ts`); `darken(c: RGB, factor: number): RGB`, `luminance(c: RGB): number`, `needsLightText(bg: RGB): boolean`, `toHex(c: RGB | null): string` (in `shared/color.ts`).

- [ ] **Step 1: Create `src/types.ts`**

```ts
export interface RGB {
  r: number
  g: number
  b: number
}

export interface TrackEntry {
  trackName: string
  artistName: string
  artworkUrl: string
  dominantColor: RGB | null
}

export interface SelectionStatus {
  ok: boolean
  message: string
}

export interface PopulateMessage {
  type: 'populate'
  trackName: string
  artistName: string
  artworkBytes: number[] | null
  dominantColor: RGB | null
}

export interface SelectionMessage {
  type: 'selection'
  status: SelectionStatus
}
```

- [ ] **Step 2: Write the failing test** — `src/shared/color.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { darken, luminance, needsLightText, toHex } from './color'

describe('color', () => {
  it('darken scales each channel', () => {
    expect(darken({ r: 1, g: 0.5, b: 0.2 }, 0.5)).toEqual({ r: 0.5, g: 0.25, b: 0.1 })
  })

  it('luminance is higher for white than black', () => {
    expect(luminance({ r: 1, g: 1, b: 1 })).toBeGreaterThan(luminance({ r: 0, g: 0, b: 0 }))
  })

  it('needsLightText is true on a dark background', () => {
    expect(needsLightText({ r: 0.05, g: 0.05, b: 0.05 })).toBe(true)
  })

  it('needsLightText is false on a light background', () => {
    expect(needsLightText({ r: 0.95, g: 0.95, b: 0.95 })).toBe(false)
  })

  it('toHex formats 0-1 channels and falls back for null', () => {
    expect(toHex({ r: 1, g: 0, b: 0 })).toBe('#ff0000')
    expect(toHex(null)).toBe('#ccc')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/shared/color.test.ts`
Expected: FAIL — `./color` not found.

- [ ] **Step 4: Create `src/shared/color.ts`**

```ts
import { RGB } from '../types'

export function darken(c: RGB, factor: number): RGB {
  return { r: c.r * factor, g: c.g * factor, b: c.b * factor }
}

export function luminance(c: RGB): number {
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
}

export function needsLightText(bg: RGB): boolean {
  const l = luminance(bg)
  const contrastWhite = 1.05 / (l + 0.05)
  const contrastBlack = (l + 0.05) / 0.05
  return contrastWhite > contrastBlack
}

export function toHex(color: RGB | null): string {
  if (!color) return '#ccc'
  return (
    '#' +
    [color.r, color.g, color.b]
      .map((v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/shared/color.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/shared/color.ts src/shared/color.test.ts
git commit -m "feat: add shared RGB types and color math"
```

---

### Task 3: Bubble theme decisions

**Files:**

- Create: `src/plugin/theme.ts`, `src/plugin/theme.test.ts`

**Interfaces:**

- Consumes: `RGB` (types), `darken`, `needsLightText` (shared/color).
- Produces: `BubbleTheme { primary: RGB; dark: RGB; textColor: RGB; logoColor: RGB; logoOpacity: number }`; `computeBubbleTheme(dominant: RGB): BubbleTheme`.

- [ ] **Step 1: Write the failing test** — `src/plugin/theme.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { computeBubbleTheme } from './theme'

describe('computeBubbleTheme', () => {
  it('dark artwork -> white text and translucent white logo', () => {
    const t = computeBubbleTheme({ r: 0.1, g: 0.1, b: 0.1 })
    expect(t.textColor).toEqual({ r: 1, g: 1, b: 1 })
    expect(t.logoColor).toEqual({ r: 1, g: 1, b: 1 })
    expect(t.logoOpacity).toBe(0.6)
  })

  it('light artwork -> black text, darkened logo at full opacity', () => {
    const t = computeBubbleTheme({ r: 0.9, g: 0.9, b: 0.9 })
    expect(t.textColor).toEqual({ r: 0, g: 0, b: 0 })
    expect(t.logoOpacity).toBe(1)
    expect(t.logoColor.r).toBeCloseTo(0.9 * 0.65, 5)
  })

  it('primary equals the input color', () => {
    expect(computeBubbleTheme({ r: 0.2, g: 0.4, b: 0.6 }).primary).toEqual({
      r: 0.2,
      g: 0.4,
      b: 0.6,
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/plugin/theme.test.ts`
Expected: FAIL — `./theme` not found.

- [ ] **Step 3: Create `src/plugin/theme.ts`**

```ts
import { RGB } from '../types'
import { darken, needsLightText } from '../shared/color'

export interface BubbleTheme {
  primary: RGB
  dark: RGB
  textColor: RGB
  logoColor: RGB
  logoOpacity: number
}

export function computeBubbleTheme(dominant: RGB): BubbleTheme {
  const primary = dominant
  const dark = darken(primary, 0.65)
  const lightText = needsLightText(primary)
  const textColor: RGB = lightText ? { r: 1, g: 1, b: 1 } : { r: 0, g: 0, b: 0 }
  const logoColor: RGB = lightText ? { r: 1, g: 1, b: 1 } : dark
  const logoOpacity = lightText ? 0.6 : 1
  return { primary, dark, textColor, logoColor, logoOpacity }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/plugin/theme.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/theme.ts src/plugin/theme.test.ts
git commit -m "feat: add bubble theme decision logic"
```

---

### Task 4: Layer schema and selection status

**Files:**

- Create: `src/plugin/bubble-schema.ts`, `src/plugin/selection.ts`, `src/plugin/selection.test.ts`

**Interfaces:**

- Produces: `LAYER` constants; `getSelectionStatus(selection: readonly SceneNode[]): SelectionStatus`.

- [ ] **Step 1: Create `src/plugin/bubble-schema.ts`**

```ts
export const LAYER = {
  SONG_NAME: 'Song Name',
  ARTIST_NAME: 'Artist Name',
  ALBUM_ART: 'Album Art',
  MESSAGE_CONTAINER: 'Message Container',
  TAIL: 'Shape',
  APPLE_LOGO: ['Apple Logo', 'Apple'] as readonly string[],
} as const
```

- [ ] **Step 2: Write the failing test** — `src/plugin/selection.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { getSelectionStatus } from './selection'

function instanceWithSong() {
  return {
    type: 'INSTANCE',
    findOne: (p: (n: { name: string }) => boolean) => (p({ name: 'Song Name' }) ? {} : null),
  }
}

describe('getSelectionStatus', () => {
  it('empty selection', () => {
    expect(getSelectionStatus([] as never).message).toBe('Select a Music Bubble layer')
  })

  it('multiple selection', () => {
    expect(getSelectionStatus([{}, {}] as never).message).toBe('Select a single Music Bubble layer')
  })

  it('non-instance', () => {
    expect(getSelectionStatus([{ type: 'RECTANGLE' }] as never).ok).toBe(false)
  })

  it('instance missing Song Name', () => {
    const node = { type: 'INSTANCE', findOne: () => null }
    expect(getSelectionStatus([node] as never).ok).toBe(false)
  })

  it('valid Music Bubble instance', () => {
    const status = getSelectionStatus([instanceWithSong()] as never)
    expect(status.ok).toBe(true)
    expect(status.message).toBe('1 layer selected')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/plugin/selection.test.ts`
Expected: FAIL — `./selection` not found.

- [ ] **Step 4: Create `src/plugin/selection.ts`**

```ts
import { SelectionStatus } from '../types'
import { LAYER } from './bubble-schema'

export function getSelectionStatus(selection: readonly SceneNode[]): SelectionStatus {
  if (selection.length === 0) return { ok: false, message: 'Select a Music Bubble layer' }
  if (selection.length > 1) return { ok: false, message: 'Select a single Music Bubble layer' }
  const node = selection[0]
  if (node.type !== 'INSTANCE') return { ok: false, message: 'Select a Music Bubble instance' }
  const songName = node.findOne((n) => n.name === LAYER.SONG_NAME)
  if (!songName) return { ok: false, message: 'Select a Music Bubble instance' }
  return { ok: true, message: '1 layer selected' }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/plugin/selection.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/plugin/bubble-schema.ts src/plugin/selection.ts src/plugin/selection.test.ts
git commit -m "feat: add layer schema and selection status"
```

---

### Task 5: Bubble source seam and plugin meta

**Files:**

- Create: `src/plugin/meta.ts`, `src/plugin/bubble-source.ts`, `src/plugin/bubble-source.test.ts`

**Interfaces:**

- Consumes: `getSelectionStatus` (selection).
- Produces: `TOOL_ID`, `DISPLAY_NAME` (meta); `BubbleResolution = { ok: true; instance: InstanceNode } | { ok: false; message: string }`; `interface BubbleSource { resolve(): BubbleResolution }`; `SelectionBubbleSource` class.

- [ ] **Step 1: Create `src/plugin/meta.ts`**

```ts
export const TOOL_ID = 'music-bubble-filler'
export const DISPLAY_NAME = 'Music Bubble'
```

- [ ] **Step 2: Write the failing test** — `src/plugin/bubble-source.test.ts`

```ts
import { describe, it, expect, afterEach } from 'vitest'
import { SelectionBubbleSource } from './bubble-source'

function setSelection(selection: unknown[]) {
  ;(globalThis as { figma?: unknown }).figma = { currentPage: { selection } }
}

afterEach(() => {
  delete (globalThis as { figma?: unknown }).figma
})

describe('SelectionBubbleSource', () => {
  it('resolves the selected Music Bubble instance', () => {
    const instance = { type: 'INSTANCE', findOne: () => ({}) }
    setSelection([instance])
    expect(new SelectionBubbleSource().resolve()).toEqual({ ok: true, instance })
  })

  it('fails with a message when selection is invalid', () => {
    setSelection([])
    const res = new SelectionBubbleSource().resolve()
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe('Select a Music Bubble layer')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/plugin/bubble-source.test.ts`
Expected: FAIL — `./bubble-source` not found.

- [ ] **Step 4: Create `src/plugin/bubble-source.ts`**

```ts
import { getSelectionStatus } from './selection'

export type BubbleResolution = { ok: true; instance: InstanceNode } | { ok: false; message: string }

export interface BubbleSource {
  resolve(): BubbleResolution
}

export class SelectionBubbleSource implements BubbleSource {
  resolve(): BubbleResolution {
    const selection = figma.currentPage.selection
    const status = getSelectionStatus(selection)
    if (!status.ok) return { ok: false, message: status.message }
    return { ok: true, instance: selection[0] as InstanceNode }
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/plugin/bubble-source.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/plugin/meta.ts src/plugin/bubble-source.ts src/plugin/bubble-source.test.ts
git commit -m "feat: add bubble source seam"
```

---

### Task 6: Node helpers and fill operation

**Files:**

- Create: `src/plugin/nodes.ts`, `src/plugin/fill.ts`, `src/plugin/fill.test.ts`

**Interfaces:**

- Consumes: `LAYER` (bubble-schema), `computeBubbleTheme` (theme), `TOOL_ID`/`DISPLAY_NAME` (meta), `PopulateMessage`/`RGB` (types).
- Produces: `replaceSolidFill(node, color, opacity?)` (nodes); `fillBubble(instance: InstanceNode, data: PopulateMessage): Promise<boolean>` (fill).

- [ ] **Step 1: Create `src/plugin/nodes.ts`**

```ts
import { RGB } from '../types'

type FillableNode = SceneNode & { fills: readonly Paint[] | typeof figma.mixed }

export function replaceSolidFill(node: FillableNode, color: RGB, opacity = 1): void {
  const current = node.fills
  if (current === figma.mixed || !Array.isArray(current)) return
  const fills = (current as Paint[]).slice()
  const idx = fills.findIndex((f) => f.type === 'SOLID')
  if (idx < 0) return
  fills[idx] = { type: 'SOLID', color, opacity }
  node.fills = fills
}
```

- [ ] **Step 2: Write the failing test** — `src/plugin/fill.test.ts`

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fillBubble } from './fill'
import { PopulateMessage } from '../types'

function textNode(name: string) {
  return {
    name,
    type: 'TEXT',
    characters: '',
    fontName: { family: 'Inter', style: 'Regular' },
    fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 }],
  }
}

function buildInstance() {
  const song = textNode('Song Name')
  const artist = textNode('Artist Name')
  const albumArt = { name: 'Album Art', type: 'RECTANGLE', fills: [] as unknown[] }
  const nodes: Record<string, unknown> = { song, artist, albumArt }
  return {
    nodes,
    instance: {
      setRelaunchData: vi.fn(),
      findOne: (p: (n: { name: string; type: string }) => boolean) =>
        [song, artist, albumArt].find((n) => p(n)) ?? null,
      findAll: () => [],
    },
  }
}

beforeEach(() => {
  ;(globalThis as { figma?: unknown }).figma = {
    mixed: Symbol('mixed'),
    loadFontAsync: vi.fn().mockResolvedValue(undefined),
    createImage: vi.fn(() => ({ hash: 'abc' })),
    notify: vi.fn(),
  }
})

const data: PopulateMessage = {
  type: 'populate',
  trackName: 'Shake It Off',
  artistName: 'Taylor Swift',
  artworkBytes: [1, 2, 3],
  dominantColor: { r: 0.1, g: 0.1, b: 0.1 },
}

describe('fillBubble', () => {
  it('sets text characters and returns true', async () => {
    const { nodes, instance } = buildInstance()
    const ok = await fillBubble(instance as never, data)
    expect(ok).toBe(true)
    expect((nodes.song as { characters: string }).characters).toBe('Shake It Off')
    expect((nodes.artist as { characters: string }).characters).toBe('Taylor Swift')
  })

  it('applies an image fill from artwork bytes', async () => {
    const { nodes, instance } = buildInstance()
    await fillBubble(instance as never, data)
    const fills = (nodes.albumArt as { fills: { type: string }[] }).fills
    expect(fills.some((f) => f.type === 'IMAGE')).toBe(true)
  })

  it('returns false when required layers are missing', async () => {
    const instance = { findOne: () => null, findAll: () => [], setRelaunchData: vi.fn() }
    expect(await fillBubble(instance as never, data)).toBe(false)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/plugin/fill.test.ts`
Expected: FAIL — `./fill` not found.

- [ ] **Step 4: Create `src/plugin/fill.ts`**

```ts
import { PopulateMessage } from '../types'
import { LAYER } from './bubble-schema'
import { computeBubbleTheme } from './theme'
import { replaceSolidFill } from './nodes'
import { TOOL_ID, DISPLAY_NAME } from './meta'

export async function fillBubble(instance: InstanceNode, data: PopulateMessage): Promise<boolean> {
  const songNode = instance.findOne(
    (n) => n.name === LAYER.SONG_NAME && n.type === 'TEXT'
  ) as TextNode | null
  const artistNode = instance.findOne(
    (n) => n.name === LAYER.ARTIST_NAME && n.type === 'TEXT'
  ) as TextNode | null
  const albumArtNode = instance.findOne((n) => n.name === LAYER.ALBUM_ART) as RectangleNode | null

  if (!songNode || !artistNode || !albumArtNode) return false

  await figma.loadFontAsync(songNode.fontName as FontName)
  await figma.loadFontAsync(artistNode.fontName as FontName)

  songNode.characters = data.trackName
  artistNode.characters = data.artistName

  if (data.artworkBytes) {
    const image = figma.createImage(new Uint8Array(data.artworkBytes))
    const fills = (albumArtNode.fills as Paint[]).slice()
    const existingIdx = fills.findIndex((f) => f.type === 'IMAGE')
    const newFill: ImagePaint = { type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }
    if (existingIdx >= 0) fills[existingIdx] = newFill
    else fills.push(newFill)
    albumArtNode.fills = fills
  }

  if (data.dominantColor) {
    const theme = computeBubbleTheme(data.dominantColor)

    replaceSolidFill(songNode, theme.textColor, 1)
    replaceSolidFill(artistNode, theme.textColor, 1)

    const containers = instance.findAll(
      (n) => n.name === LAYER.MESSAGE_CONTAINER && 'fills' in n
    ) as SceneNode[]
    for (const container of containers) {
      replaceSolidFill(container as SceneNode & { fills: readonly Paint[] }, theme.primary, 1)
    }

    const tail = instance.findOne((n) => n.name === LAYER.TAIL && 'fills' in n) as SceneNode | null
    if (tail) replaceSolidFill(tail as SceneNode & { fills: readonly Paint[] }, theme.primary, 1)

    const logos = instance.findAll(
      (n) => LAYER.APPLE_LOGO.includes(n.name) && n.type === 'TEXT'
    ) as TextNode[]
    for (const logo of logos) replaceSolidFill(logo, theme.logoColor, theme.logoOpacity)
  }

  instance.setRelaunchData({ [TOOL_ID]: DISPLAY_NAME })
  return true
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/plugin/fill.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/plugin/nodes.ts src/plugin/fill.ts src/plugin/fill.test.ts
git commit -m "feat: add node fill helpers and fillBubble operation"
```

---

### Task 7: Plugin entry (composition root)

**Files:**

- Modify: `src/plugin/index.ts`

**Interfaces:**

- Consumes: `getSelectionStatus` (selection), `SelectionBubbleSource` (bubble-source), `fillBubble` (fill), `TOOL_ID`/`DISPLAY_NAME` (meta), `PopulateMessage` (types).

- [ ] **Step 1: Replace `src/plugin/index.ts`**

```ts
import { PopulateMessage } from '../types'
import { getSelectionStatus } from './selection'
import { SelectionBubbleSource } from './bubble-source'
import { fillBubble } from './fill'
import { TOOL_ID, DISPLAY_NAME } from './meta'

const bubbleSource = new SelectionBubbleSource()

figma.showUI(__html__, { width: 320, height: 480 })
figma.root.setRelaunchData({ [TOOL_ID]: DISPLAY_NAME })

function postSelection() {
  figma.ui.postMessage({
    type: 'selection',
    status: getSelectionStatus(figma.currentPage.selection),
  })
}

postSelection()
figma.on('selectionchange', postSelection)

figma.ui.onmessage = async (msg: PopulateMessage) => {
  if (msg.type !== 'populate') return
  const resolved = bubbleSource.resolve()
  if (!resolved.ok) {
    figma.notify(resolved.message)
    return
  }
  const filled = await fillBubble(resolved.instance, msg)
  if (!filled) {
    figma.notify('Could not find the expected layers in this Music Bubble')
    return
  }
  figma.notify(`Populated with "${msg.trackName}" by ${msg.artistName}`)
}
```

- [ ] **Step 2: Verify type-check, lint, build**

Run: `npm run type-check && npm run lint && npm run build`
Expected: PASS; `dist/plugin.js` rebuilt. If the figma-plugins ESLint rule flags `findOne`/`findAll` (dynamic-page advice) in `selection.ts`/`fill.ts`, add `/* eslint-disable @figma/figma-plugins/dynamic-page-find-method-advice */` at the top of those two files (the current page is always loaded).

- [ ] **Step 3: Commit**

```bash
git add src/plugin/index.ts src/plugin/selection.ts src/plugin/fill.ts
git commit -m "feat: wire plugin entry to source, fill, and notify"
```

---

### Task 8: Recents store

**Files:**

- Create: `src/ui/recents.ts`, `src/ui/recents.test.ts`

**Interfaces:**

- Consumes: `TrackEntry` (types).
- Produces: `interface KeyValueStore { getItem; setItem; removeItem }`; `createStore(): KeyValueStore`; `class RecentsStore { constructor(store); get(): TrackEntry[]; add(entry): void; clear(): void }`.

- [ ] **Step 1: Write the failing test** — `src/ui/recents.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { RecentsStore, KeyValueStore } from './recents'
import { TrackEntry } from '../types'

function fakeStore(): KeyValueStore {
  const map = new Map<string, string>()
  return {
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

function entry(name: string): TrackEntry {
  return { trackName: name, artistName: 'A', artworkUrl: '', dominantColor: null }
}

describe('RecentsStore', () => {
  it('adds newest first', () => {
    const r = new RecentsStore(fakeStore())
    r.add(entry('one'))
    r.add(entry('two'))
    expect(r.get().map((e) => e.trackName)).toEqual(['two', 'one'])
  })

  it('dedupes by track + artist', () => {
    const r = new RecentsStore(fakeStore())
    r.add(entry('one'))
    r.add(entry('one'))
    expect(r.get()).toHaveLength(1)
  })

  it('caps at 5', () => {
    const r = new RecentsStore(fakeStore())
    for (const n of ['a', 'b', 'c', 'd', 'e', 'f']) r.add(entry(n))
    expect(r.get()).toHaveLength(5)
    expect(r.get()[0].trackName).toBe('f')
  })

  it('clears', () => {
    const r = new RecentsStore(fakeStore())
    r.add(entry('one'))
    r.clear()
    expect(r.get()).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/recents.test.ts`
Expected: FAIL — `./recents` not found.

- [ ] **Step 3: Create `src/ui/recents.ts`**

```ts
import { TrackEntry } from '../types'

const RECENTS_KEY = 'music-bubble:recents'
const MAX_RECENTS = 5

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function createStore(): KeyValueStore {
  try {
    window.localStorage.getItem('__probe__')
    return window.localStorage
  } catch {
    const map = new Map<string, string>()
    return {
      getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
      setItem: (k, v) => void map.set(k, String(v)),
      removeItem: (k) => void map.delete(k),
    }
  }
}

export class RecentsStore {
  constructor(private store: KeyValueStore) {}

  get(): TrackEntry[] {
    try {
      return JSON.parse(this.store.getItem(RECENTS_KEY) || '[]') as TrackEntry[]
    } catch {
      return []
    }
  }

  add(entry: TrackEntry): void {
    const list = this.get().filter(
      (r) => !(r.trackName === entry.trackName && r.artistName === entry.artistName)
    )
    list.unshift(entry)
    this.store.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)))
  }

  clear(): void {
    this.store.removeItem(RECENTS_KEY)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/recents.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/recents.ts src/ui/recents.test.ts
git commit -m "feat: add recents store with storage fallback"
```

---

### Task 9: Dominant color extraction

**Files:**

- Create: `src/ui/dominant-color.ts`, `src/ui/dominant-color.test.ts`

**Interfaces:**

- Consumes: `RGB` (types).
- Produces: `pickDominant(data: Uint8ClampedArray): RGB | null`; `extractDominantColor(url: string): Promise<RGB | null>`.

- [ ] **Step 1: Write the failing test** — `src/ui/dominant-color.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { pickDominant } from './dominant-color'

function pixels(rows: [number, number, number, number][]): Uint8ClampedArray {
  return new Uint8ClampedArray(rows.flat())
}

describe('pickDominant', () => {
  it('returns null when all pixels are filtered out', () => {
    // transparent, near-black, near-white
    expect(
      pickDominant(
        pixels([
          [120, 120, 120, 0],
          [10, 10, 10, 255],
          [250, 250, 250, 255],
        ])
      )
    ).toBeNull()
  })

  it('returns the modal mid-tone bucket as 0-1 channels', () => {
    const data = pixels([
      [100, 50, 50, 255],
      [100, 50, 50, 255],
      [100, 50, 50, 255],
      [60, 180, 90, 255],
    ])
    const c = pickDominant(data)
    expect(c).not.toBeNull()
    expect(c!.r).toBeCloseTo(100 / 255, 5)
    expect(c!.g).toBeCloseTo(50 / 255, 5)
    expect(c!.b).toBeCloseTo(50 / 255, 5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/dominant-color.test.ts`
Expected: FAIL — `./dominant-color` not found.

- [ ] **Step 3: Create `src/ui/dominant-color.ts`**

```ts
import { RGB } from '../types'

export function pickDominant(data: Uint8ClampedArray): RGB | null {
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const avg = (r + g + b) / 3
    if (avg < 40 || avg > 215) continue
    const key = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4)
    const bkt = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 }
    bkt.r += r
    bkt.g += g
    bkt.b += b
    bkt.n++
    buckets.set(key, bkt)
  }
  const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0]
  if (!top) return null
  return { r: top.r / top.n / 255, g: top.g / top.n / 255, b: top.b / top.n / 255 }
}

export async function extractDominantColor(url: string): Promise<RGB | null> {
  try {
    const blob = await (await fetch(url)).blob()
    const bmp = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(60, 60)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bmp, 0, 0, 60, 60)
    const { data } = ctx.getImageData(0, 0, 60, 60)
    return pickDominant(data)
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/dominant-color.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/dominant-color.ts src/ui/dominant-color.test.ts
git commit -m "feat: add dominant color extraction"
```

---

### Task 10: iTunes search client

**Files:**

- Create: `src/ui/itunes.ts`, `src/ui/itunes.test.ts`

**Interfaces:**

- Consumes: `TrackEntry` (types).
- Produces: `upgradeArtwork(url: string, size?: string): string`; `searchTracks(query: string, limit?: number): Promise<TrackEntry[]>`; `fetchArtworkBytes(artworkUrl: string): Promise<number[] | null>`.

- [ ] **Step 1: Write the failing test** — `src/ui/itunes.test.ts`

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { upgradeArtwork, searchTracks, fetchArtworkBytes } from './itunes'

afterEach(() => vi.restoreAllMocks())

describe('itunes', () => {
  it('upgradeArtwork swaps the 100x100 segment', () => {
    expect(upgradeArtwork('https://x/100x100bb.jpg')).toBe('https://x/200x200bb.jpg')
    expect(upgradeArtwork('https://x/100x100bb.jpg', '600x600')).toBe('https://x/600x600bb.jpg')
  })

  it('searchTracks maps results to TrackEntry with 200x200 art and null color', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          results: [{ trackName: 'T', artistName: 'A', artworkUrl100: 'https://x/100x100bb.jpg' }],
        }),
      })
    )
    const tracks = await searchTracks('q')
    expect(tracks).toEqual([
      {
        trackName: 'T',
        artistName: 'A',
        artworkUrl: 'https://x/200x200bb.jpg',
        dominantColor: null,
      },
    ])
  })

  it('fetchArtworkBytes returns a byte array on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer })
    )
    expect(await fetchArtworkBytes('https://x/200x200bb.jpg')).toEqual([1, 2, 3])
  })

  it('fetchArtworkBytes returns null on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')))
    expect(await fetchArtworkBytes('https://x/200x200bb.jpg')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/itunes.test.ts`
Expected: FAIL — `./itunes` not found.

- [ ] **Step 3: Create `src/ui/itunes.ts`**

```ts
import { TrackEntry } from '../types'

const SEARCH_URL = 'https://itunes.apple.com/search'

interface ITunesTrack {
  trackName?: string
  artistName?: string
  artworkUrl100?: string
}

export function upgradeArtwork(url: string, size = '200x200'): string {
  return (url || '').replace('100x100', size)
}

export async function searchTracks(query: string, limit = 12): Promise<TrackEntry[]> {
  const url = `${SEARCH_URL}?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`
  const res = await fetch(url)
  const json = (await res.json()) as { results?: ITunesTrack[] }
  return (json.results || []).map((t) => ({
    trackName: t.trackName || '',
    artistName: t.artistName || '',
    artworkUrl: upgradeArtwork(t.artworkUrl100 || ''),
    dominantColor: null,
  }))
}

export async function fetchArtworkBytes(artworkUrl: string): Promise<number[] | null> {
  try {
    const hi = artworkUrl.replace('200x200', '600x600')
    const buf = await (await fetch(hi)).arrayBuffer()
    return Array.from(new Uint8Array(buf))
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/itunes.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/itunes.ts src/ui/itunes.test.ts
git commit -m "feat: add iTunes search client"
```

---

### Task 11: DOM render helpers

**Files:**

- Create: `src/ui/render.ts`, `src/ui/render.test.ts`

**Interfaces:**

- Consumes: `TrackEntry` (types), `toHex` (shared/color).
- Produces: `makeItem(entry: TrackEntry, onClick: () => void): HTMLElement`; `addSection(area: HTMLElement, label: string, onClear?: () => void): HTMLElement`.

- [ ] **Step 1: Write the failing test** — `src/ui/render.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import { makeItem, addSection } from './render'
import { TrackEntry } from '../types'

const entry: TrackEntry = {
  trackName: 'Song',
  artistName: 'Artist',
  artworkUrl: 'https://x/200x200bb.jpg',
  dominantColor: { r: 1, g: 0, b: 0 },
}

describe('render', () => {
  it('makeItem builds a row with track + artist and fires onClick', () => {
    const onClick = vi.fn()
    const el = makeItem(entry, onClick)
    expect(el.querySelector('.track-name')!.textContent).toBe('Song')
    expect(el.querySelector('.artist-name')!.textContent).toBe('Artist')
    el.dispatchEvent(new MouseEvent('click'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('addSection renders a header and returns the list container', () => {
    const area = document.createElement('div')
    const onClear = vi.fn()
    const list = addSection(area, 'Recently used', onClear)
    expect(area.querySelector('.section-header span')!.textContent).toBe('Recently used')
    area.querySelector<HTMLButtonElement>('.section-clear')!.click()
    expect(onClear).toHaveBeenCalledOnce()
    expect(list.classList.contains('results-list')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/render.test.ts`
Expected: FAIL — `./render` not found.

- [ ] **Step 3: Create `src/ui/render.ts`**

```ts
import { TrackEntry } from '../types'
import { toHex } from '../shared/color'

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function makeItem(entry: TrackEntry, onClick: () => void): HTMLElement {
  const item = document.createElement('div')
  item.className = 'result-item'
  item.innerHTML = `
    <div class="artwork-wrap">
      <img class="artwork" src="${escHtml(entry.artworkUrl)}" alt="" />
      <div class="color-dot" style="background:${toHex(entry.dominantColor)}"></div>
    </div>
    <div class="track-info">
      <div class="track-name">${escHtml(entry.trackName)}</div>
      <div class="artist-name">${escHtml(entry.artistName)}</div>
    </div>`
  item.addEventListener('click', onClick)
  return item
}

export function addSection(area: HTMLElement, label: string, onClear?: () => void): HTMLElement {
  const header = document.createElement('div')
  header.className = 'section-header'
  const title = document.createElement('span')
  title.textContent = label
  header.appendChild(title)
  if (onClear) {
    const btn = document.createElement('button')
    btn.className = 'section-clear'
    btn.textContent = 'Clear'
    btn.addEventListener('click', onClear)
    header.appendChild(btn)
  }
  area.appendChild(header)
  const list = document.createElement('div')
  list.className = 'results-list'
  area.appendChild(list)
  return list
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/render.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/render.ts src/ui/render.test.ts
git commit -m "feat: add DOM render helpers"
```

---

### Task 12: Featured tracks

**Files:**

- Create: `src/ui/featured.ts`

**Interfaces:**

- Consumes: `TrackEntry`/`RGB` (types), `searchTracks` (itunes), `extractDominantColor` (dominant-color).
- Produces: `FEATURED_SEARCHES: string[]`; `loadFeatured(): Promise<TrackEntry[]>`.

- [ ] **Step 1: Create `src/ui/featured.ts`**

```ts
import { RGB, TrackEntry } from '../types'
import { searchTracks } from './itunes'
import { extractDominantColor } from './dominant-color'

export const FEATURED_SEARCHES = [
  'Taylor Swift Shake It Off',
  'Olivia Rodrigo good 4 u',
  'Weezer Island in the Sun',
  'Nirvana Come As You Are',
  'Beastie Boys Intergalactic',
  'Radiohead Let Down',
]

export async function loadFeatured(): Promise<TrackEntry[]> {
  const settled = await Promise.allSettled(
    FEATURED_SEARCHES.map(async (term) => {
      const results = await searchTracks(term, 1)
      if (!results[0]) throw new Error('no result')
      return results[0]
    })
  )
  const tracks = settled
    .filter((r): r is PromiseFulfilledResult<TrackEntry> => r.status === 'fulfilled')
    .map((r) => r.value)

  const colors = await Promise.allSettled(
    tracks.map((t) => (t.artworkUrl ? extractDominantColor(t.artworkUrl) : Promise.resolve(null)))
  )

  return tracks.map((t, i) => {
    const c = colors[i]
    const dominantColor: RGB | null = c.status === 'fulfilled' ? c.value : null
    return { ...t, dominantColor }
  })
}
```

- [ ] **Step 2: Verify type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/ui/featured.ts
git commit -m "feat: add featured tracks loader"
```

---

### Task 13: UI controller (composition root) and final build

**Files:**

- Modify: `src/ui/main.ts`

**Interfaces:**

- Consumes: `TrackEntry`/`SelectionMessage`/`PopulateMessage` (types), `searchTracks`/`fetchArtworkBytes` (itunes), `extractDominantColor` (dominant-color), `RecentsStore`/`createStore` (recents), `makeItem`/`addSection` (render), `loadFeatured` (featured).

- [ ] **Step 1: Replace `src/ui/main.ts`**

```ts
import { PopulateMessage, SelectionMessage, TrackEntry } from '../types'
import { searchTracks, fetchArtworkBytes } from './itunes'
import { extractDominantColor } from './dominant-color'
import { RecentsStore, createStore } from './recents'
import { makeItem, addSection } from './render'
import { loadFeatured } from './featured'

const recents = new RecentsStore(createStore())
let canPopulate = false

const searchInput = document.getElementById('search-input') as HTMLInputElement
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement
const resultsArea = document.getElementById('results-area') as HTMLElement
const statusLabel = document.getElementById('status-label') as HTMLElement
let debounceTimer: ReturnType<typeof setTimeout> | undefined

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage as SelectionMessage | undefined
  if (!msg || msg.type !== 'selection') return
  canPopulate = msg.status.ok
  statusLabel.textContent = msg.status.message
}

function selectEntry(entry: TrackEntry): void {
  if (!canPopulate) return
  void (async () => {
    const artworkBytes = await fetchArtworkBytes(entry.artworkUrl)
    recents.add(entry)
    const message: PopulateMessage = {
      type: 'populate',
      trackName: entry.trackName,
      artistName: entry.artistName,
      artworkBytes,
      dominantColor: entry.dominantColor,
    }
    parent.postMessage({ pluginMessage: message }, '*')
  })()
}

function renderEntries(container: HTMLElement, entries: TrackEntry[]): void {
  entries.forEach((entry) => container.appendChild(makeItem(entry, () => selectEntry(entry))))
}

async function renderDefault(): Promise<void> {
  resultsArea.innerHTML = ''
  const recent = recents.get()
  if (recent.length > 0) {
    const list = addSection(resultsArea, 'Recently used', () => {
      recents.clear()
      void renderDefault()
    })
    renderEntries(list, recent)
    return
  }
  const list = addSection(resultsArea, 'Featured')
  list.innerHTML =
    '<div class="loading" style="text-align:left;padding:8px 12px;">Loading&hellip;</div>'
  const featured = await loadFeatured()
  list.innerHTML = ''
  if (!featured.length) {
    list.innerHTML = '<div class="empty-state">Could not load featured tracks</div>'
    return
  }
  renderEntries(list, featured)
}

async function doSearch(): Promise<void> {
  const query = searchInput.value.trim()
  if (!query) return
  resultsArea.innerHTML = '<div class="loading">Searching&hellip;</div>'
  try {
    const tracks = await searchTracks(query)
    if (!tracks.length) {
      resultsArea.innerHTML = '<div class="empty-state">No results found</div>'
      return
    }
    const colors = await Promise.all(
      tracks.map((t) => (t.artworkUrl ? extractDominantColor(t.artworkUrl) : Promise.resolve(null)))
    )
    resultsArea.innerHTML = ''
    const list = document.createElement('div')
    list.className = 'results-list'
    tracks.forEach((t, i) => {
      const entry: TrackEntry = { ...t, dominantColor: colors[i] }
      list.appendChild(makeItem(entry, () => selectEntry(entry)))
    })
    resultsArea.appendChild(list)
  } catch {
    resultsArea.innerHTML = '<div class="empty-state">Search failed — check your connection</div>'
  }
}

function scheduleSearch(): void {
  clearBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none'
  const query = searchInput.value.trim()
  if (!query) {
    void renderDefault()
    return
  }
  if (query.length < 2) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void doSearch(), 350)
}

clearBtn.addEventListener('click', () => {
  searchInput.value = ''
  clearBtn.style.display = 'none'
  clearTimeout(debounceTimer)
  void renderDefault()
  searchInput.focus()
})

searchInput.addEventListener('input', scheduleSearch)
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    clearTimeout(debounceTimer)
    void doSearch()
  }
})

void renderDefault()
```

- [ ] **Step 2: Build, type-check, lint, full test run**

Run: `npm run type-check && npm run lint && npm test && npm run build`
Expected: all PASS; `dist/ui.html` contains the inlined bundle and references `#search-input`.

- [ ] **Step 3: Manual verification in Figma**

In Figma desktop: Plugins → Development → Import plugin from manifest → select `manifest.json`. Open a file containing a Music Bubble component, select an instance, run "Music Bubble", search a song, click a result. Expected: text, artwork, and color theming populate; toast confirms.

- [ ] **Step 4: Commit**

```bash
git add src/ui/main.ts
git commit -m "feat: add UI controller wiring search, recents, and populate"
```

---

### Task 14: Repo standardization

**Files:**

- Create: `.github/workflows/ci.yml`, `.github/workflows/dependabot-auto-merge.yml`, `.github/dependabot.yml`, `release-please-config.json`, `.release-please-manifest.json`, `commitlint.config.js`, `.markdownlint.json`, `LICENSE`, `README.md`
- Modify: `package.json` (add hooks + lint-staged deps and config)

**Interfaces:**

- Produces: green CI; release automation; commit hooks.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Set up Node
        uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run Prettier check
        run: npm run style:check
      - name: Run ESLint
        run: npm run lint
      - name: Run TypeScript type check
        run: npm run type-check
      - name: Run tests
        run: npm test
      - name: Build plugin
        run: npm run build
```

- [ ] **Step 2: Create `.github/dependabot.yml`** — copy the grouped npm + github-actions config from `figma-slides-progress-meter/.github/dependabot.yml` verbatim (weekly, Monday 09:00 America/Los_Angeles, reviewers/assignees `pdugan20`, grouped development/production dependencies).

- [ ] **Step 3: Create `.github/workflows/dependabot-auto-merge.yml`** — copy from `figma-slides-progress-meter/.github/workflows/dependabot-auto-merge.yml` verbatim (auto-approve + `gh pr merge --auto --squash` for minor/patch; comment on major).

- [ ] **Step 4: Create release automation**

`release-please-config.json`:

```json
{
  "packages": {
    ".": { "release-type": "node", "package-name": "figma-music-bubble" }
  },
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json"
}
```

`.release-please-manifest.json`:

```json
{ ".": "0.1.0" }
```

- [ ] **Step 5: Create `commitlint.config.js` and `.markdownlint.json`**

`commitlint.config.js`:

```js
module.exports = { extends: ['@commitlint/config-conventional'] }
```

`.markdownlint.json`:

```json
{ "default": true, "MD013": false, "MD033": false, "MD041": false }
```

- [ ] **Step 6: Add hooks + lint-staged to `package.json`**

Add to `devDependencies`: `"@commitlint/cli": "^20.5.0"`, `"@commitlint/config-conventional": "^20.5.0"`, `"lint-staged": "^16.4.0"`, `"markdownlint-cli": "^0.48.0"`, `"simple-git-hooks": "^2.11.1"`.

Add these top-level keys to `package.json`:

```json
"simple-git-hooks": {
  "pre-commit": "npx lint-staged",
  "commit-msg": "npx --no -- commitlint --edit \"$1\""
},
"lint-staged": {
  "*.{ts,js,mjs}": ["eslint --fix", "prettier --write"],
  "*.{json,yml,html,md}": ["prettier --write"]
}
```

Add to `scripts`: `"prepare": "[ -d .git ] && npx simple-git-hooks || true"`.

- [ ] **Step 7: Create `LICENSE`** — MIT, copyright `2026 Patrick Dugan` (copy the text from `figma-slides-progress-meter/LICENSE`, updating the year/name).

- [ ] **Step 8: Create `README.md`** (markdownlint-compliant)

````markdown
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
````

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

````text

- [ ] **Step 9: Install, enable hooks, verify everything**

Run: `npm install && npm run prepare && npm run style:check && npm run lint && npm run type-check && npm test && npm run build`
Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: add CI, dependabot, release automation, hooks, and docs"
````

---

## Self-Review Notes

- **Spec coverage:** every module in the spec architecture maps to a task (types/color → T2; theme → T3; schema/selection → T4; bubble-source/meta → T5; nodes/fill → T6; plugin index → T7; recents → T8; dominant-color → T9; itunes → T10; render → T11; featured → T12; main → T13; standardization → T14; toolchain/manifest/ui.html → T1). `networkAccess` + `documentAccess` covered in T1 manifest.
- **Type consistency:** `PopulateMessage` (T2) used by `fill.ts` (T6), `index.ts` (T7), `main.ts` (T13). `TrackEntry` flows itunes → featured → main → render. `BubbleResolution` (T5) consumed by `index.ts` (T7). `KeyValueStore` (T8) shared by `createStore`/`RecentsStore`. `replaceSolidFill` (T6) name consistent.
- **Placeholders:** copy-from-sibling steps (T14 dependabot/auto-merge/LICENSE) reference concrete existing files in `figma-slides-progress-meter`/`chat-builder-plugin`, not fabricated content.
