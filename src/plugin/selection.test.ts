import { describe, it, expect } from 'vitest'
import { getSelectionStatus } from './selection'
import { LAYER } from './bubble-schema'

function instanceWithSong() {
  return {
    type: 'INSTANCE',
    findOne: (p: (n: { name: string }) => boolean) => (p({ name: LAYER.SONG_NAME }) ? {} : null),
  }
}

describe('getSelectionStatus', () => {
  it('empty selection offers to insert', () => {
    expect(getSelectionStatus([] as never).message).toBe('A new bubble will be added')
  })

  it('multiple selection offers to insert', () => {
    expect(getSelectionStatus([{}, {}] as never).message).toBe('A new bubble will be added')
  })

  it('non-instance offers to insert', () => {
    const status = getSelectionStatus([{ type: 'RECTANGLE' }] as never)
    expect(status.ok).toBe(false)
    expect(status.message).toBe('A new bubble will be added')
  })

  it('instance missing Song Name offers to insert', () => {
    const node = { type: 'INSTANCE', findOne: () => null }
    expect(getSelectionStatus([node] as never).ok).toBe(false)
  })

  it('valid Music Bubble instance', () => {
    const status = getSelectionStatus([instanceWithSong()] as never)
    expect(status.ok).toBe(true)
    expect(status.message).toBe('1 layer selected')
  })
})
