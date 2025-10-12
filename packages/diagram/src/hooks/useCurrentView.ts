import type { LayoutedView, ViewId } from '@likec4/core/types'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import type { DiagramActorSnapshot } from '../likec4diagram/state/types'
import { useDiagramActorRef } from './useDiagram'

const selectViewId = (s: DiagramActorSnapshot) => s.context.view.id

/**
 * Returns current view id
 * Should be used only inside LikeC4Diagram
 */
export function useCurrentViewId(): ViewId {
  const actorRef = useDiagramActorRef()
  return useSelector(actorRef, selectViewId)
}

const selectView = (s: DiagramActorSnapshot) => s.context.view
/**
 * Returns current view
 * Should be used only inside LikeC4Diagram
 */
export function useCurrentView(): LayoutedView {
  const actorRef = useDiagramActorRef()
  return useSelector(actorRef, selectView, shallowEqual)
}
