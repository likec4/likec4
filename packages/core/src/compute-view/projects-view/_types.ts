import type {
  _stage,
  BaseViewProperties,
  BBox,
  ComputedEdge,
  ComputedNode,
  DiagramEdge,
  DiagramNode,
  ProjectId,
  ViewAutoLayout,
} from '../../types'

export interface ComputedProjectNode extends ComputedNode {
  readonly projectId: ProjectId
}

export interface ComputedProjectEdge extends ComputedEdge {
  readonly projectId: ProjectId
}

export interface LayoutedProjectNode extends DiagramNode {
  readonly projectId: ProjectId
}

export interface LayoutedProjectEdge extends DiagramEdge {
  readonly projectId: ProjectId
}

/**
 * An overview of projects and their relationships, presented as a graph with nodes and edges.
 * Even though it has same structure as other likec4 views, it is not mixed with them, as it represents a different kind.
 */
export interface ComputedProjectsView extends BaseViewProperties<any> {
  readonly [_stage]: 'computed'
  readonly nodes: ReadonlyArray<ComputedProjectNode>
  readonly edges: ReadonlyArray<ComputedProjectEdge>
  readonly autoLayout: ViewAutoLayout
}

export interface LayoutedProjectsView extends BaseViewProperties<any> {
  readonly [_stage]: 'layouted'
  readonly nodes: ReadonlyArray<LayoutedProjectNode>
  readonly edges: ReadonlyArray<LayoutedProjectEdge>
  readonly bounds: BBox
}
