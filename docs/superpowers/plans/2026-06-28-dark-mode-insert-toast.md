# Dark Mode, Auto-Insert, and Toast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the plugin panel follow Figma's light/dark theme, auto-insert a Music Bubble when none is selected, and improve toast wording.

**Architecture:** Three independent changes across the existing two-thread layout. Dark mode is a `showUI` flag plus a CSS background. Auto-insert turns `bubble-source.ts` resolution async with a structural discovery ladder (reusing the "has a `Song Name` descendant" signature). Toast and status wording change in the plugin and UI shells.

**Tech Stack:** TypeScript, Figma Plugin API (`@figma/plugin-typings`), esbuild, Vitest.

## Global Constraints

- No emojis in code, logs, or console output.
- Conventional Commits for every commit message.
- Commit messages: no AI attribution, no "Claude", no Co-Authored-By trailer.
- TDD for new pure logic; new logic ships with tests (Vitest).
- All Figma API access stays in `src/plugin/`; the UI thread never touches the Figma API.
- Layer-name / variant contract lives only in `src/plugin/bubble-schema.ts` — do not inline those strings elsewhere.
- Manifest uses `documentAccess: "dynamic-page"` — cross-page node access requires `await figma.loadAllPagesAsync()` first, and `instance.mainComponent` must be read via `await instance.getMainComponentAsync()`.
- After changes, the four checks must pass: `npm run style:write`, `npm run lint`, `npm run type-check`, `npm test`.

---

### Task 1: Plugin UI dark mode

**Files:**

- Modify: `src/plugin/index.ts:9`
- Modify: `src/ui/ui.html:17-21` (the `body` rule)

**Interfaces:**

- Consumes: nothing new.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Enable theme colors on the UI iframe**

In `src/plugin/index.ts`, change the `showUI` call:

```ts
figma.showUI(__html__, { themeColors: true, width: 320, height: 480 })
```

- [ ] **Step 2: Give the panel a themed background**

In `src/ui/ui.html`, update the `body` rule so the panel surface follows the theme (add the two declarations; keep the existing `display`, `font-family`, `font-size`):

```css
body {
  display: block;
  background: var(--figma-color-bg, #fff);
  color: var(--figma-color-text, #1a1a1a);
  font-family: var(--font-family, Inter, sans-serif);
  font-size: 11px;
}
```

- [ ] **Step 3: Build and verify the variables are injected**

Run: `npm run build`
Expected: build succeeds, `dist/ui.html` is regenerated.

Manual check (in Figma): open the plugin with the editor in **dark** theme — the panel background, text, borders, and search field are dark. Switch the editor to **light** theme — the panel is light. (No automated test; this is a runtime flag + CSS.)

- [ ] **Step 4: Run the check suite**

Run: `npm run style:write && npm run lint && npm run type-check && npm test`
Expected: all pass (no test changes in this task).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/index.ts src/ui/ui.html
git commit -m "feat: follow Figma light/dark theme in the plugin panel"
```

---

### Task 2: Selection status wording and always-enabled clicks

**Files:**

- Modify: `src/plugin/selection.ts`
- Test: `src/plugin/selection.test.ts`
- Modify: `src/ui/main.ts:9,17-22,24-25` (remove the `canPopulate` gate)
- Modify: `src/ui/ui.html:223` (default footer label)

**Interfaces:**

- Consumes: `LAYER.SONG_NAME` from `bubble-schema.ts`.
- Produces: `getSelectionStatus(selection): SelectionStatus` — `ok: true` with message `"1 layer selected"` only when exactly one Music Bubble instance is selected; otherwise `ok: false` with message `"A new bubble will be added"`.

- [ ] **Step 1: Update the failing tests**

Replace the body of `src/plugin/selection.test.ts` with:

```ts
import { describe, it, expect } from 'vitest'
import { getSelectionStatus } from './selection'
import { LAYER } from './bubble-schema'

function instanceWithSong() {
  return {
    type: 'INSTANCE',
    findOne: (p: (n: { name: string }) => boolean) => (p({ name: LAYER.SONG_NAME }) ? {} : null),
  }
}

describe('getSelectionStatus', () => {
  it('empty selection offers to insert', () => {
    expect(getSelectionStatus([] as never).message).toBe('A new bubble will be added')
  })

  it('multiple selection offers to insert', () => {
    expect(getSelectionStatus([{}, {}] as never).message).toBe('A new bubble will be added')
  })

  it('non-instance offers to insert', () => {
    const status = getSelectionStatus([{ type: 'RECTANGLE' }] as never)
    expect(status.ok).toBe(false)
    expect(status.message).toBe('A new bubble will be added')
  })

  it('instance missing Song Name offers to insert', () => {
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

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- selection`
Expected: FAIL — current code returns `"Select a Music Bubble layer"`, not `"A new bubble will be added"`.

- [ ] **Step 3: Update `getSelectionStatus`**

Replace the body of `src/plugin/selection.ts` with:

```ts
import { SelectionStatus } from '../types'
import { LAYER } from './bubble-schema'

export function getSelectionStatus(selection: readonly SceneNode[]): SelectionStatus {
  const insert: SelectionStatus = { ok: false, message: 'A new bubble will be added' }
  if (selection.length !== 1) return insert
  const node = selection[0]
  if (node.type !== 'INSTANCE') return insert
  if (!node.findOne((n) => n.name === LAYER.SONG_NAME)) return insert
  return { ok: true, message: '1 layer selected' }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- selection`
Expected: PASS.

- [ ] **Step 5: Always allow track clicks in the UI**

In `src/ui/main.ts`:

Delete the `canPopulate` declaration (line 9):

```ts
let canPopulate = false
```

Update `window.onmessage` (lines 17-22) to drop the `canPopulate` assignment:

```ts
window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage as SelectionMessage | undefined
  if (!msg || msg.type !== 'selection') return
  statusLabel.textContent = msg.status.message
}
```

Update `selectEntry` (lines 24-25) to remove the early return guard. The function keeps its body but loses the first line:

```ts
function selectEntry(entry: TrackEntry): void {
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
```

- [ ] **Step 6: Update the default footer label**

In `src/ui/ui.html`, change the default status label (line 223):

```html
<label id="status-label">A new bubble will be added</label>
```

- [ ] **Step 7: Run the check suite**

Run: `npm run style:write && npm run lint && npm run type-check && npm test`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/plugin/selection.ts src/plugin/selection.test.ts src/ui/main.ts src/ui/ui.html
git commit -m "feat: enable track selection when no bubble is selected"
```

---

### Task 3: Auto-insert a bubble via structural discovery

**Files:**

- Modify: `src/plugin/bubble-source.ts`
- Test: `src/plugin/bubble-source.test.ts`
- Modify: `src/plugin/index.ts:7,22-35`

**Interfaces:**

- Consumes: `getSelectionStatus` from `selection.ts`; `LAYER.SONG_NAME` from `bubble-schema.ts`.
- Produces:
  - `BubbleResolution = { ok: true; instance: InstanceNode; created: boolean } | { ok: false; message: string }`
  - `interface BubbleSource { resolve(): Promise<BubbleResolution> }`
  - `class CanvasBubbleSource implements BubbleSource` (replaces `SelectionBubbleSource`).

- [ ] **Step 1: Write the failing tests**

Replace the body of `src/plugin/bubble-source.test.ts` with:

```ts
import { describe, it, expect, afterEach } from 'vitest'
import { CanvasBubbleSource } from './bubble-source'
import { LAYER } from './bubble-schema'

const songMatcher = (p: (n: { name: string }) => boolean) =>
  p({ name: LAYER.SONG_NAME }) ? {} : null

function makeInstance() {
  return { width: 100, height: 80, x: 0, y: 0 }
}

afterEach(() => {
  delete (globalThis as { figma?: unknown }).figma
})

function setFigma(opts: { selection?: unknown[]; byType?: Record<string, unknown[]> }) {
  ;(globalThis as { figma?: unknown }).figma = {
    currentPage: { selection: opts.selection ?? [] },
    loadAllPagesAsync: async () => {},
    viewport: { center: { x: 50, y: 60 } },
    root: {
      findAllWithCriteria: (c: { types: string[] }) => {
        const out: unknown[] = []
        for (const t of c.types) out.push(...(opts.byType?.[t] ?? []))
        return out
      },
    },
  }
}

describe('CanvasBubbleSource', () => {
  it('uses the selected bubble without creating one', async () => {
    const instance = { type: 'INSTANCE', findOne: songMatcher }
    setFigma({ selection: [instance] })
    const res = await new CanvasBubbleSource().resolve()
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.instance).toBe(instance)
      expect(res.created).toBe(false)
    }
  })

  it('creates from an existing bubble instance when nothing valid is selected', async () => {
    const newInstance = makeInstance()
    const mainComponent = { createInstance: () => newInstance }
    const existing = {
      type: 'INSTANCE',
      findOne: songMatcher,
      getMainComponentAsync: async () => mainComponent,
    }
    setFigma({ selection: [], byType: { INSTANCE: [existing] } })
    const res = await new CanvasBubbleSource().resolve()
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.instance).toBe(newInstance)
      expect(res.created).toBe(true)
    }
    expect(newInstance.x).toBe(0) // 50 - 100/2
    expect(newInstance.y).toBe(20) // 60 - 80/2
  })

  it('creates from a standalone local component', async () => {
    const newInstance = makeInstance()
    const comp = {
      type: 'COMPONENT',
      parent: { type: 'PAGE' },
      findOne: songMatcher,
      createInstance: () => newInstance,
    }
    setFigma({ selection: [], byType: { COMPONENT: [comp] } })
    const res = await new CanvasBubbleSource().resolve()
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.created).toBe(true)
  })

  it('creates from a component set default variant', async () => {
    const newInstance = makeInstance()
    const variant = { findOne: songMatcher, createInstance: () => newInstance }
    const set = { type: 'COMPONENT_SET', defaultVariant: variant }
    setFigma({ selection: [], byType: { COMPONENT_SET: [set] } })
    const res = await new CanvasBubbleSource().resolve()
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.instance).toBe(newInstance)
  })

  it('fails when no bubble exists in the file', async () => {
    setFigma({ selection: [] })
    const res = await new CanvasBubbleSource().resolve()
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe('Could not find a Music Bubble to use')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- bubble-source`
Expected: FAIL — `CanvasBubbleSource` is not exported yet.

- [ ] **Step 3: Implement the discovery ladder**

Replace the body of `src/plugin/bubble-source.ts` with:

```ts
import { getSelectionStatus } from './selection'
import { LAYER } from './bubble-schema'

export type BubbleResolution =
  | { ok: true; instance: InstanceNode; created: boolean }
  | { ok: false; message: string }

export interface BubbleSource {
  resolve(): Promise<BubbleResolution>
}

function hasSongLayer(node: ChildrenMixin): boolean {
  return node.findOne((n) => n.name === LAYER.SONG_NAME) !== null
}

// A Music Bubble already placed in the file: clone its main component. Covers a
// library component that has been used in the file (no key needed).
async function findInstanceSource(): Promise<ComponentNode | null> {
  const instances = figma.root.findAllWithCriteria({ types: ['INSTANCE'] })
  for (const instance of instances) {
    if (hasSongLayer(instance)) {
      const main = await instance.getMainComponentAsync()
      if (main) return main
    }
  }
  return null
}

// A local main component or component set with the bubble structure.
function findComponentSource(): ComponentNode | null {
  const components = figma.root.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })
  for (const node of components) {
    if (node.type === 'COMPONENT_SET') {
      const variant = node.defaultVariant
      if (variant && hasSongLayer(variant)) return variant
    } else if (node.parent?.type !== 'COMPONENT_SET') {
      if (hasSongLayer(node)) return node
    }
  }
  return null
}

export class CanvasBubbleSource implements BubbleSource {
  async resolve(): Promise<BubbleResolution> {
    const selection = figma.currentPage.selection
    if (getSelectionStatus(selection).ok) {
      return { ok: true, instance: selection[0] as InstanceNode, created: false }
    }

    await figma.loadAllPagesAsync()
    const component = (await findInstanceSource()) ?? findComponentSource()
    if (!component) return { ok: false, message: 'Could not find a Music Bubble to use' }

    const instance = component.createInstance()
    const center = figma.viewport.center
    instance.x = Math.round(center.x - instance.width / 2)
    instance.y = Math.round(center.y - instance.height / 2)
    return { ok: true, instance, created: true }
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- bubble-source`
Expected: PASS (all five cases).

- [ ] **Step 5: Wire the async source into the plugin entry**

In `src/plugin/index.ts`, update the import on line 3 and the construction on line 7:

```ts
import { CanvasBubbleSource } from './bubble-source'
```

```ts
const bubbleSource = new CanvasBubbleSource()
```

Replace the message handler (lines 22-35) with:

```ts
figma.ui.onmessage = async (msg: PopulateMessage) => {
  if (msg.type !== 'populate') return
  const resolved = await bubbleSource.resolve()
  if (!resolved.ok) {
    figma.notify(resolved.message)
    return
  }
  const filled = await fillBubble(resolved.instance, msg)
  if (!filled) {
    figma.notify('Could not find the expected layers in this Music Bubble')
    return
  }
  if (resolved.created) figma.currentPage.selection = [resolved.instance]
  figma.notify(`Added ${msg.trackName} by ${msg.artistName}`)
}
```

- [ ] **Step 6: Run the full check suite**

Run: `npm run style:write && npm run lint && npm run type-check && npm test`
Expected: all pass. (`type-check` confirms `index.ts` compiles against the now-async `resolve()` and the renamed class.)

- [ ] **Step 7: Build and verify in Figma**

Run: `npm run build`
Expected: build succeeds.

Manual check (in Figma): with **nothing** selected, click a featured track — a new Music Bubble appears at the viewport center, populated, and selected. With a Music Bubble already selected, clicking a track fills that one (no new node). In a file with **no** bubble anywhere, clicking a track shows the toast "Could not find a Music Bubble to use".

- [ ] **Step 8: Commit**

```bash
git add src/plugin/bubble-source.ts src/plugin/bubble-source.test.ts src/plugin/index.ts
git commit -m "feat: insert a new Music Bubble when none is selected"
```

---

### Task 4: Toast wording

The success toast and failure wording are already set in Task 3's `index.ts` handler (`Added ${trackName} by ${artistName}` and `Could not find a Music Bubble to use`). This task is a verification checkpoint only — no separate code change.

**Files:**

- Verify: `src/plugin/index.ts` (handler from Task 3)

- [ ] **Step 1: Confirm the toast strings**

Confirm `src/plugin/index.ts` contains exactly:

- success: `figma.notify(\`Added ${msg.trackName} by ${msg.artistName}\`)`
- not-found: `figma.notify(resolved.message)` where `resolved.message` is `"Could not find a Music Bubble to use"`
- missing-layers: `figma.notify('Could not find the expected layers in this Music Bubble')`

No old `Populated with` string remains:

Run: `grep -rn "Populated with" src`
Expected: no matches.

- [ ] **Step 2: No commit needed**

If Step 1 passes, the wording shipped in Task 3. If `grep` finds a stale string, fix it and commit with `git commit -m "feat: clarify the populate success toast"`.

---

## Notes for the implementer

- `createInstance()` parents the new node under `figma.currentPage` automatically; the plan only sets `x`/`y`, it does not append.
- Under `documentAccess: "dynamic-page"`, `findAllWithCriteria` on `figma.root` requires `await figma.loadAllPagesAsync()` first — that call is in `resolve()` before any root search. It is intentionally **not** called on `selectionchange` (only on the insert path) to keep selection updates cheap.
- The structural signature (a descendant named `Song Name`) is the single source of truth for "is this a Music Bubble" — it is already used by `getSelectionStatus`, and `bubble-source.ts` reuses it through the shared `LAYER.SONG_NAME` constant. Do not hardcode a component name.
