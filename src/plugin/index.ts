import { PopulateMessage } from '../types'
import { getSelectionStatus } from './selection'
import { CanvasBubbleSource } from './bubble-source'
import { fillBubble } from './fill'
import { TOOL_ID, DISPLAY_NAME } from './meta'

const bubbleSource = new CanvasBubbleSource()

figma.showUI(__html__, { themeColors: true, width: 320, height: 480 })
figma.root.setRelaunchData({ [TOOL_ID]: DISPLAY_NAME })

function postSelection() {
  figma.ui.postMessage({
    type: 'selection',
    status: getSelectionStatus(figma.currentPage.selection),
  })
}

postSelection()
figma.on('selectionchange', postSelection)

// Serialize populate requests: resolving/inserting is async, so a rapid double
// click with nothing selected could otherwise create two stacked bubbles.
let populating = false

figma.ui.onmessage = async (msg: PopulateMessage) => {
  if (msg.type !== 'populate') return
  if (populating) return
  populating = true
  try {
    const resolved = await bubbleSource.resolve()
    if (!resolved.ok) {
      figma.notify(resolved.message)
      return
    }
    const filled = await fillBubble(resolved.instance, msg)
    if (!filled) {
      // A freshly created bubble is hidden and unpopulated; remove it rather
      // than leave an empty hidden node behind.
      if (resolved.created) resolved.instance.remove()
      figma.notify('Could not find the expected layers in this Music Bubble')
      return
    }
    if (resolved.created) {
      // Reveal first, THEN position: finalizePlacement measures the bubble's
      // real rendered box, which only exists once visible. Figma batches canvas
      // repaints until this handler returns, so the brief pre-nudge position
      // never paints (no flash).
      //
      // Do NOT select it: a selected bubble is an overwrite target (see
      // CanvasBubbleSource.resolve), so auto-selecting would make the next insert
      // re-fill this same bubble instead of adding a new one. Leaving the
      // selection empty lets repeated inserts keep cascading out new bubbles.
      resolved.instance.visible = true
      resolved.finalizePlacement()
    }
    figma.notify(`Added ${msg.trackName} by ${msg.artistName}`)
  } finally {
    populating = false
  }
}
