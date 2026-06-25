import { RGB } from '../types'
import { darken, needsLightText } from '../shared/color'

export interface BubbleTheme {
  primary: RGB
  dark: RGB
  textColor: RGB
  logoColor: RGB
  logoOpacity: number
}

export function computeBubbleTheme(dominant: RGB): BubbleTheme {
  const primary = dominant
  const dark = darken(primary, 0.65)
  const lightText = needsLightText(primary)
  const textColor: RGB = lightText ? { r: 1, g: 1, b: 1 } : { r: 0, g: 0, b: 0 }
  const logoColor: RGB = lightText ? { r: 1, g: 1, b: 1 } : dark
  const logoOpacity = lightText ? 0.6 : 1
  return { primary, dark, textColor, logoColor, logoOpacity }
}
