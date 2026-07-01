import { describe, it, expect } from 'vitest'
import { computeBubbleTheme } from './theme'

describe('computeBubbleTheme', () => {
  it('dark artwork -> white text and translucent white logo', () => {
    const t = computeBubbleTheme({ r: 0.1, g: 0.1, b: 0.1 })
    expect(t.textColor).toEqual({ r: 1, g: 1, b: 1 })
    expect(t.logoColor).toEqual({ r: 1, g: 1, b: 1 })
    expect(t.logoOpacity).toBe(0.6)
  })

  it('light artwork -> black text, darkened logo at full opacity', () => {
    const t = computeBubbleTheme({ r: 0.9, g: 0.9, b: 0.9 })
    expect(t.textColor).toEqual({ r: 0, g: 0, b: 0 })
    expect(t.logoOpacity).toBe(1)
    expect(t.logoColor.r).toBeCloseTo(0.9 * 0.65, 5)
  })

  it('dark artwork -> very faint white hairline so art edges never blend into the bubble', () => {
    const t = computeBubbleTheme({ r: 0.1, g: 0.1, b: 0.1 })
    expect(t.borderColor).toEqual({ r: 1, g: 1, b: 1 })
    expect(t.borderOpacity).toBe(0.22)
  })

  it('light artwork -> very faint darkened tonal hairline', () => {
    const t = computeBubbleTheme({ r: 0.9, g: 0.9, b: 0.9 })
    // matches the darkened shade used elsewhere in the theme: 0.9 * 0.65
    expect(t.borderColor.r).toBeCloseTo(0.9 * 0.65, 5)
    expect(t.borderOpacity).toBe(0.12)
  })

  it('primary equals the input color', () => {
    expect(computeBubbleTheme({ r: 0.2, g: 0.4, b: 0.6 }).primary).toEqual({
      r: 0.2,
      g: 0.4,
      b: 0.6,
    })
  })
})
