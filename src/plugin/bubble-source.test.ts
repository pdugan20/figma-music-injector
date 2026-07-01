import { describe, it, expect, afterEach } from 'vitest'
import { CanvasBubbleSource, nextPlacement } from './bubble-source'
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
    viewport: {
      center: { x: 50, y: 60 },
      bounds: { x: -1000, y: -1000, width: 2000, height: 2000 },
    },
    root: {
      findAllWithCriteria: (c: { types: string[] }) => {
        const out: unknown[] = []
        for (const t of c.types) out.push(...(opts.byType?.[t] ?? []))
        return out
      },
    },
  }
}

describe('nextPlacement', () => {
  const size = { width: 100, height: 80 }
  const roomyViewport = {
    center: { x: 50, y: 60 },
    bounds: { x: -100, y: -100, width: 400, height: 400 },
  }

  it('centers the first placement when there is no prior position', () => {
    // left = 50 - 50 = 0, top = 60 - 40 = 20
    expect(nextPlacement(size, roomyViewport, null)).toEqual({ x: 0, y: 20 })
  })

  it('offsets by the given step from the last placement', () => {
    expect(nextPlacement(size, roomyViewport, { x: 0, y: 20 }, { x: 24, y: 40 })).toEqual({
      x: 24,
      y: 60,
    })
  })

  it('restarts at center when the next step would leave the viewport', () => {
    // bounds right edge = -100 + 100 = 0; next.x = 0 + step.x is outside, so recenter
    const tightViewport = {
      center: { x: 50, y: 60 },
      bounds: { x: -100, y: -100, width: 100, height: 100 },
    }
    expect(nextPlacement(size, tightViewport, { x: 0, y: 20 })).toEqual({ x: 0, y: 20 })
  })

  it('derives a height-based step so different-width bubbles offset uniformly', () => {
    // default step is from HEIGHT only = { x: round(0.5 * 80), y: round(0.6 * 80) } = { x: 40, y: 48 }
    expect(nextPlacement(size, roomyViewport, { x: 0, y: 20 })).toEqual({ x: 40, y: 68 })
  })
})

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

  it('cascades the second insert so repeated inserts do not stack', async () => {
    const first = newNode([
      [1, 0, 0],
      [0, 1, 0],
    ])
    const second = newNode([
      [1, 0, 0],
      [0, 1, 0],
    ])
    const clones = [first, second]
    const existing = {
      type: 'INSTANCE',
      componentProperties: dynProps,
      findOne: songMatcher,
      relativeTransform: [
        [1, 0, 0],
        [0, 1, 0],
      ],
      clone: () => clones.shift(),
    }
    setFigma({ selection: [], byType: { INSTANCE: [existing] } })
    const source = new CanvasBubbleSource()
    await source.resolve()
    await source.resolve()
    // first centers at top-left (0, 20); second cascades by the height step (40, 48)
    expect(first.relativeTransform).toEqual([
      [1, 0, 0],
      [0, 1, 20],
    ])
    expect(second.relativeTransform).toEqual([
      [1, 0, 40],
      [0, 1, 68],
    ])
  })

  it('nudges a created bubble by its rendered bounds so the visual top-left hits the cascade target', async () => {
    // The rendered box diverges from the nominal frame: the flip anchors the
    // right edge and the inner bubble overflows the frame, so the true rendered
    // left is nowhere near what nominal-width math predicts.
    const clone = {
      type: 'INSTANCE',
      findOne: songMatcher,
      width: 100,
      height: 80,
      visible: true,
      x: 0,
      y: 0,
      relativeTransform: [
        [-1, 0, 0],
        [0, 1, 0],
      ],
      absoluteRenderBounds: { x: -50, y: 100, width: 126, height: 80 },
    }
    const existing = {
      type: 'INSTANCE',
      componentProperties: dynProps,
      findOne: songMatcher,
      relativeTransform: [
        [-1, 0, 0],
        [0, 1, 0],
      ],
      clone: () => clone,
    }
    setFigma({ selection: [], byType: { INSTANCE: [existing] } })
    const res = await new CanvasBubbleSource().resolve()
    if (!res.ok || !res.created) throw new Error('expected a created bubble')
    res.finalizePlacement()
    // centered target: left = 50 - 50 = 0, top = 60 - 40 = 20
    // nudge: x += left - box.x = 0 - (-50) = 50 ; y += top - box.y = 20 - 100 = -80
    expect(clone.x).toBe(50)
    expect(clone.y).toBe(-80)
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
