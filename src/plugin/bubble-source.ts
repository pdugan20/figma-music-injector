import { getSelectionStatus } from './selection'

export type BubbleResolution = { ok: true; instance: InstanceNode } | { ok: false; message: string }

export interface BubbleSource {
  resolve(): BubbleResolution
}

export class SelectionBubbleSource implements BubbleSource {
  resolve(): BubbleResolution {
    const selection = figma.currentPage.selection
    const status = getSelectionStatus(selection)
    if (!status.ok) return { ok: false, message: status.message }
    return { ok: true, instance: selection[0] as InstanceNode }
  }
}
