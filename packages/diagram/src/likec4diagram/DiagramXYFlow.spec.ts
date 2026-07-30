import { describe, expect, it } from 'vitest'
import { resolveNodesDraggable } from './DiagramXYFlow'

describe('resolveNodesDraggable', () => {
  it.each([
    {
      nodesDraggable: true,
      override: undefined,
      isEditorBusy: false,
      expected: true,
    },
    {
      nodesDraggable: false,
      override: true,
      isEditorBusy: false,
      expected: true,
    },
    {
      nodesDraggable: true,
      override: false,
      isEditorBusy: false,
      expected: false,
    },
    {
      nodesDraggable: false,
      override: true,
      isEditorBusy: true,
      expected: false,
    },
  ])(
    'returns $expected for draggable=$nodesDraggable, override=$override, busy=$isEditorBusy',
    ({ nodesDraggable, override, isEditorBusy, expected }) => {
      expect(resolveNodesDraggable(nodesDraggable, override, isEditorBusy)).toBe(expected)
    },
  )
})
