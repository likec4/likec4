import type { ViewId } from '@likec4/core'
import type { DiagramContext } from '../likec4diagram/state/machine'
import { useDiagramContext } from './useDiagramContext'

const selectViewId = (state: DiagramContext) => state.view.id
export function useCurrentViewId(): ViewId {
  return useDiagramContext(selectViewId)
}
