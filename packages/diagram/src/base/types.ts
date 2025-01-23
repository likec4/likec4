import type {
  Edge as RFEdge,
  EdgeProps as ReactFlowEdgeProps,
  Node as RFNode,
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
  RFNode<Base.NodeData & T, any>
>

/**
 * ReactFlow Custom Edge properties with BaseEdgeData at least
 */
export type EdgeProps<T extends Record<string, unknown> = {}> = SetRequired<
  ReactFlowEdgeProps<
    RFEdge<Base.EdgeData & T, any>
  >,
  'data'
>

export type ReactFlowNode<Data extends Record<string, unknown>, NodeType extends string> = SetRequired<
  RFNode<Data, NodeType>,
  'type' | 'initialWidth' | 'initialHeight'
>

export type ReactFlowEdge<Data extends Record<string, unknown>, EdgeType extends string> = SetRequired<
  RFEdge<Data, EdgeType>,
  'type' | 'data'
>

export namespace Base {
  // 'immediate' means that the node is dimmed without delay
  export type Dimmed = 'immediate' | boolean

  export type NodeData<Data extends Record<string, unknown> = {}> = Simplify<
    Data & {
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
  >

  export type Node = RFNode<NodeData>

  export type NodeProps = ReactFlowNodeProps<RFNode<Base.NodeData, any>>

  export type EdgeData<Data extends Record<string, unknown> = {}> = Simplify<
    Data & {
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
  >

  // export type Edge = SetRequired<ReactFlowEdge<EdgeData, 'relation'>, 'data' | 'type'>
  export type Edge = SetRequired<RFEdge<EdgeData>, 'data'>

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

  type WithData<D> = { data: D }
  function _setData<D, E extends WithData<D>>(value: E, state: Partial<NoInfer<D>>): E {
    if (hasSubObject(value.data as any, state as any)) {
      return value
    }
    return {
      ...value,
      data: {
        ...value.data,
        ...state,
      },
    }
  }
  export function setData<E extends WithData<any>>(value: E, state: Partial<E['data']>): E
  export function setData<E extends WithData<any>>(state: Partial<E['data']>): (value: E) => E
  export function setData<E extends WithData<any>>(arg1: E | Partial<E['data']>, arg2?: any) {
    if (arg2 !== undefined) {
      return _setData(arg1 as E, arg2)
    }
    return (edge: E) => _setData(edge, arg1 as Partial<EdgeData>)
  }
}
