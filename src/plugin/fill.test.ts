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

function buildInstance(componentProperties: Record<string, unknown> = {}) {
  const song = textNode('Song Name')
  const artist = textNode('Artist Name')
  const albumArt = { name: 'Album Art', type: 'RECTANGLE', fills: [] as unknown[] }
  const nodes: Record<string, unknown> = { song, artist, albumArt }
  return {
    nodes,
    instance: {
      componentProperties,
      setProperties: vi.fn(),
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

  it('draws a contrast hairline on the album art so it never blends into the bubble', async () => {
    const { nodes, instance } = buildInstance()
    await fillBubble(instance as never, data)
    const art = nodes.albumArt as {
      strokes: { type: string; color: { r: number; g: number; b: number }; opacity: number }[]
      strokeWeight: number
      strokeAlign: string
    }
    // dark dominant -> very faint white hairline at 0.22 (see computeBubbleTheme)
    expect(art.strokes).toEqual([{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.22 }])
    expect(art.strokeWeight).toBe(1)
    // INSIDE so the 1px sits within the art bounds and does not shift layout
    expect(art.strokeAlign).toBe('INSIDE')
  })

  it('returns false when required layers are missing', async () => {
    const instance = {
      componentProperties: {},
      setProperties: vi.fn(),
      findOne: () => null,
      findAll: () => [],
      setRelaunchData: vi.fn(),
    }
    expect(await fillBubble(instance as never, data)).toBe(false)
  })

  it('enables the dynamic-colors variant when the property exists', async () => {
    const { instance } = buildInstance({
      'Uses dynamic colors': { type: 'VARIANT', value: 'False' },
    })
    await fillBubble(instance as never, data)
    expect(instance.setProperties).toHaveBeenCalledWith({ 'Uses dynamic colors': 'True' })
  })

  it('does not set properties when the dynamic-colors variant is absent', async () => {
    const { instance } = buildInstance()
    await fillBubble(instance as never, data)
    expect(instance.setProperties).not.toHaveBeenCalled()
  })

  it('temporarily enables the tail to color it, then restores the original value', async () => {
    const { instance } = buildInstance({ 'Has tail': { type: 'VARIANT', value: 'False' } })
    await fillBubble(instance as never, data)
    const calls = instance.setProperties.mock.calls.map((c) => c[0] as Record<string, string>)
    const enableIdx = calls.findIndex((c) => c['Has tail'] === 'True')
    const restoreIdx = calls.findIndex((c) => c['Has tail'] === 'False')
    expect(enableIdx).toBeGreaterThanOrEqual(0)
    expect(restoreIdx).toBeGreaterThan(enableIdx)
  })

  it('leaves the tail untouched when it is already on', async () => {
    const { instance } = buildInstance({ 'Has tail': { type: 'VARIANT', value: 'True' } })
    await fillBubble(instance as never, data)
    expect(instance.setProperties).not.toHaveBeenCalled()
  })
})
