import {
  type NonEmptyArray,
  type Point,
  invariant,
} from '@likec4/core'
import type { EdgeProps, XYPosition } from '@xyflow/react'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { deepEqual as eq } from 'fast-equals'
import { memo } from 'react'
import { hasAtLeast, isArray } from 'remeda'
import { EdgeContainer, EdgePath } from '../base/primitives'
import type { Types } from './types'

function bezierPath(bezierSpline: NonEmptyArray<Point>) {
  let [start, ...points] = bezierSpline
  invariant(start, 'start should be defined')
  let path = `M ${start[0]},${start[1]}`

  while (hasAtLeast(points, 3)) {
    const [cp1, cp2, end, ...rest] = points
    path = path + ` C ${cp1[0]},${cp1[1]} ${cp2[0]},${cp2[1]} ${end[0]},${end[1]}`
    points = rest
  }
  invariant(points.length === 0, 'all points should be consumed')

  return path
}

// If points are within 1px, consider them the same
const isSame = (a: number, b: number) => {
  return Math.abs(a - b) < 2.5
}

const isSamePoint = (a: XYPosition | Point, b: XYPosition | Point) => {
  return isSame(isArray(a) ? a[0] : a.x, isArray(b) ? b[0] : b.x)
    && isSame(isArray(a) ? a[1] : a.y, isArray(b) ? b[1] : b.y)
}

const samePoints = (a: XYPosition[] | Point[] | null, b: XYPosition[] | Point[] | null) => {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  return a.every((ap, i) => isSamePoint(ap, b[i]!))
}

type RelationshipEdgeProps = EdgeProps<Types.RelationshipEdge>

const isEqualProps = (prev: RelationshipEdgeProps, next: RelationshipEdgeProps) => (
  prev.id === next.id
  && eq(prev.source, next.source)
  && eq(prev.target, next.target)
  && eq(prev.selected ?? false, next.selected ?? false)
  && isSame(prev.sourceX, next.sourceX)
  && isSame(prev.sourceY, next.sourceY)
  && isSame(prev.targetX, next.targetX)
  && isSame(prev.targetY, next.targetY)
  // && samePoints(prev.data.points, next.data.points)
  && eq(prev.data, next.data)
  // && eq(prev.data.hovered ?? false, prev.data.hovered ?? false)
  // && eq(prev.data.dimmed ?? false, prev.data.dimmed ?? false)
  // && eq(prev.data.edge, next.data.edge)
)

const curve = d3line<XYPosition>()
  .curve(curveCatmullRomOpen)
  .x(d => d.x)
  .y(d => d.y)

export const RelationshipEdge = memo<RelationshipEdgeProps>(function RelationshipEdgeInner(props) {
  const {
    id,
    data,
  } = props
  const edgePath = bezierPath(data.points)
  return (
    <EdgeContainer {...props}>
      <EdgePath {...props} edgeSvgPath={edgePath} />
    </EdgeContainer>
  )
}, isEqualProps)
