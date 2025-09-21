import type { ViewId } from '@likec4/core/types'
import { useSelector } from '@xstate/react'
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
