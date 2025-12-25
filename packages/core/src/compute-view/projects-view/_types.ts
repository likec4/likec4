import type {
  _stage,
  BaseViewProperties,
  BBox,
  ComputedEdge,
  ComputedNode,
  DiagramEdge,
  DiagramNode,
  ViewAutoLayout,
} from '../../types'

/**
 * An overview of projects and their relationships, presented as a graph with nodes and edges.
 * Even though it has same structure as other likec4 views, it is not mixed with them, as it represents a different kind.
 */
export interface ComputedProjectsView extends BaseViewProperties<any> {
  readonly [_stage]: 'computed'
  readonly nodes: ReadonlyArray<ComputedNode>
  readonly edges: ReadonlyArray<ComputedEdge>
  readonly autoLayout: ViewAutoLayout
}

export interface LayoutedProjectsView extends BaseViewProperties<any> {
  readonly [_stage]: 'layouted'
  readonly nodes: ReadonlyArray<DiagramNode>
  readonly edges: ReadonlyArray<DiagramEdge>
  readonly bounds: BBox
}
