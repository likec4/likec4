import type {
  Edge as RFEdge,
  EdgeProps as ReactFlowEdgeProps,
  Node as RFNode,
  NodeProps as ReactFlowNodeProps,
} from '@xyflow/react'
import type { OptionalKeysOf, SetRequired, Simplify } from 'type-fest'
import * as Base from './types.Base'

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

/**
 * ReactFlow Custom Node properties with BaseNodeData at least
 */
export type NodeProps<T extends Record<string, unknown> = {}, NodeType extends string = string> = Simplify<
  ReactFlowNodeProps<
    RFNode<Base.NodeData & T, NodeType>
  >
>

/**
 * ReactFlow Custom Edge properties with BaseEdgeData at least
 */
export type EdgeProps<T extends Record<string, unknown> = {}, EdgeType extends string = string> = SetRequired<
  Simplify<ReactFlowEdgeProps<RFEdge<Base.EdgeData & T, EdgeType>>>,
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

export * as Base from './types.Base'
