import { describe, it, expect, afterEach } from 'vitest'
import { CanvasBubbleSource } from './bubble-source'
import { LAYER, DYNAMIC_COLORS } from './bubble-schema'

const songMatcher = (p: (n: { name: string }) => boolean) =>
  p({ name: LAYER.SONG_NAME }) ? {} : null

const dynProps = { [DYNAMIC_COLORS.PROP]: { value: 'True' } }

function newNode(rt: number[][]) {
  return { width: 100, height: 80, relativeTransform: rt, visible: true }
}

afterEach(() => {
  delete (globalThis as { figma?: unknown }).figma
})

function setFigma(opts: { selection?: unknown[]; byType?: Record<string, unknown[]> }) {
  ;(globalThis as { figma?: unknown }).figma = {
    skipInvisibleInstanceChildren: false,
    currentPage: { selection: opts.selection ?? [], appendChild: () => {} },
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

  it('clones an existing bubble, preserving its mirror, centered in the viewport', async () => {
    const clonedNode = newNode([
      [-1, 0, 0],
      [0, 1, 0],
    ])
    const existing = {
      type: 'INSTANCE',
      componentProperties: dynProps,
      findOne: songMatcher,
      relativeTransform: [
        [-1, 0, 999],
        [0, 1, 5],
      ],
      clone: () => clonedNode,
    }
    setFigma({ selection: [], byType: { INSTANCE: [existing] } })
    const res = await new CanvasBubbleSource().resolve()
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.instance).toBe(clonedNode)
      expect(res.created).toBe(true)
    }
    // mirror preserved (a = -1); centered: left = 50 - 50 = 0, tx = left + width = 100, top = 60 - 40 = 20
    expect(clonedNode.relativeTransform).toEqual([
      [-1, 0, 100],
      [0, 1, 20],
    ])
    // hidden until the caller populates it, so the source's track data never flashes
    expect(clonedNode.visible).toBe(false)
  })

  it('skips a container instance that only holds a Song Name (no dynamic-colors property)', async () => {
    const wrapper = {
      type: 'INSTANCE',
      componentProperties: {},
      findOne: songMatcher,
    }
    setFigma({ selection: [], byType: { INSTANCE: [wrapper] } })
    const res = await new CanvasBubbleSource().resolve()
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe('Could not find a Music Bubble to use')
  })

  it('creates from a local component when no instance exists, matching its flip', async () => {
    const made = newNode([
      [1, 0, 0],
      [0, 1, 0],
    ])
    const comp = {
      type: 'COMPONENT',
      parent: { type: 'PAGE' },
      findOne: songMatcher,
      relativeTransform: [
        [-1, 0, 0],
        [0, 1, 0],
      ],
      createInstance: () => made,
    }
    setFigma({ selection: [], byType: { COMPONENT: [comp] } })
    const res = await new CanvasBubbleSource().resolve()
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.created).toBe(true)
    // flip matched from the mirror-authored master: a = -1, tx = left + width = 100
    expect(made.relativeTransform).toEqual([
      [-1, 0, 100],
      [0, 1, 20],
    ])
    expect(made.visible).toBe(false)
  })

  it('creates from a component set default variant, unflipped', async () => {
    const made = newNode([
      [1, 0, 0],
      [0, 1, 0],
    ])
    const variant = {
      findOne: songMatcher,
      relativeTransform: [
        [1, 0, 0],
        [0, 1, 0],
      ],
      createInstance: () => made,
    }
    const set = { type: 'COMPONENT_SET', defaultVariant: variant }
    setFigma({ selection: [], byType: { COMPONENT_SET: [set] } })
    const res = await new CanvasBubbleSource().resolve()
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.instance).toBe(made)
    // unflipped variant: a = 1, tx = left = 0
    expect(made.relativeTransform).toEqual([
      [1, 0, 0],
      [0, 1, 20],
    ])
  })

  it('fails when no bubble exists in the file', async () => {
    setFigma({ selection: [] })
    const res = await new CanvasBubbleSource().resolve()
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe('Could not find a Music Bubble to use')
  })
})
