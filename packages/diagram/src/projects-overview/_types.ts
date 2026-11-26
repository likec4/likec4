import type { LayoutedProjectEdge } from '@likec4/core/compute-view'
import type {
  Color,
  ComputedNodeStyle,
  DiagramNode,
  EdgeRouting,
  ExclusiveUnion,
  NodeId,
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
      /** Edges that point to this project, among the visible edges */
      fanIn?: number | undefined
      /** Edges that leave this project, among the visible edges */
      fanOut?: number | undefined
    }
  >

  export type ProjectNode = BaseNode<ProjectNodeData, 'project'>

  export type GroupNodeData = Simplify<
    & BaseNodeData
    & {
      id: NodeId
      title: string
      color: Color
      depth: number
      style: ComputedNodeStyle
      width: number
      height: number
    }
  >

  export type GroupNode = BaseNode<GroupNodeData, 'project-group'>

  export type AnyNode = ProjectNode | GroupNode

  export type NodeType = AnyNode['type']
  export type Node<T extends NodeType = NodeType> = Extract<AnyNode, { type: T }>
  export type NodeProps<T extends NodeType = NodeType> = BaseNodeProps<Node<T>>

  export type NodeData = ExclusiveUnion<{
    ProjectNodeData: ProjectNodeData
    GroupNodeData: GroupNodeData
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
    & {
      routing: EdgeRouting
    }
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
