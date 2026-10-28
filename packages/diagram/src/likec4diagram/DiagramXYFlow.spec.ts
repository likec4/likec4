import { describe, expect, it } from 'vitest'
import {
  resolveControlledViewport,
  resolveInteractionEnabled,
  shouldCollapseSelectionOnClick,
} from './DiagramXYFlow'

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
      isEditorLocked: false,
      expected: true,
    },
    {
      enabled: false,
      override: true,
      isEditorLocked: false,
      expected: true,
    },
    {
      enabled: true,
      override: false,
      isEditorLocked: false,
      expected: false,
    },
    {
      enabled: false,
      override: true,
      isEditorLocked: true,
      expected: false,
    },
  ])(
    'returns $expected for enabled=$enabled, override=$override, locked=$isEditorLocked',
    ({ enabled, override, isEditorLocked, expected }) => {
      expect(resolveInteractionEnabled(enabled, override, isEditorLocked)).toBe(expected)
    },
  )
})

describe('shouldCollapseSelectionOnClick', () => {
  const base = {
    nodesSelectable: true,
    isNodeSelected: true,
    selectedNodesCount: 3,
    hasModifierKey: false,
  }

  it('collapses multi-selection to the clicked node on plain click', () => {
    expect(shouldCollapseSelectionOnClick(base)).toBe(true)
  })

  it('keeps selection when a modifier key is pressed', () => {
    expect(shouldCollapseSelectionOnClick({ ...base, hasModifierKey: true })).toBe(false)
  })

  it('keeps selection when the clicked node is not selected or is the only selected node', () => {
    expect(shouldCollapseSelectionOnClick({ ...base, isNodeSelected: false })).toBe(false)
    expect(shouldCollapseSelectionOnClick({ ...base, selectedNodesCount: 1 })).toBe(false)
  })

  it('keeps selection when nodes are not selectable', () => {
    expect(shouldCollapseSelectionOnClick({ ...base, nodesSelectable: false })).toBe(false)
  })
})
