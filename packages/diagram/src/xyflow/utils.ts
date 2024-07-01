import { hasAtLeast, invariant } from '@likec4/core'
import type { DiagramEdge, Point } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/react'
import { Bezier } from 'bezier-js'
import { isArray } from 'remeda'

export function toDomPrecision(v: number | null) {
  if (v === null) {
    return 0.01
  }
  return Math.round(v * 100) / 100
}

export function distance(a: XYPosition, b: XYPosition) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

export function bezierControlPoints(diagramEdge: DiagramEdge) {
  let [start, ...bezierPoints] = diagramEdge.points
  invariant(start, 'start should be defined')
  const handles = [
    // start
  ] as XYPosition[]

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
      handles.push({
        x: toDomPrecision(x),
        y: toDomPrecision(y)
      })
    })
    bezierPoints = rest
    start = end
  }
  invariant(bezierPoints.length === 0, 'all points should be consumed')
  if (diagramEdge.dir === 'back' && handles.length > 0) {
    handles.reverse()
  }

  return handles
}

// If points are within 3px, consider them the same
const isClose = (a: number, b: number) => {
  return Math.abs(a - b) < 3.1
}

export function isSamePoint(a: XYPosition | Point, b: XYPosition | Point) {
  const [ax, ay] = isArray(a) ? a : [a.x, a.y]
  const [bx, by] = isArray(b) ? b : [b.x, b.y]
  return isClose(ax, bx) && isClose(ay, by)
}
