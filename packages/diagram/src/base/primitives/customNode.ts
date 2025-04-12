import { deepEqual as eq } from 'fast-equals'
import { type FunctionComponent, memo } from 'react'
import type { Base, NodeProps } from '../types'

export const nodePropsEqual = <P extends Record<string, unknown> = Base.NodeData>(
  prev: NodeProps<P>,
  next: NodeProps<P>,
) => (
  prev.id === next.id
  && eq(prev.selected ?? false, next.selected ?? false)
  && eq(prev.dragging ?? false, next.dragging ?? false)
  && eq(prev.width ?? 0, next.width ?? 0)
  && eq(prev.height ?? 0, next.height ?? 0)
  && eq(prev.zIndex ?? 0, next.zIndex ?? 0)
  // we can ignore position, as custom nodes positioned relative to it's NodeRenderer
  // && eq(prev.positionAbsoluteX, next.positionAbsoluteX)
  // && eq(prev.positionAbsoluteY, next.positionAbsoluteY)
  && eq(prev.data, next.data)
)

export function customNode<P extends Record<string, unknown> = Base.NodeData>(
  Node: FunctionComponent<NodeProps<P>>,
) {
  return memo(Node, nodePropsEqual)
}
