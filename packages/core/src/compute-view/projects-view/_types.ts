import type { _stage, BaseViewProperties, ComputedEdge, ComputedNode } from '../../types'

// type Pair = {
//   left: ReadonlySet<ElementModel>
//   relationships: ReadonlySet<RelationshipModel>
//   right: ReadonlySet<ElementModel>
// }

export interface ComputedProjectsView extends BaseViewProperties<any> {
  [_stage]: 'computed'
  nodes: ComputedNode[]
  edges: ComputedEdge[]
}
