import { deepEqual as eq } from 'fast-equals'
import { type FunctionComponent, memo } from 'react'
import type { BaseNodeProps } from '../types'

function nodePropsEqual<P extends BaseNodeProps>(prev: Readonly<P>, next: Readonly<P>) {
  return (
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
}

export function customNode<P extends BaseNodeProps>(
  Node: FunctionComponent<P>,
): FunctionComponent<P> {
  const NodeComponent = memo(
    Node,
    nodePropsEqual,
  )
  NodeComponent.displayName = 'Node'
  return NodeComponent
}
