import { RGB } from '../types'
import { darken, needsLightText } from '../shared/color'

export interface BubbleTheme {
  primary: RGB
  dark: RGB
  textColor: RGB
  logoColor: RGB
  logoOpacity: number
  borderColor: RGB
  borderOpacity: number
}

export function computeBubbleTheme(dominant: RGB): BubbleTheme {
  const primary = dominant
  const dark = darken(primary, 0.65)
  const lightText = needsLightText(primary)
  const textColor: RGB = lightText ? { r: 1, g: 1, b: 1 } : { r: 0, g: 0, b: 0 }
  const logoColor: RGB = lightText ? { r: 1, g: 1, b: 1 } : dark
  const logoOpacity = lightText ? 0.6 : 1
  // A very faint hairline for the album art. Because the bubble fill IS the
  // art's dominant color, art whose edges are that color blends into the bubble
  // with no visible boundary. A whisper of a contrasting edge (light on dark
  // bubbles, a darkened tonal shade on light ones) restores the "thumbnail on a
  // card" read without reading as a drawn outline. Dark-on-light shows more
  // strongly than white-on-dark, so it carries the lower opacity.
  const borderColor: RGB = lightText ? { r: 1, g: 1, b: 1 } : dark
  const borderOpacity = lightText ? 0.22 : 0.12
  return { primary, dark, textColor, logoColor, logoOpacity, borderColor, borderOpacity }
}
