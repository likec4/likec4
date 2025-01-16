import type {
  Edge as ReactFlowEdge,
  EdgeProps as ReactFlowEdgeProps,
  Node as ReactFlowNode,
  NodeProps as ReactFlowNodeProps,
} from '@xyflow/react'
import { hasSubObject } from 'remeda'
import type { OptionalKeysOf, SetRequired, Simplify } from 'type-fest'

/**

To cooperate with `exactOptionalPropertyTypes` in `tsconfig.json`

@example
```
interface User {
	name: string;
	surname?: string;
	luckyNumber?: number;
}

type NonOptionalUser = NonOptional<User>

// NonOptionalUser = {
//   name: string
//   surname: string | undefined
//   luckyNumber: number | undefined
// }
```
 */
export type NonOptional<T extends object, Keys extends OptionalKeysOf<T> = OptionalKeysOf<T>> = Simplify<
  & {
    [P in Exclude<keyof T, Keys>]: T[P]
  }
  & {
    [P in Keys]-?: T[P] | undefined
  }
>

/**
 * ReactFlow Custom Node properties with BaseNodeData at least
 */
export type NodeProps<T extends Record<string, unknown> = {}> = ReactFlowNodeProps<
  ReactFlowNode<BaseTypes.NodeData & T, any>
>

/**
 * ReactFlow Custom Edge properties with BaseEdgeData at least
 */
export type EdgeProps<T extends Record<string, unknown> = {}> = SetRequired<
  ReactFlowEdgeProps<
    ReactFlowEdge<BaseTypes.EdgeData & T, any>
  >,
  'data'
>

export namespace BaseTypes {
  // 'immediate' means that the node is dimmed without delay
  export type Dimmed = 'immediate' | boolean

  export type NodeData = {
    /**
     * Whether the cursor is hovering over the node
     */
    hovered?: boolean
    /**
     * Whether the node is dimmed
     * 'immediate' means that the node is dimmed without delay
     */
    dimmed?: Dimmed
  }

  export type Node = ReactFlowNode<NodeData>

  export type EdgeData = {
    /**
     * Whether the cursor is hovering over the edge
     */
    hovered?: boolean
    /**
     * Whether the edge is active (animated and highlighted)
     */
    active?: boolean
    /**
     * Whether the edge is dimmed
     * 'immediate' means that the edge is dimmed without delay
     */
    dimmed?: Dimmed
  }

  // export type Edge = SetRequired<ReactFlowEdge<EdgeData, 'relation'>, 'data' | 'type'>
  export type Edge = SetRequired<ReactFlowEdge<EdgeData>, 'data'>

  type WithDimmed = { data: { dimmed?: Dimmed } }
  type WithHovered = { data: { hovered?: boolean } }

  const _setDimmed = <T extends WithDimmed>(v: T, dimmed: Dimmed): T =>
    v.data.dimmed === dimmed ? v : ({
      ...v,
      data: {
        ...v.data,
        dimmed,
      },
    })

  export function setDimmed<T extends WithDimmed>(value: T, dimmed: 'immediate' | boolean): T
  export function setDimmed(dimmed: 'immediate' | boolean): <T extends WithDimmed>(value: T) => T
  export function setDimmed<T extends WithDimmed>(arg1: T | Dimmed, arg2?: Dimmed) {
    if (arg2 !== undefined) {
      return _setDimmed(arg1 as T, arg2)
    }
    return (v: T) => _setDimmed(v, arg1 as Dimmed)
  }

  const _setHovered = <T extends WithHovered>(v: T, hovered: boolean): T =>
    v.data.hovered === hovered ? v : ({
      ...v,
      data: {
        ...v.data,
        hovered,
      },
    })
  export function setHovered<T extends WithHovered>(value: T, hovered: boolean): T
  export function setHovered(hovered: boolean): <T extends WithHovered>(value: T) => T
  export function setHovered<T extends WithHovered>(arg1: T | boolean, arg2?: boolean) {
    if (arg2 !== undefined) {
      return _setHovered(arg1 as T, arg2)
    }
    return (v: T) => _setHovered(v, arg1 as boolean)
  }

  type WithEdgeData = { data: EdgeData }
  function _setEdgeState<E extends WithEdgeData>(edge: E, state: Partial<EdgeData>): E {
    if (hasSubObject(edge.data, state)) {
      return edge
    }
    return {
      ...edge,
      data: {
        ...edge.data,
        ...state,
      },
    }
  }
  export function setEdgeState<E extends WithEdgeData>(edge: E, state: Partial<EdgeData>): E
  export function setEdgeState(state: Partial<EdgeData>): <E extends WithEdgeData>(edge: E) => E
  export function setEdgeState<E extends WithEdgeData>(arg1: E | Partial<EdgeData>, arg2?: Partial<EdgeData>) {
    if (arg2 !== undefined) {
      return _setEdgeState(arg1 as E, arg2)
    }
    return (edge: E) => _setEdgeState(edge, arg1 as Partial<EdgeData>)
  }
}
