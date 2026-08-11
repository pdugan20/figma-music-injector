import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { extractDominantColor } from './dominant-color'
import { FEATURED_TRACKS, loadFeatured } from './featured'

vi.mock('./dominant-color', () => ({ extractDominantColor: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadFeatured', () => {
  it('loads the complete fixed list without a catalog request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(extractDominantColor).mockResolvedValue(null)

    await expect(loadFeatured()).resolves.toEqual(FEATURED_TRACKS)

    expect(FEATURED_TRACKS).toHaveLength(6)
    expect(extractDominantColor).toHaveBeenCalledTimes(6)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps tracks whose dominant color cannot be extracted', async () => {
    vi.mocked(extractDominantColor)
      .mockRejectedValueOnce(new Error('image failed'))
      .mockResolvedValue(null)

    await expect(loadFeatured()).resolves.toEqual(FEATURED_TRACKS)
  })
})
