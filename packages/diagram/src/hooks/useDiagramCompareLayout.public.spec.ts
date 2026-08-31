import type { LayoutedViewDriftReason } from '@likec4/core/types'
import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  type DiagramCompareLayoutOps,
  type DiagramCompareLayoutState,
  useDiagramCompareLayout as publicHook,
} from '../index'
import type { DiagramActorSnapshot } from '../likec4diagram/state/types'
import {
  selectCompareLayoutState,
  useDiagramCompareLayout as internalHook,
} from './useDiagramCompareLayout'

const snapshot = ({
  drifts,
  compareEnabled,
}: {
  drifts: readonly [LayoutedViewDriftReason, ...LayoutedViewDriftReason[]] | null
  compareEnabled: boolean
}) =>
  ({
    context: {
      activeWalkthrough: null,
      features: {
        enableCompareWithLatest: true,
        enableEditor: true,
        enableReadOnly: false,
      },
      toggledFeatures: {
        enableCompareWithLatest: compareEnabled,
        enableReadOnly: false,
      },
      view: {
        _layout: 'manual',
        drifts,
      },
    },
  }) as DiagramActorSnapshot

describe('useDiagramCompareLayout public API', () => {
  it('exports the built-in manual-layout controller from the package root', () => {
    expect(publicHook).toBe(internalHook)
    expectTypeOf<ReturnType<typeof publicHook>>().toEqualTypeOf<[
      DiagramCompareLayoutState,
      DiagramCompareLayoutOps,
    ]>()
  })

  it('returns null drifts when comparison is unavailable', () => {
    const state = selectCompareLayoutState(snapshot({
      drifts: null,
      compareEnabled: false,
    }))

    expect(state.isEnabled).toBe(false)
    if (!state.isEnabled) {
      const drifts: null = state.drifts
      expect(drifts).toBeNull()
    }
  })

  it('returns non-empty drifts when comparison is available', () => {
    const state = selectCompareLayoutState(snapshot({
      drifts: ['nodes-added'],
      compareEnabled: true,
    }))

    expect(state.isEnabled).toBe(true)
    if (state.isEnabled) {
      const drifts: readonly [LayoutedViewDriftReason, ...LayoutedViewDriftReason[]] = state.drifts
      expect(drifts).toEqual(['nodes-added'])
    }
  })
})
