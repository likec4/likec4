import { describe, expect, it } from 'vitest'
import { resolveControlledViewport, resolveInteractionEnabled } from './DiagramXYFlow'

describe('resolveControlledViewport', () => {
  const bounds = { x: 100, y: 200 }

  it('leaves an explicit initial zoom under diagram actor control when fit is disabled', () => {
    expect(resolveControlledViewport(false, 0.75, bounds)).toBeUndefined()
  })

  it('preserves the top-left zoom-1 viewport when fit and initial zoom are disabled', () => {
    expect(resolveControlledViewport(false, undefined, bounds)).toEqual({
      x: -100,
      y: -200,
      zoom: 1,
    })
  })
})

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
