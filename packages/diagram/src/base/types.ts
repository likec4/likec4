import type {
  Edge,
  EdgeProps,
  Node,
  NodeProps,
} from '@xyflow/react'

import { hasSubObject } from 'remeda'
import type { OptionalKeysOf, SetRequired, Simplify } from 'type-fest'

export type BaseNodeData = {
  /**
   * Whether the cursor is hovering over the node
   */
  hovered?: boolean
  /**
   * Whether the node is dimmed
   * 'immediate' means that the node is dimmed without delay
   */
  dimmed?: Base.Dimmed
}

export type BaseEdgeData = {
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
  dimmed?: Base.Dimmed
}

// We do these aliases to ensure bundled type definitions are correct (see packages/likec4/react)
export type BaseNode<
  Data extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string = string,
> = SetRequired<
  Node<Data & BaseNodeData, NodeType>,
  'type' | 'initialWidth' | 'initialHeight'
>

export interface BaseEdge<
  Data extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string = string,
> extends
  SetRequired<
    Edge<Data & BaseEdgeData, EdgeType>,
    'type' | 'data'
  >
{}

/**
 * ReactFlow Base Node properties with BaseNodeData at least
 */
export interface BaseNodeProps<N extends BaseNode = BaseNode> extends NodeProps<N> {}
export type BaseNodePropsWithData<Data extends Record<string, unknown>> = BaseNodeProps<BaseNode<Data>>

/**
 * ReactFlow Base Edge properties with BaseEdgeData at least
 */
export interface BaseEdgeProps<E extends BaseEdge = BaseEdge> extends EdgeProps<E> {}
export type BaseEdgePropsWithData<Data extends Record<string, unknown>> = BaseEdgeProps<BaseEdge<Data>>

type WithDimmed = { data: { dimmed?: Base.Dimmed } }
type WithHovered = { data: { hovered?: boolean } }

const _setDimmed = <T extends WithDimmed>(v: T, dimmed: Base.Dimmed): T =>
  (v.data.dimmed ?? false) === dimmed ? v : ({
    ...v,
    data: {
      ...v.data,
      dimmed,
    },
  })

function setDimmed<T extends WithDimmed>(value: T, dimmed: 'immediate' | boolean): T
function setDimmed(dimmed: 'immediate' | boolean): <T extends WithDimmed>(value: T) => T
function setDimmed<T extends WithDimmed>(arg1: T | Base.Dimmed, arg2?: Base.Dimmed) {
  if (arg2 !== undefined) {
    return _setDimmed(arg1 as T, arg2)
  }
  return (v: T) => _setDimmed(v, arg1 as Base.Dimmed)
}

const _setHovered = <T extends WithHovered>(v: T, hovered: boolean): T =>
  (v.data.hovered ?? false) === hovered ? v : ({
    ...v,
    data: {
      ...v.data,
      hovered,
    },
  })
function setHovered<T extends WithHovered>(value: T, hovered: boolean): T
function setHovered(hovered: boolean): <T extends WithHovered>(value: T) => T
function setHovered<T extends WithHovered>(arg1: T | boolean, arg2?: boolean) {
  if (arg2 !== undefined) {
    return _setHovered(arg1 as T, arg2)
  }
  return (v: T) => _setHovered(v, arg1 as boolean)
}

type WithData<D> = { data: D }
function _setData<E extends WithData<any>>(value: E, state: Partial<E['data']>): E {
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
function setData<E extends WithData<any>>(value: E, state: Partial<E['data']>): E
function setData<E extends WithData<any>>(state: Partial<E['data']>): (value: E) => E
function setData<E extends WithData<any>>(arg1: E | Partial<E['data']>, arg2?: any) {
  if (arg2 !== undefined) {
    return _setData(arg1 as E, arg2)
  }
  return (edge: E) => _setData(edge, arg1)
}

export const Base = {
  setDimmed,
  setHovered,
  setData,
}

export namespace Base {
  // 'immediate' means that the node is dimmed without delay
  export type Dimmed = 'immediate' | boolean
}

/**
 * To cooperate with `exactOptionalPropertyTypes` in `tsconfig.json`
 *
 * @example
 * interface User {
 * 	name: string;
 * 	surname?: string;
 * 	luckyNumber?: number;
 * }
 *
 * type NonOptionalUser = NonOptional<User>
 * // NonOptionalUser = {
 * //   name: string
 * //   surname: string | undefined
 * //   luckyNumber: number | undefined
 * // }
 */
export type NonOptional<T extends object, Keys extends OptionalKeysOf<T> = OptionalKeysOf<T>> = Simplify<
  & {
    [P in Exclude<keyof T, Keys>]: T[P]
  }
  & {
    [P in Keys]-?: T[P] | undefined
  }
>
