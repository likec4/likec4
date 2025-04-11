import type { ViewId } from '@likec4/core'
import { useSelector } from '@xstate/react'
import type { DiagramActorSnapshot } from '../state/types'
import { useDiagramActorRef } from './useDiagram'

const selectViewId = (s: DiagramActorSnapshot) => s.context.view.id
export function useCurrentViewId(): ViewId {
  const actorRef = useDiagramActorRef()
  return useSelector(actorRef, selectViewId)
}
