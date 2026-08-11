import { RGB, TrackEntry } from '../types'
import { extractDominantColor } from './dominant-color'

export const FEATURED_TRACKS: TrackEntry[] = [
  {
    trackName: 'Shake It Off',
    artistName: 'Taylor Swift',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a7/98/d8/a798d867-344d-2bf2-fbfe-d2d1412dcef8/14UMDIM03793.rgb.jpg/200x200bb.jpg',
    dominantColor: null,
  },
  {
    trackName: 'good 4 u',
    artistName: 'Olivia Rodrigo',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/02/ed/8c/02ed8cab-c089-2fdd-7ce6-ab334a9a4e19/21UMGIM26093.rgb.jpg/200x200bb.jpg',
    dominantColor: null,
  },
  {
    trackName: 'Island In the Sun',
    artistName: 'Weezer',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/fc/ef/19/fcef196c-3f81-e9da-f02a-b55d900e7d69/16UMGIM53162.rgb.jpg/200x200bb.jpg',
    dominantColor: null,
  },
  {
    trackName: 'Come As You Are',
    artistName: 'Nirvana',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/95/fd/b9/95fdb9b2-6d2b-92a6-97f2-51c1a6d77f1a/00602527874609.rgb.jpg/200x200bb.jpg',
    dominantColor: null,
  },
  {
    trackName: 'Intergalactic',
    artistName: 'Beastie Boys',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/aa/95/31/aa953192-7552-3a1d-d87f-e724717f3947/13UABIM07217.rgb.jpg/200x200bb.jpg',
    dominantColor: null,
  },
  {
    trackName: 'Let Down',
    artistName: 'Radiohead',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/07/60/ba/0760ba0f-148c-b18f-d0ff-169ee96f3af5/634904078164.png/200x200bb.jpg',
    dominantColor: null,
  },
]

export async function loadFeatured(): Promise<TrackEntry[]> {
  const tracks = FEATURED_TRACKS.map((track) => ({ ...track }))

  const colors = await Promise.allSettled(
    tracks.map((t) => (t.artworkUrl ? extractDominantColor(t.artworkUrl) : Promise.resolve(null)))
  )

  return tracks.map((t, i) => {
    const c = colors[i]
    const dominantColor: RGB | null = c.status === 'fulfilled' ? c.value : null
    return { ...t, dominantColor }
  })
}
