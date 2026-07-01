import { PopulateMessage } from '../types'
import { LAYER, DYNAMIC_COLORS, HAS_TAIL } from './bubble-schema'
import { computeBubbleTheme } from './theme'
import { replaceSolidFill } from './nodes'
import { TOOL_ID, DISPLAY_NAME } from './meta'

function variantValue(instance: InstanceNode, prop: string): string | null {
  const props = instance.componentProperties
  return prop in props ? (props[prop].value as string) : null
}

// Switch the bubble into its editable "dynamic color" variant so the fills we
// override are the component's intended dynamic-color path (raw fills) rather
// than the default variable-bound colors. No-op if the property is absent.
function enableDynamicColors(instance: InstanceNode): void {
  if (variantValue(instance, DYNAMIC_COLORS.PROP) === null) return
  try {
    instance.setProperties({ [DYNAMIC_COLORS.PROP]: DYNAMIC_COLORS.ON })
  } catch {
    // Property exists but the value was rejected; fall back to raw fill override.
  }
}

// Force the tail on so its Shape node exists and can be colored. The fill
// override persists after the original choice is restored, so the tail tracks
// the bubble color whenever it is shown. Returns a callback that restores the
// user's original Has tail value; restoring is always safe to call.
function forceTailOn(instance: InstanceNode): () => void {
  const original = variantValue(instance, HAS_TAIL.PROP)
  if (original === null || original === HAS_TAIL.ON) return () => {}
  try {
    instance.setProperties({ [HAS_TAIL.PROP]: HAS_TAIL.ON })
  } catch {
    return () => {}
  }
  return () => {
    try {
      instance.setProperties({ [HAS_TAIL.PROP]: original })
    } catch {
      // Leave the tail enabled rather than throw out of the populate.
    }
  }
}

export async function fillBubble(instance: InstanceNode, data: PopulateMessage): Promise<boolean> {
  enableDynamicColors(instance)
  const restoreTail = forceTailOn(instance)

  try {
    const songNode = instance.findOne(
      (n) => n.name === LAYER.SONG_NAME && n.type === 'TEXT'
    ) as TextNode | null
    const artistNode = instance.findOne(
      (n) => n.name === LAYER.ARTIST_NAME && n.type === 'TEXT'
    ) as TextNode | null
    const albumArtNode = instance.findOne((n) => n.name === LAYER.ALBUM_ART) as RectangleNode | null

    if (!songNode || !artistNode || !albumArtNode) return false

    await figma.loadFontAsync(songNode.fontName as FontName)
    await figma.loadFontAsync(artistNode.fontName as FontName)

    songNode.characters = data.trackName
    artistNode.characters = data.artistName

    if (data.artworkBytes && data.artworkBytes.length > 0) {
      const image = figma.createImage(new Uint8Array(data.artworkBytes))
      const fills = (albumArtNode.fills as Paint[]).slice()
      const existingIdx = fills.findIndex((f) => f.type === 'IMAGE')
      const newFill: ImagePaint = { type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }
      if (existingIdx >= 0) fills[existingIdx] = newFill
      else fills.push(newFill)
      albumArtNode.fills = fills
    }

    if (data.dominantColor) {
      const theme = computeBubbleTheme(data.dominantColor)

      // The bubble fill is the art's dominant color, so art whose edges are that
      // color would blend into the bubble. A thin contrasting hairline, aligned
      // INSIDE so it never shifts layout, keeps the artwork reading as a card.
      albumArtNode.strokes = [
        { type: 'SOLID', color: theme.borderColor, opacity: theme.borderOpacity },
      ]
      albumArtNode.strokeWeight = 1
      albumArtNode.strokeAlign = 'INSIDE'

      replaceSolidFill(songNode, theme.textColor, 1)
      replaceSolidFill(artistNode, theme.textColor, 1)

      const containers = instance.findAll(
        (n) => n.name === LAYER.MESSAGE_CONTAINER && 'fills' in n
      ) as SceneNode[]
      for (const container of containers) {
        replaceSolidFill(container as SceneNode & { fills: readonly Paint[] }, theme.primary, 1)
      }

      const tail = instance.findOne(
        (n) => n.name === LAYER.TAIL && 'fills' in n
      ) as SceneNode | null
      if (tail) replaceSolidFill(tail as SceneNode & { fills: readonly Paint[] }, theme.primary, 1)

      const logos = instance.findAll(
        (n) => LAYER.APPLE_LOGO.includes(n.name) && n.type === 'TEXT'
      ) as TextNode[]
      for (const logo of logos) replaceSolidFill(logo, theme.logoColor, theme.logoOpacity)
    }

    instance.setRelaunchData({ [TOOL_ID]: DISPLAY_NAME })
    return true
  } finally {
    restoreTail()
  }
}
