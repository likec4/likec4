import type {
  Edge as RFEdge,
  Node as RFNode,
  NodeProps as ReactFlowNodeProps,
} from '@xyflow/react'
import { hasSubObject } from 'remeda'
import type { Simplify } from 'type-fest'

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
export type Node = RFNode<NodeData>

export type NodeProps = ReactFlowNodeProps<RFNode<NodeData, any>>

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
export type Edge = Simplify<Omit<RFEdge, 'data'> & { data: EdgeData }>

type WithDimmed = { data: { dimmed?: Dimmed } }
type WithHovered = { data: { hovered?: boolean } }

const _setDimmed = <T extends WithDimmed>(v: T, dimmed: Dimmed): T =>
  (v.data.dimmed ?? false) === dimmed ? v : ({
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
  (v.data.hovered ?? false) === hovered ? v : ({
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
