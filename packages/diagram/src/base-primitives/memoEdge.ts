import { deepEqual as eq } from 'fast-equals'
import { type FunctionComponent, memo } from 'react'
import type { BaseEdgeProps } from '../base/types'

// If points are within 3px, consider them the same
const isSame = (a: number, b: number) => {
  return Math.abs(a - b) < 2.5
}

const edgePropsEqual = <P extends BaseEdgeProps>(
  prev: Readonly<P>,
  next: Readonly<P>,
) => (
  prev.id === next.id
  && prev.type === next.type
  && eq(prev.selected ?? false, next.selected ?? false)
  && eq(prev.animated ?? false, next.animated ?? false)
  && eq(prev.source, next.source)
  && eq(prev.target, next.target)
  && isSame(prev.sourceX, next.sourceX)
  && isSame(prev.sourceY, next.sourceY)
  && isSame(prev.targetX, next.targetX)
  && isSame(prev.targetY, next.targetY)
  && eq(prev.sourceHandleId ?? null, next.sourceHandleId ?? null)
  && eq(prev.targetHandleId ?? null, next.targetHandleId ?? null)
  && eq(prev.sourcePosition, next.sourcePosition)
  && eq(prev.targetPosition, next.targetPosition)
  && eq(prev.data, next.data)
)

const isMemoized = Symbol.for('isMemoized')
export function memoEdge<P extends BaseEdgeProps>(
  Edge: FunctionComponent<P>,
): FunctionComponent<P> {
  if (Object.hasOwn(Edge, isMemoized)) {
    return Edge
  }
  const Memo = memo(Edge, edgePropsEqual)
  Memo.displayName = `MemoEdge(${Edge.displayName || Edge.name})`
  // To avoid memoizing the same edge multiple times
  Object.defineProperty(Memo, isMemoized, {
    enumerable: false,
    writable: false,
    value: true,
  })
  return Memo
}
