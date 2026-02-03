import { nonNullable } from '@likec4/core'
import type * as t from '@likec4/core/types'
import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { deriveToggledFeatures } from '../likec4diagram/state/machine.setup'
import type {
  DiagramActorSnapshot,
} from '../likec4diagram/state/types'
import { useDiagramActorRef } from './safeContext'
import { useCallbackRef } from './useCallbackRef'

const selectCompareLayoutState = ({ context }: DiagramActorSnapshot): {
  isEnabled: false
  hasEditor: false
  isEditable: false
  isActive: false
  drifts: never
  canApplyLatest: boolean
  layout: t.LayoutType
} | {
  isEnabled: true
  hasEditor: boolean
  isEditable: boolean
  isActive: boolean
  drifts: readonly [t.LayoutedViewDriftReason, ...t.LayoutedViewDriftReason[]]
  canApplyLatest: boolean
  layout: t.LayoutType
} => {
  const drifts = context.view.drifts ?? null
  if (!context.features.enableCompareWithLatest || !drifts || drifts.length === 0) {
    return ({
      hasEditor: false as const,
      isEnabled: false as const,
      isEditable: false as const,
      isActive: false as const,
      drifts: null as never,
      canApplyLatest: false,
      layout: context.view._layout ?? 'auto',
    })
  }

  const {
    enableCompareWithLatest,
    enableReadOnly,
  } = deriveToggledFeatures(context)

  return ({
    hasEditor: context.features.enableEditor,
    isEnabled: true as const,
    isEditable: !enableReadOnly,
    isActive: enableCompareWithLatest === true,
    drifts,
    canApplyLatest: !drifts.includes('type-changed'),
    layout: context.view._layout ?? 'auto',
  })
}

export type DiagramCompareLayoutState = ReturnType<typeof selectCompareLayoutState>

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
    const nextIsActive = force ? (force === 'on') : !state.isActive

    // Ensure that when disabling compare while in auto layout,
    // we switch back to manual layout
    if (state.isActive && !nextIsActive && state.layout === 'auto') {
      switchLayout('manual')
    }

    actorRef.send({
      type: 'toggle.feature',
      feature: 'CompareWithLatest',
      forceValue: nextIsActive,
    })
  })

  const resetManualLayout = useCallbackRef(() => {
    if (!state.isEnabled) {
      console.warn('Compare with latest feature is not enabled')
      return
    }
    actorRef.send({ type: 'layout.resetManualLayout' })
  })

  const applyLatestToManual = useCallbackRef(() => {
    if (!state.isEnabled) {
      console.warn('Compare with latest feature is not enabled')
      return
    }
    const editor = nonNullable(actorRef.system?.get('editor'), 'editor actor not found')
    editor.send({ type: 'applyLatestToManual' })

    if (state.isActive) {
      actorRef.send({
        type: 'toggle.feature',
        feature: 'CompareWithLatest',
        forceValue: false,
      })
    }
  })

  return [state, { toggleCompare, switchLayout, resetManualLayout, applyLatestToManual }]
}
