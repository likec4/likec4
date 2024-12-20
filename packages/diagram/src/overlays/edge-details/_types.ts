import type { AddEdgeData } from '../../utils/types'
import type { SharedFlowTypes } from '../shared/xyflow/_types'

export namespace EdgeDetailsFlowTypes {

  /**
   * Data that is exclusive to the edge-details overlay. It will be merged into the edge types
   * provided by SharedFlowTypes.
   */
  type EdgeDetailsEdgeData = {
    technology: string | null
    description: string | null
  }

  // Extend the edge types provided by SharedFlowTypes with EdgeDetailsEdgeData

  export type Edge = AddEdgeData<SharedFlowTypes.Edge, EdgeDetailsEdgeData>
}
