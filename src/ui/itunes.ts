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
