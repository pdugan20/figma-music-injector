import { getSelectionStatus } from './selection'
import { LAYER, DYNAMIC_COLORS } from './bubble-schema'

export type BubbleResolution =
  | { ok: true; instance: InstanceNode; created: false }
  | { ok: true; instance: InstanceNode; created: true; finalizePlacement: () => void }
  | { ok: false; message: string }

export interface BubbleSource {
  resolve(): Promise<BubbleResolution>
}

function hasSongLayer(node: ChildrenMixin): boolean {
  return node.findOne((n) => n.name === LAYER.SONG_NAME) !== null
}

// An already-placed Music Bubble we can clone. Cloning preserves the kit's
// intended transform: this kit authors the bubble mirrored (a horizontal flip),
// so a fresh createInstance() would render its text and artwork backwards. We
// identify a real bubble — not a container that merely holds one, e.g. a chat
// thread whose subtree also contains a "Song Name" — by the dynamic-colors
// variant property from the schema, which only the bubble component exposes.
function findExistingInstance(): InstanceNode | null {
  const instances = figma.root.findAllWithCriteria({ types: ['INSTANCE'] })
  for (const instance of instances) {
    if (DYNAMIC_COLORS.PROP in instance.componentProperties && hasSongLayer(instance)) {
      return instance
    }
  }
  return null
}

// A local main component / component set, used only when the file has no
// existing bubble instance to clone.
function findComponentSource(): ComponentNode | null {
  const components = figma.root.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })
  for (const node of components) {
    if (node.type === 'COMPONENT_SET') {
      const variant = node.defaultVariant
      if (variant && hasSongLayer(variant)) return variant
    } else if (node.parent?.type !== 'COMPONENT_SET') {
      if (hasSongLayer(node)) return node
    }
  }
  return null
}

export interface PlacementViewport {
  center: { x: number; y: number }
  bounds: { x: number; y: number; width: number; height: number }
}

// A cascade step scaled to the bubble so the stagger is clearly visible on any
// bubble size. Both axes derive from HEIGHT, never width: a bubble's width is
// driven by its title length, so a width-based step would offset different-width
// bubbles by different amounts and the staircase would look irregular. Height is
// uniform across the kit's bubbles, so a height-based step gives an even
// staircase. Down a little more than across reads as a descending fan.
function cascadeStep(size: { width: number; height: number }): { x: number; y: number } {
  return { x: Math.round(size.height * 0.5), y: Math.round(size.height * 0.6) }
}

// Decide the top-left corner for the next inserted bubble when nothing is
// selected. The first bubble of a session centers in the viewport; each later
// one cascades a size-scaled step down-and-right so repeated inserts do not
// stack on the same pixel. If the next step would carry the top-left corner
// outside the visible viewport, restart at center rather than march the cascade
// off-screen. Pure so it can be unit-tested without the Figma API.
export function nextPlacement(
  size: { width: number; height: number },
  viewport: PlacementViewport,
  last: { x: number; y: number } | null,
  step = cascadeStep(size)
): { x: number; y: number } {
  const centered = {
    x: Math.round(viewport.center.x - size.width / 2),
    y: Math.round(viewport.center.y - size.height / 2),
  }
  if (!last) return centered
  const next = { x: last.x + step.x, y: last.y + step.y }
  const { x, y, width, height } = viewport.bounds
  const cornerVisible = next.x >= x && next.x <= x + width && next.y >= y && next.y <= y + height
  return cornerVisible ? next : centered
}

export class CanvasBubbleSource implements BubbleSource {
  // Top-left of the most recent placement this session, so the next insert can
  // cascade off it. Resets when the plugin reloads; null means "center it".
  private lastTopLeft: { x: number; y: number } | null = null

  async resolve(): Promise<BubbleResolution> {
    const selection = figma.currentPage.selection
    if (getSelectionStatus(selection).ok) {
      return { ok: true, instance: selection[0] as InstanceNode, created: false }
    }

    await figma.loadAllPagesAsync()
    // Skip instance interiors while scanning so a bubble nested inside another
    // instance (e.g. a chat thread) is not picked as a clone source. Reset it
    // before returning so fillBubble can still find the hidden instance's layers.
    figma.skipInvisibleInstanceChildren = true
    const existing = findExistingInstance()
    figma.skipInvisibleInstanceChildren = false

    if (existing) return this.placeCreated(existing.clone(), existing)

    const component = findComponentSource()
    if (!component) return { ok: false, message: 'Could not find a Music Bubble to use' }
    return this.placeCreated(component.createInstance(), component)
  }

  // Parent + hide the new instance and position it via nextPlacement, preserving
  // the source's horizontal flip so a mirror-authored bubble keeps reading
  // correctly. The bubble has no rotation or shear, so a flip-and-translate
  // transform is exact. Hidden until the caller populates it — a cloned bubble
  // carries the source's track data, which would otherwise flash during the
  // async fill.
  //
  // Returns finalizePlacement so the caller can re-assert the position AFTER
  // fillBubble resizes the bubble to fit its title. A flipped bubble's local
  // origin is its right edge, so auto-layout grows it leftward; without a second
  // pass its pre-fill left edge would be stale and the cascade would look
  // ragged. The stored cascade anchor (left) is width-independent, so only the
  // rendered transform needs the refresh.
  private placeCreated(instance: InstanceNode, source: SceneNode): BubbleResolution {
    instance.visible = false
    figma.currentPage.appendChild(instance)
    const flipX = source.relativeTransform[0][0] < 0 ? -1 : 1
    const size = { width: instance.width, height: instance.height }
    const viewport = { center: figma.viewport.center, bounds: figma.viewport.bounds }
    const { x: left, y: top } = nextPlacement(size, viewport, this.lastTopLeft)
    this.lastTopLeft = { x: left, y: top }
    // Establish the flip and a first-guess position from the nominal frame. The
    // exact position is corrected by finalizePlacement once the bubble is
    // revealed: the nominal frame width is a lie (the inner bubble hugs its
    // title and overflows the frame, and the flip anchors the right edge), so
    // only the true rendered box can put the visible left edge on the cascade.
    const tx = flipX < 0 ? left + instance.width : left
    instance.relativeTransform = [
      [flipX, 0, tx],
      [0, 1, top],
    ]
    // Nudge by the ACTUAL rendered box so the visible top-left lands exactly on
    // the cascade target — flip-, width-, and overflow-agnostic. Must run AFTER
    // the caller reveals the bubble: absoluteRenderBounds is null while hidden.
    const finalizePlacement = () => {
      const box = instance.absoluteRenderBounds
      if (!box) return
      instance.x += left - box.x
      instance.y += top - box.y
    }
    return { ok: true, instance, created: true, finalizePlacement }
  }
}
