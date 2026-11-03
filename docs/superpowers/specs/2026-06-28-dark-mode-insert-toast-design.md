# Dark Mode, Auto-Insert, and Toast Improvements

## Overview

Three independent improvements to the iMessage Music Builder plugin:

1. **Plugin UI dark mode** — make the plugin panel follow Figma's light/dark
   editor theme via Figma's CSS variables.
2. **Auto-insert a bubble** — when no Music Bubble is selected, insert a new one
   on the canvas, populate it, and select it.
3. **Toast text** — clearer success and failure wording.

These are scoped to the existing two-thread architecture (`src/plugin/` main
thread, `src/ui/` UI thread) and do not change the `postMessage` contract beyond
what is noted below.

## 1. Plugin UI Dark Mode

### Problem

The panel renders white even when Figma is in dark theme. The UI CSS already
references `var(--figma-color-*)` variables with light fallbacks, but Figma only
injects those variables (and the `figma-dark` / `figma-light` class) when the
plugin opts in via `themeColors: true` in `figma.showUI()`. Without the flag,
every variable falls back to its hardcoded light value.

Reference: <https://developers.figma.com/docs/plugins/css-variables/>

### Changes

- `src/plugin/index.ts`: pass `themeColors: true` in the `figma.showUI()`
  options (alongside the existing `width` / `height`).
- `src/ui/ui.html`: add an explicit `background: var(--figma-color-bg, #fff)` and
  `color: var(--figma-color-text, #1a1a1a)` to `body` (or `#plugin-root`).
  Nothing sets the panel background today, so even with variables present it
  would render white.
- Audit the remaining hardcoded color fallbacks; they are retained as
  light-mode fallbacks for the case where variables are absent.

### Dark mode testing

No unit test — this is a runtime flag plus CSS. Verified manually in Figma in
both light and dark editor themes.

## 2. Auto-Insert a Bubble When None Is Selected

### Behavior

When the user clicks a track:

- If a single valid Music Bubble instance is selected, fill it (current
  behavior).
- Otherwise, insert a new Music Bubble at the viewport center, populate it with
  the chosen track, and select it.

### Bubble discovery

A bubble is identified **structurally**, reusing the signature already defined in
`selection.ts`: a node that has a descendant named `LAYER.SONG_NAME`
(`"Song Name"`). This keeps discovery name- and key-agnostic and works for both a
local kit component and a library component already used in the file.

`bubble-source.ts` resolution becomes **async** and follows this ladder:

1. A single valid selected Music Bubble instance → use it. `created: false`.
2. Else `await figma.loadAllPagesAsync()`, then search `figma.root` for any
   existing `INSTANCE` whose subtree matches the signature → `createInstance()`
   from its `mainComponent`. `created: true`.
3. Else search `figma.root` for a local `COMPONENT_SET` (use its
   `defaultVariant`) or `COMPONENT` whose subtree matches the signature →
   `createInstance()`. `created: true`.
4. Else fail with a message.

`loadAllPagesAsync()` is only called on the insert path (when no valid bubble is
selected), never on every `selectionchange`, because the manifest uses
`documentAccess: "dynamic-page"`.

### Placement and selection

- A newly created instance is positioned at `figma.viewport.center`, offset by
  half its width/height so it is centered in view.
- The caller (`index.ts`) sets `figma.currentPage.selection` to the new instance
  when `created` is true.

### Contract changes

- `BubbleResolution` success shape gains `created: boolean`:
  `{ ok: true; instance: InstanceNode; created: boolean }`.
- `BubbleSource.resolve()` becomes `async` and returns
  `Promise<BubbleResolution>`. (Renaming to a clearer name such as
  `resolveOrCreate()` is acceptable if it reads better in `index.ts`.)
- `fillBubble` is unchanged — it already enables dynamic colors and forces the
  tail on, which works on a freshly created default instance.

### UI status

- `getSelectionStatus` / the footer label: when no valid bubble is selected, the
  footer reads **"A new bubble will be added"** instead of "Select a Music
  Bubble layer".
- Clicking a track is always enabled (the `canPopulate` gate no longer blocks the
  no-selection case). If discovery fails at populate time, the failure is
  surfaced via a toast (see section 3).

### Auto-insert testing

Extend `bubble-source.test.ts` with a mocked `figma` to cover all four ladder
branches:

- selected valid bubble → returned, `created: false`
- no selection, existing instance found → instance created from its
  `mainComponent`, `created: true`
- no selection, only a component/component-set found → instantiated,
  `created: true`
- nothing found → `{ ok: false }` with the failure message

## 3. Toast Text

- Success: `Added ${trackName} by ${artistName}` (drops the surrounding quotes
  from the current "Populated with ..." wording).
- Failure when no bubble can be found or created:
  `Could not find a Music Bubble to use`.
- The existing "Could not find the expected layers in this Music Bubble" toast is
  retained.

## Out of Scope

- Bubble component appearance (light/dark variants of the bubble itself) — this
  work is strictly the plugin panel UI theme.
- Importing a library component by key when the component has never been used in
  the file. The structural discovery ladder requires the component to be present
  in the file, consistent with the existing project assumption.
