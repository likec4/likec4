import type { LayoutedProjectEdge } from '@likec4/core/compute-view'
import type {
  DiagramNode,
  ExclusiveUnion,
  ProjectId,
} from '@likec4/core/types'
import type {
  ReactFlowInstance,
  ReactFlowState,
} from '@xyflow/react'
import type { FunctionComponent } from 'react'
import type { Simplify } from 'type-fest'
import type {
  BaseEdge,
  BaseEdgeData,
  BaseEdgeProps,
  BaseNode,
  BaseNodeData,
  BaseNodeProps,
  NonOptional,
} from '../base/types'

export namespace ProjectsOverviewTypes {
  export type ProjectNodeData = Simplify<
    & BaseNodeData
    & NonOptional<
      Pick<
        DiagramNode,
        | 'id'
        | 'title'
        | 'color'
        | 'shape'
        | 'style'
        | 'width'
        | 'height'
      >
    >
    & {
      projectId: ProjectId
    }
  >

  export type ProjectNode = BaseNode<ProjectNodeData, 'project'>

  export type AnyNode = ProjectNode

  export type NodeType = AnyNode['type']
  export type Node<T extends NodeType = NodeType> = Extract<AnyNode, { type: T }>
  export type NodeProps<T extends NodeType = NodeType> = BaseNodeProps<Node<T>>

  export type NodeData = ExclusiveUnion<{
    ProjectNodeData: ProjectNodeData
  }>

  export type NodeRenderer<T extends NodeType = NodeType> = FunctionComponent<NodeProps<T>>
  export type NodeRenderers = {
    [T in NodeType]: NodeRenderer<T>
  }

  // Extend the edge types provided by SharedFlowTypes with RelationshipsOfEdgeData

  export type EdgeData = Simplify<
    & BaseEdgeData
    & NonOptional<
      Pick<
        LayoutedProjectEdge,
        | 'id'
        | 'label'
        | 'labelBBox'
        | 'technology'
        | 'projectId'
        | 'points'
        | 'color'
        | 'line'
      >
    >
  >

  export type Edge = BaseEdge<EdgeData, 'relationship'>
  export type EdgeProps = BaseEdgeProps<Edge>
}

export type ProjectsOverviewXYFLowInstance = ReactFlowInstance<ProjectsOverviewTypes.Node, ProjectsOverviewTypes.Edge>

export type ProjectsOverviewXYStoreState = ReactFlowState<ProjectsOverviewTypes.Node, ProjectsOverviewTypes.Edge>
export type ProjectsOverviewXYStoreApi = {
  getState: () => ProjectsOverviewXYStoreState
  setState: (state: ProjectsOverviewXYStoreState) => void
}
