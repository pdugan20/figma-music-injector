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
