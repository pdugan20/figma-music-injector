import { RGB } from '../types'

export function pickDominant(data: Uint8ClampedArray): RGB | null {
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const avg = (r + g + b) / 3
    if (avg < 40 || avg > 215) continue
    const key = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4)
    const bkt = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 }
    bkt.r += r
    bkt.g += g
    bkt.b += b
    bkt.n++
    buckets.set(key, bkt)
  }
  const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0]
  if (!top) return null
  return { r: top.r / top.n / 255, g: top.g / top.n / 255, b: top.b / top.n / 255 }
}

export async function extractDominantColor(url: string): Promise<RGB | null> {
  try {
    const blob = await (await fetch(url)).blob()
    const bmp = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(60, 60)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bmp, 0, 0, 60, 60)
    const { data } = ctx.getImageData(0, 0, 60, 60)
    return pickDominant(data)
  } catch {
    return null
  }
}
