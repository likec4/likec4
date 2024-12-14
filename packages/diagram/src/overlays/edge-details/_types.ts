import type { AddEdgeData } from '../../utils/types'
import type { SharedTypes } from '../shared/xyflow/_types'

export namespace XYFlowTypes {
  type EdgeDetailsEdgeData = {
    technology: string | null
    description: string | null
  }

  export type Edge = AddEdgeData<SharedTypes.Edge, EdgeDetailsEdgeData>
}
