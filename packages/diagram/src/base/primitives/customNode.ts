import { deepEqual as eq } from 'fast-equals'
import { type FunctionComponent, memo } from 'react'
import type { BaseTypes, NodeProps } from '../types'

const isEqualProps = <P extends Record<string, unknown> = BaseTypes.NodeData>(
  prev: NodeProps<P>,
  next: NodeProps<P>,
) => (
  prev.id === next.id
  && eq(prev.selected ?? false, next.selected ?? false)
  && eq(prev.dragging ?? false, next.dragging ?? false)
  && eq(prev.width ?? 0, next.width ?? 0)
  && eq(prev.height ?? 0, next.height ?? 0)
  && eq(prev.data, next.data)
)

export function customNode<P extends Record<string, unknown> = BaseTypes.NodeData>(
  Node: FunctionComponent<NodeProps<P>>,
) {
  return memo(Node, isEqualProps)
}
