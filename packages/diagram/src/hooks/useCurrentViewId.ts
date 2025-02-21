import type { ViewId } from '@likec4/core'
import type { DiagramContext } from '../state/types'
import { useDiagramContext } from './useDiagram'

const selectViewId = (state: DiagramContext) => state.view.id
export function useCurrentViewId(): ViewId {
  return useDiagramContext(selectViewId)
}
