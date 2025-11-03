import type * as t from '@likec4/core/types'
import { useCallbackRef } from '@mantine/hooks'
import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import type {
  DiagramActorSnapshot,
} from '../likec4diagram/state/types'
import { useDiagramActorRef } from './safeContext'

const selectCompareLayoutState = ({ context }: DiagramActorSnapshot) => {
  const drifts = context.view.drifts ?? null
  if (!context.features.enableCompareWithLatest || !drifts) {
    return ({
      isEnabled: false as const,
      isActive: false as const,
      drifts: [] as never[],
      layout: context.view._layout ?? 'auto',
    })
  }

  return ({
    isEnabled: true as const,
    isActive: context.toggledFeatures.enableCompareWithLatest === true,
    drifts,
    layout: context.view._layout ?? 'auto',
  })
}
type DiagramCompareLayoutState = ReturnType<typeof selectCompareLayoutState>
type DiagramCompareLayoutOps = {
  toggleCompare: (force?: 'on' | 'off') => void
  switchLayout: (layoutType: t.LayoutType) => void
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

    // Ensure that when disabling compare while in manual layout, we switch back to manual layout to reset the layout state
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

  return [state, { toggleCompare, switchLayout, resetManualLayout }]
}
