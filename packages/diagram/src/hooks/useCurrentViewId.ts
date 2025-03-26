import type { ViewId } from '@likec4/core'
import type { DiagramActorSnapshot } from '../state/types'
import { useDiagramActorSnapshot } from './useDiagram'

const selectViewId = (s: DiagramActorSnapshot) => s.context.view.id
export function useCurrentViewId(): ViewId {
  return useDiagramActorSnapshot(selectViewId)
}
