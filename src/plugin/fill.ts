import { PopulateMessage } from '../types'
import { LAYER } from './bubble-schema'
import { computeBubbleTheme } from './theme'
import { replaceSolidFill } from './nodes'
import { TOOL_ID, DISPLAY_NAME } from './meta'

export async function fillBubble(instance: InstanceNode, data: PopulateMessage): Promise<boolean> {
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

    replaceSolidFill(songNode, theme.textColor, 1)
    replaceSolidFill(artistNode, theme.textColor, 1)

    const containers = instance.findAll(
      (n) => n.name === LAYER.MESSAGE_CONTAINER && 'fills' in n
    ) as SceneNode[]
    for (const container of containers) {
      replaceSolidFill(container as SceneNode & { fills: readonly Paint[] }, theme.primary, 1)
    }

    const tail = instance.findOne((n) => n.name === LAYER.TAIL && 'fills' in n) as SceneNode | null
    if (tail) replaceSolidFill(tail as SceneNode & { fills: readonly Paint[] }, theme.primary, 1)

    const logos = instance.findAll(
      (n) => LAYER.APPLE_LOGO.includes(n.name) && n.type === 'TEXT'
    ) as TextNode[]
    for (const logo of logos) replaceSolidFill(logo, theme.logoColor, theme.logoOpacity)
  }

  instance.setRelaunchData({ [TOOL_ID]: DISPLAY_NAME })
  return true
}
