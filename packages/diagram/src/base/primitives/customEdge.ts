import { deepEqual as eq } from 'fast-equals'
import { type FunctionComponent, memo } from 'react'
import type { BaseEdgeProps } from '../types'

// If points are within 3px, consider them the same
const isSame = (a: number, b: number) => {
  return Math.abs(a - b) < 2.5
}

export const edgePropsEqual = <P extends BaseEdgeProps>(
  prev: Readonly<P>,
  next: Readonly<P>,
) => (
  prev.id === next.id
  && eq(prev.selected ?? false, next.selected ?? false)
  && eq(prev.animated ?? false, next.animated ?? false)
  && eq(prev.source, next.source)
  && eq(prev.sourceHandleId ?? null, next.sourceHandleId ?? null)
  && eq(prev.sourcePosition, next.sourcePosition)
  && eq(prev.target, next.target)
  && eq(prev.targetHandleId ?? null, next.targetHandleId ?? null)
  && eq(prev.targetPosition, next.targetPosition)
  && isSame(prev.sourceX, next.sourceX)
  && isSame(prev.sourceY, next.sourceY)
  && isSame(prev.targetX, next.targetX)
  && isSame(prev.targetY, next.targetY)
  && eq(prev.data, next.data)
)

export function customEdge<P extends BaseEdgeProps>(
  Edge: FunctionComponent<P>,
): FunctionComponent<P> {
  return memo(Edge, edgePropsEqual)
}
