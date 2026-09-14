import type { EdgeRouting, NonEmptyArray, Point } from '@likec4/core'
import type { BBox, XYPoint } from '@likec4/core/geometry'
import { nonNullable } from '@likec4/core/utils'
import type { XYPosition } from '@xyflow/react'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { first, last } from 'remeda'
import { bezierControlPoints, getNodeIntersectionFromCenterToPoint } from './xyflow'

/**
 * Geometry of relationship edges. Every function takes the view's edge routing,
 * so each routing keeps its own implementation here; hooks and components only
 * gather the inputs and render the results.
 */

/**
 * Edge routing of a view, `spline` when the view does not set one.
 */
export function viewRouting(view: { readonly routing?: EdgeRouting | undefined }): EdgeRouting {
  return view.routing ?? 'spline'
}

/**
 * Initial control points of an edge that has none yet, derived from its layouted points.
 */
export function initialControlPoints(
  points: NonEmptyArray<Point>,
  _routing: EdgeRouting,
): XYPoint[] {
  return bezierControlPoints(points)
}

/**
 * One end of an edge: the node centre (as xyflow reports it) and the node rectangle.
 */
export type EdgeEnd = {
  readonly center: XYPosition
  readonly node: BBox
}

const NODE_MARGIN = 6

const catmullRom = d3line<XYPosition>()
  .curve(curveCatmullRomOpen.alpha(0.7))
  .x(d => Math.trunc(d.x))
  .y(d => Math.trunc(d.y))

/**
 * SVG path of an edited edge (one that has control points), drawn from source to target
 * (or from target to source for `dir: 'back'`), clipped at the node borders.
 */
export function editedEdgePath({
  source,
  target,
  controlPoints,
  dir,
  routing: _routing,
}: {
  source: EdgeEnd
  target: EdgeEnd
  controlPoints: ReadonlyArray<XYPosition>
  dir?: 'forward' | 'back' | 'both' | undefined
  routing: EdgeRouting
}): string {
  const [from, to] = dir === 'back' ? [target, source] : [source, target]
  const points: XYPosition[] = [
    from.center,
    getNodeIntersectionFromCenterToPoint(from.node, first(controlPoints) ?? to.center, NODE_MARGIN),
    ...controlPoints,
    getNodeIntersectionFromCenterToPoint(to.node, last(controlPoints) ?? from.center, NODE_MARGIN),
    to.center,
  ]
  return nonNullable(catmullRom(points))
}

/**
 * The subset of `SVGPathElement` needed to place a label along a path.
 */
export interface MeasurablePath {
  getTotalLength(): number
  getPointAtLength(distance: number): { x: number; y: number }
}

/**
 * Anchor of the edge label on an edited edge.
 */
export function edgeLabelAnchor(path: MeasurablePath, _routing: EdgeRouting): XYPosition {
  const point = path.getPointAtLength(path.getTotalLength() * 0.5)
  return {
    x: Math.round(point.x),
    y: Math.round(point.y),
  }
}
