import type { ViewId } from '@likec4/core'
import { type DiagramContext, useDiagramContext } from '../hooks2'

export * from './useDiagramState'
export * from './useMantinePortalProps'
export * from './useSetState'
export * from './useUpdateEffect'
export * from './useXYFlow'

const selectViewId = (state: DiagramContext) => state.view.id
export function useCurrentViewId(): ViewId {
  return useDiagramContext(selectViewId)
}
