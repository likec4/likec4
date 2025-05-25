import { invariant } from '@likec4/core'
import type { AnyAux, LikeC4ViewModel } from '@likec4/core/model'
import type { DiagramView, ViewId } from '@likec4/core/types'
import { useSelector } from '@xstate/react'
import { useLikeC4Model } from '../likec4model/useLikeC4Model'
import type { DiagramActorSnapshot } from '../state/types'
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
