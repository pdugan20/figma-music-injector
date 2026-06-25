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
  it('empty selection', () => {
    expect(getSelectionStatus([] as never).message).toBe('Select a Music Bubble layer')
  })

  it('multiple selection', () => {
    expect(getSelectionStatus([{}, {}] as never).message).toBe('Select a single Music Bubble layer')
  })

  it('non-instance', () => {
    expect(getSelectionStatus([{ type: 'RECTANGLE' }] as never).ok).toBe(false)
  })

  it('instance missing Song Name', () => {
    const node = { type: 'INSTANCE', findOne: () => null }
    expect(getSelectionStatus([node] as never).ok).toBe(false)
  })

  it('valid Music Bubble instance', () => {
    const status = getSelectionStatus([instanceWithSong()] as never)
    expect(status.ok).toBe(true)
    expect(status.message).toBe('1 layer selected')
  })
})
