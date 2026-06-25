import { describe, it, expect, afterEach } from 'vitest'
import { SelectionBubbleSource } from './bubble-source'

function setSelection(selection: unknown[]) {
  ;(globalThis as { figma?: unknown }).figma = { currentPage: { selection } }
}

afterEach(() => {
  delete (globalThis as { figma?: unknown }).figma
})

describe('SelectionBubbleSource', () => {
  it('resolves the selected Music Bubble instance', () => {
    const instance = { type: 'INSTANCE', findOne: () => ({}) }
    setSelection([instance])
    expect(new SelectionBubbleSource().resolve()).toEqual({ ok: true, instance })
  })

  it('fails with a message when selection is invalid', () => {
    setSelection([])
    const res = new SelectionBubbleSource().resolve()
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe('Select a Music Bubble layer')
  })
})
