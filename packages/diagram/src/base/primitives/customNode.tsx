import { deepEqual as eq } from 'fast-equals'
import { type FunctionComponent, memo } from 'react'
import type { NodeProps } from '../types'
import { DefaultHandles } from './NodeHandles'

export function nodePropsEqual<P extends NodeProps<any, any>>(prev: P, next: P) {
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

export function customNode<P extends Record<string, unknown> = {}, NodeType extends string = string>(
  Node: FunctionComponent<NodeProps<P, NodeType>>,
) {
  const NodeComponent = memo((props: NodeProps<P, NodeType>) => (
    <>
      <Node {...props} />
      <DefaultHandles />
    </>
  ), (prev, next) => nodePropsEqual(prev as NodeProps, next as NodeProps))
  NodeComponent.displayName = 'Node'
  return NodeComponent
}
