import { hasAtLeast, invariant } from '@likec4/core'
import type { NonEmptyArray, Point } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/react'
import { Bezier } from 'bezier-js'

export function toDomPrecision(v: number | null) {
  if (v === null) {
    return 0.01
  }
  return Math.round(v * 100) / 100
}

export function distance(a: XYPosition, b: XYPosition) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

export function bezierControlPoints(bezierSpline: NonEmptyArray<Point>) {
  let [start, ...bezierPoints] = bezierSpline
  invariant(start, 'start should be defined')
  const handles = [
    // start
  ] as Point[]

  while (hasAtLeast(bezierPoints, 3)) {
    const [cp1, cp2, end, ...rest] = bezierPoints
    const bezier = new Bezier(start[0], start[1], cp1[0], cp1[1], cp2[0], cp2[1], end[0], end[1])
    // TODO: temporary, we need correcly derive catmull-rom from bezier. Actually, from poly-bezier
    const inflections = bezier.inflections()
    if (inflections.length === 0) {
      inflections.push(0.5)
    }
    inflections.forEach(t => {
      const { x, y } = bezier.get(t)
      handles.push([toDomPrecision(x), toDomPrecision(y)])
    })
    bezierPoints = rest
    start = end
  }
  invariant(bezierPoints.length === 0, 'all points should be consumed')

  return handles
}
