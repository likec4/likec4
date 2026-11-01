import { nonNullable } from '@likec4/core'
import type * as t from '@likec4/core/types'
import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { deriveToggledFeatures, isComparingLayouts } from '../likec4diagram/state/machine.setup'
import type {
  DiagramActorSnapshot,
} from '../likec4diagram/state/types'
import { typedSystem } from '../likec4diagram/state/utils'
import { useDiagramActorRef } from './safeContext'
import { useCallbackRef } from './useCallbackRef'

export function selectCompareLayoutState(snapshot: DiagramActorSnapshot): {
  isEnabled: false
  hasEditor: boolean
  isEditable: false
  state: 'inactive'
  drifts: null
  canApplyLatest: boolean
  layout: t.LayoutType
} | {
  isEnabled: true
  hasEditor: boolean
  isEditable: boolean
  state: 'comparing' | 'inactive'
  drifts: readonly [t.LayoutedViewDriftReason, ...t.LayoutedViewDriftReason[]]
  canApplyLatest: boolean
  layout: t.LayoutType
} {
  const { context } = snapshot
  const hasEditor = context.features.enableEditor
  const drifts = context.view.drifts ?? null
  if (!context.features.enableCompareWithLatest || !drifts || drifts.length === 0) {
    return ({
      hasEditor,
      isEnabled: false as const,
      isEditable: false as const,
      state: 'inactive' as const,
      drifts: null,
      canApplyLatest: false,
      layout: context.view._layout ?? 'auto',
    })
  }

  const { enableReadOnly } = deriveToggledFeatures(snapshot)

  const isEditable = !enableReadOnly && hasEditor

  return ({
    hasEditor,
    isEnabled: true as const,
    isEditable,
    state: isComparingLayouts(snapshot) ? 'comparing' : 'inactive',
    drifts,
    canApplyLatest: hasEditor && !drifts.includes('type-changed'),
    layout: context.view._layout ?? 'auto',
  })
}

/**
 * Current manual-layout comparison state exposed by {@link useDiagramCompareLayout}.
 */
export type DiagramCompareLayoutState = ReturnType<typeof selectCompareLayoutState>

/**
 * Manual-layout actions exposed by {@link useDiagramCompareLayout}.
 */
export type DiagramCompareLayoutOps = {
  /**
   * Toggles the compare mode on or off.
   */
  toggleCompare: (force?: 'on' | 'off') => void
  /**
   * Switches the layout type between 'auto' and 'manual'.
   */
  switchLayout: (layoutType: t.LayoutType) => void

  /**
   * Merges the latest layout into the manual layout.
   */
  applyLatestToManual: () => void

  /**
   * Resets the manual layout to its default state.
   */
  resetManualLayout: () => void
}

/**
 * Controls LikeC4's manual-layout comparison from custom diagram children.
 *
 * The hook must be called by a component rendered inside {@link LikeC4Diagram}.
 */
export function useDiagramCompareLayout(): [
  DiagramCompareLayoutState,
  DiagramCompareLayoutOps,
] {
  const actorRef = useDiagramActorRef()
  const state = useXstateSelector(actorRef, selectCompareLayoutState, shallowEqual)

  const switchLayout = useCallbackRef((layoutType: t.LayoutType) => {
    if (!state.isEnabled) {
      console.warn('Compare with latest feature is not enabled')
      return
    }
    actorRef.send({ type: 'emit.onLayoutTypeChange', layoutType })
  })

  const toggleCompare = useCallbackRef((force?: 'on' | 'off') => {
    if (!state.isEnabled) {
      console.warn('Compare with latest feature is not enabled')
      return
    }
    const nextIsActive = force ? (force === 'on') : state.state === 'inactive'
    // Switching back to manual layout on exit is handled by the diagram machine
    actorRef.send({ type: nextIsActive ? 'compare.start' : 'compare.end' })
  })

  const resetManualLayout = useCallbackRef(() => {
    actorRef.send({ type: 'layout.resetManualLayout' })
  })

  const applyLatestToManual = useCallbackRef(() => {
    if (!state.isEnabled) {
      console.warn('Compare with latest feature is not enabled')
      return
    }

    const editor = nonNullable(typedSystem(actorRef.system).editorActorRef, 'editor actor not found')
    editor.send({ type: 'change.latest-to-manual' })

    if (state.state === 'comparing') {
      actorRef.send({ type: 'compare.end' })
    }
  })

  return [state, { toggleCompare, switchLayout, resetManualLayout, applyLatestToManual }]
}
