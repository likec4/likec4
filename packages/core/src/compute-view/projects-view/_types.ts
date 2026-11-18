import type {
  _stage,
  _type,
  BaseViewProperties,
  BBox,
  ComputedEdge,
  ComputedNode,
  DiagramEdge,
  DiagramNode,
  ImportedProjectSource,
  ProjectId,
  ViewAutoLayout,
} from '../../types'

/**
 * Describes a node of the projects overview that represents an external project:
 * a dependency imported by a workspace project, that is not a workspace project itself.
 */
export interface ExternalProjectNodeInfo {
  /**
   * Workspace project that imports the external project
   */
  readonly importedBy: ProjectId
  /**
   * Name of the import, as written by the importing project (`import ... from 'name'`)
   */
  readonly importName: ProjectId
  /**
   * Where the external project comes from, as declared by the importing project
   */
  readonly source: ImportedProjectSource
}

export interface ComputedProjectNode extends ComputedNode {
  /**
   * Id of the workspace project.
   * For external projects (see {@link external}) this is a synthetic id
   * in format `<importName>@<importedBy>`, it never matches a workspace project id.
   */
  readonly projectId: ProjectId
  /**
   * Present only if the node represents an external project (not a workspace project)
   */
  readonly external?: ExternalProjectNodeInfo
}

export interface ComputedProjectEdge extends ComputedEdge {
  readonly projectId: ProjectId
}

export interface LayoutedProjectNode extends DiagramNode {
  /**
   * Id of the workspace project, or a synthetic id for external projects
   * (see {@link ComputedProjectNode.projectId})
   */
  readonly projectId: ProjectId
  /**
   * Present only if the node represents an external project (not a workspace project)
   */
  readonly external?: ExternalProjectNodeInfo
}

export interface LayoutedProjectEdge extends DiagramEdge {
  readonly projectId: ProjectId
}

/**
 * An overview of projects and their relationships, presented as a graph with nodes and edges.
 * Even though it has same structure as other likec4 views, it is not mixed with them, as it represents a different kind.
 */
export interface ComputedProjectsView extends BaseViewProperties<any> {
  readonly [_type]: 'projects'
  readonly [_stage]: 'computed'
  readonly nodes: ReadonlyArray<ComputedProjectNode>
  readonly edges: ReadonlyArray<ComputedProjectEdge>
  readonly autoLayout: ViewAutoLayout
}

export interface LayoutedProjectsView extends BaseViewProperties<any> {
  readonly [_type]: 'projects'
  readonly [_stage]: 'layouted'
  readonly nodes: ReadonlyArray<LayoutedProjectNode>
  readonly edges: ReadonlyArray<LayoutedProjectEdge>
  readonly bounds: BBox
}
