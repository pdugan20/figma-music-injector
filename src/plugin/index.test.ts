import { describe, it, expect, afterEach, vi } from 'vitest'
import { LAYER, DYNAMIC_COLORS } from './bubble-schema'
import { PopulateMessage } from '../types'

// fillBubble does real Figma/DOM work; stub it so the handler's placement and
// selection behavior is what's under test.
vi.mock('./fill', () => ({ fillBubble: async () => true }))

const songMatcher = (p: (n: { name: string }) => boolean) =>
  p({ name: LAYER.SONG_NAME }) ? {} : null
const dynProps = { [DYNAMIC_COLORS.PROP]: { value: 'True' } }

interface FigmaUI {
  postMessage: () => void
  onmessage: ((msg: PopulateMessage) => Promise<void>) | null
}

function freshClone() {
  return {
    type: 'INSTANCE',
    findOne: songMatcher,
    width: 100,
    height: 80,
    visible: true,
    relativeTransform: [
      [1, 0, 0],
      [0, 1, 0],
    ],
  }
}

function setupFigma() {
  const appended: unknown[] = []
  const clones = [freshClone(), freshClone()]
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
  const ui: FigmaUI = { postMessage: () => {}, onmessage: null }
  const figma = {
    skipInvisibleInstanceChildren: false,
    currentPage: {
      selection: [] as unknown[],
      appendChild: (n: unknown) => appended.push(n),
    },
    viewport: {
      center: { x: 50, y: 60 },
      bounds: { x: -1000, y: -1000, width: 2000, height: 2000 },
    },
    root: {
      setRelaunchData: () => {},
      findAllWithCriteria: (c: { types: string[] }) =>
        c.types.includes('INSTANCE') ? [existing] : [],
    },
    ui,
    showUI: () => {},
    on: () => {},
    notify: () => {},
    loadAllPagesAsync: async () => {},
  }
  ;(globalThis as { figma?: unknown }).figma = figma
  ;(globalThis as { __html__?: string }).__html__ = '<html></html>'
  return { figma, appended }
}

const populate: PopulateMessage = {
  type: 'populate',
  trackName: 'Song',
  artistName: 'Artist',
  artworkBytes: null,
  dominantColor: null,
}

afterEach(() => {
  vi.resetModules()
  delete (globalThis as { figma?: unknown }).figma
})

describe('populate handler', () => {
  it('does not auto-select a created bubble, so repeated inserts keep adding new ones', async () => {
    const { figma, appended } = setupFigma()
    await import('./index')
    const handler = figma.ui.onmessage
    if (!handler) throw new Error('handler not registered')
    await handler(populate)
    await handler(populate)
    // Two distinct bubbles created (not one overwritten), and nothing left selected.
    expect(appended.length).toBe(2)
    expect(figma.currentPage.selection).toEqual([])
  })
})
