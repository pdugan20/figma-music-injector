import { getSelectionStatus } from './selection'
import { LAYER, DYNAMIC_COLORS } from './bubble-schema'

export type BubbleResolution =
  | { ok: true; instance: InstanceNode; created: boolean }
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

// Parent the new instance on the current page and center it in the viewport,
// preserving the source's horizontal flip so a mirror-authored bubble keeps
// reading correctly. The bubble has no rotation or shear, so a flip-and-
// translate transform is exact. The instance is hidden until the caller
// populates it — a cloned bubble carries the source's track data, which would
// otherwise flash on screen during the async fill. Returns the placed instance.
function place(instance: InstanceNode, source: SceneNode): InstanceNode {
  instance.visible = false
  figma.currentPage.appendChild(instance)
  const flipX = source.relativeTransform[0][0] < 0 ? -1 : 1
  const center = figma.viewport.center
  const left = Math.round(center.x - instance.width / 2)
  const top = Math.round(center.y - instance.height / 2)
  // For a horizontally flipped node the translation sits at the right edge.
  const tx = flipX < 0 ? left + instance.width : left
  const transform: Transform = [
    [flipX, 0, tx],
    [0, 1, top],
  ]
  instance.relativeTransform = transform
  return instance
}

export class CanvasBubbleSource implements BubbleSource {
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

    if (existing) return { ok: true, instance: place(existing.clone(), existing), created: true }

    const component = findComponentSource()
    if (!component) return { ok: false, message: 'Could not find a Music Bubble to use' }
    return { ok: true, instance: place(component.createInstance(), component), created: true }
  }
}
