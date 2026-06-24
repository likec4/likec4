import { describe, expect, it } from 'vitest'
import type { Types } from '../../types'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function makeNoteNodeData(
  placement: Types.SequenceNoteNodeData['placement'],
  text: string,
): Types.SequenceNoteNodeData {
  return {
    placement,
    text,
    viewId: 'v1' as Types.SequenceNoteNodeData['viewId'],
    drifts: null,
  }
}

describe('SequenceNoteNode data contract', () => {
  const placements: Types.SequenceNoteNodeData['placement'][] = ['over', 'left', 'right']

  it.each(placements)('produces a valid data object for placement=%s', (placement) => {
    const data = makeNoteNodeData(placement, 'Some note text')
    expect(data.placement).toBe(placement)
    expect(data.text).toBe('Some note text')
  })

  it('carries multi-line text through', () => {
    const text = 'Line 1\nLine 2\nLine 3'
    const data = makeNoteNodeData('over', text)
    expect(data.text).toBe(text)
  })

  it('placement=over does not affect stored text', () => {
    const data = makeNoteNodeData('over', 'hello')
    expect(data.text).toBe('hello')
    expect(data.placement).toBe('over')
  })

  it('placement=left is distinct from right', () => {
    const left = makeNoteNodeData('left', 'note')
    const right = makeNoteNodeData('right', 'note')
    expect(left.placement).not.toBe(right.placement)
  })
})
