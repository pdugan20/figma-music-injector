import { describe, it, expect } from 'vitest'
import { pickDominant } from './dominant-color'

function pixels(rows: [number, number, number, number][]): Uint8ClampedArray {
  return new Uint8ClampedArray(rows.flat())
}

describe('pickDominant', () => {
  it('returns null when all pixels are filtered out', () => {
    // transparent, near-black, near-white
    expect(
      pickDominant(
        pixels([
          [120, 120, 120, 0],
          [10, 10, 10, 255],
          [250, 250, 250, 255],
        ])
      )
    ).toBeNull()
  })

  it('returns the modal mid-tone bucket as 0-1 channels', () => {
    const data = pixels([
      [100, 50, 50, 255],
      [100, 50, 50, 255],
      [100, 50, 50, 255],
      [60, 180, 90, 255],
    ])
    const c = pickDominant(data)
    expect(c).not.toBeNull()
    expect(c!.r).toBeCloseTo(100 / 255, 5)
    expect(c!.g).toBeCloseTo(50 / 255, 5)
    expect(c!.b).toBeCloseTo(50 / 255, 5)
  })
})
