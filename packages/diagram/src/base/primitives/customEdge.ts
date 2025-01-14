import { deepEqual as eq } from 'fast-equals'
import { type FunctionComponent, memo } from 'react'
import type { BaseTypes, EdgeProps } from '../types'

// If points are within 3px, consider them the same
const isSame = (a: number, b: number) => {
  return Math.abs(a - b) < 2.5
}

const isEqualProps = <P extends Record<string, unknown> = BaseTypes.EdgeData>(
  prev: EdgeProps<P>,
  next: EdgeProps<P>,
) => (
  prev.id === next.id
  && eq(prev.source, next.source)
  && eq(prev.target, next.target)
  && eq(prev.selected ?? false, next.selected ?? false)
  && isSame(prev.sourceX, next.sourceX)
  && isSame(prev.sourceY, next.sourceY)
  && isSame(prev.targetX, next.targetX)
  && isSame(prev.targetY, next.targetY)
  && eq(prev.data, next.data)
  && eq(prev.style, next.style)
)

export function customEdge<P extends Record<string, unknown> = BaseTypes.NodeData>(
  Edge: FunctionComponent<EdgeProps<P>>,
) {
  return memo(Edge, isEqualProps)
}
