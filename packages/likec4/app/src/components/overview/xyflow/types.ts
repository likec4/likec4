import type { NonEmptyArray, Point } from '@likec4/core'
import type { ViewId as LikeC4ViewId } from '@likec4/core'
import type { Edge, InternalNode, Node, ReactFlowInstance, ReactFlowState, Rect } from '@xyflow/react'

export type FolderXYNode = Node<{
  dimmed: boolean
  label: string
  path: string
  rect: Rect
}, 'folder'>

export type FileXYNode = Node<{
  dimmed: boolean
  label: string
  path: string
  rect: Rect
}, 'file'>

export type ViewXYNode = Node<{
  dimmed: boolean
  label: string
  viewId: LikeC4ViewId
  rect: Rect
}, 'view'>

export type OverviewXYNode = FolderXYNode | FileXYNode | ViewXYNode

export type InternalXYFlowNode = InternalNode<OverviewXYNode>

export type OverviewXYEdge = Edge<{
  points: NonEmptyArray<Point>
}, 'link'>

export type OverviewXYFlowInstance = ReactFlowInstance<OverviewXYNode, OverviewXYEdge>
export type OverviewXYFlowState = ReactFlowState<OverviewXYNode, OverviewXYEdge>

export type OverviewXYFlowData = {
  nodes: OverviewXYNode[]
  edges: OverviewXYEdge[]
}
