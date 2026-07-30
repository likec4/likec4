import { describe, expect, it } from 'vitest'
import { resolveInteractionEnabled } from './DiagramXYFlow'

describe('resolveInteractionEnabled', () => {
  it.each([
    {
      enabled: true,
      override: undefined,
      isEditorBusy: false,
      expected: true,
    },
    {
      enabled: false,
      override: true,
      isEditorBusy: false,
      expected: true,
    },
    {
      enabled: true,
      override: false,
      isEditorBusy: false,
      expected: false,
    },
    {
      enabled: false,
      override: true,
      isEditorBusy: true,
      expected: false,
    },
  ])(
    'returns $expected for enabled=$enabled, override=$override, busy=$isEditorBusy',
    ({ enabled, override, isEditorBusy, expected }) => {
      expect(resolveInteractionEnabled(enabled, override, isEditorBusy)).toBe(expected)
    },
  )
})
