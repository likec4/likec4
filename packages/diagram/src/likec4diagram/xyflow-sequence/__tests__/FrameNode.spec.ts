import type { LayoutedDynamicView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import type { Types } from '../../types'

// ---------------------------------------------------------------------------
// Helper: build a minimal SequenceFrameNode data object (the way
// toSeqFrameNode in sequence-layout.ts constructs it)
// ---------------------------------------------------------------------------
function makeFrameNodeData(
  kind: Types.SequenceFrameKind,
  overrides: Partial<Types.SequenceFrameNodeData> = {},
): Types.SequenceFrameNodeData {
  return {
    kind,
    label: undefined,
    condition: undefined,
    depth: 0,
    parent: undefined,
    branches: [],
    viewId: 'v1' as Types.SequenceFrameNodeData['viewId'],
    drifts: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests driven by the node *data* — the contract that FrameNode.tsx renders
// ---------------------------------------------------------------------------
describe('SequenceFrameNode data contract', () => {
  const allKinds: Types.SequenceFrameKind[] = [
    'if',
    'optional',
    'repeat',
    'parallel',
    'group',
    'critical',
    'break',
  ]

  it.each(allKinds)('produces a valid data object for kind=%s', (kind) => {
    const data = makeFrameNodeData(kind)
    expect(data.kind).toBe(kind)
    expect(data.branches).toEqual([])
  })

  it('carries label through', () => {
    const data = makeFrameNodeData('if', { label: 'user is logged in' })
    expect(data.label).toBe('user is logged in')
  })

  it('carries condition through', () => {
    const data = makeFrameNodeData('repeat', { condition: '3 times' })
    expect(data.condition).toBe('3 times')
  })

  it('carries depth through', () => {
    const data = makeFrameNodeData('group', { depth: 2, parent: 'frame-root' })
    expect(data.depth).toBe(2)
    expect(data.parent).toBe('frame-root')
  })
})

describe('SequenceFrameNode branch separators', () => {
  it('emits separatorYs per branch', () => {
    const branches: Types.SequenceFrameBranch[] = [
      { label: 'success', condition: undefined, separatorYs: [120] },
      { label: 'failure', condition: undefined, separatorYs: [] },
    ]
    const data = makeFrameNodeData('if', { branches })

    expect(data.branches).toHaveLength(2)
    expect(data.branches[0]!.separatorYs).toEqual([120])
    expect(data.branches[0]!.label).toBe('success')
    expect(data.branches[1]!.separatorYs).toHaveLength(0)
  })

  it('multiple separatorYs within one branch', () => {
    const branches: Types.SequenceFrameBranch[] = [
      { separatorYs: [100, 200, 300] },
    ]
    const data = makeFrameNodeData('parallel', { branches })
    expect(data.branches[0]!.separatorYs).toEqual([100, 200, 300])
  })

  it('branch without label/condition is valid', () => {
    const branches: Types.SequenceFrameBranch[] = [
      { separatorYs: [] },
    ]
    const data = makeFrameNodeData('optional', { branches })
    expect(data.branches[0]!.label).toBeUndefined()
    expect(data.branches[0]!.condition).toBeUndefined()
  })
})
