import {
  type NonEmptyArray,
  type Point,
  invariant,
} from '@likec4/core'
import type { XYPosition } from '@xyflow/react'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { hasAtLeast } from 'remeda'
import { customEdge, EdgeContainer, EdgePath } from '../../base/primitives'
import type { Types } from '../types'

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

const curve = d3line<XYPosition>()
  .curve(curveCatmullRomOpen)
  .x(d => d.x)
  .y(d => d.y)

export const RelationshipEdge = customEdge<Types.RelationshipEdgeData>((props) => {
  const {
    id,
    data,
  } = props
  const svgPath = bezierPath(data.points)
  return (
    <EdgeContainer {...props}>
      <EdgePath {...props} svgPath={svgPath} />
    </EdgeContainer>
  )
})
