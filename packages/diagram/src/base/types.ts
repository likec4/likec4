import type {
  Edge,
  EdgeProps,
  Node,
  NodeProps,
} from '@xyflow/react'
import type { OptionalKeysOf, SetRequired, Simplify } from 'type-fest'
import type { Base } from './Base'

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
