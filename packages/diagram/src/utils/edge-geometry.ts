import type { EdgeRouting, NonEmptyArray, Point } from '@likec4/core'
import type { BBox, XYPoint } from '@likec4/core/geometry'
import { nonNullable } from '@likec4/core/utils'
import type { XYPosition } from '@xyflow/react'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { first, last } from 'remeda'
import { bezierControlPoints, bezierPath, distanceBetweenPoints, getNodeIntersectionFromCenterToPoint } from './xyflow'

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

const near = (a: number, b: number) => Math.abs(a - b) <= 1

/**
 * Whether every cubic of a Graphviz spline is axis-aligned, as `splines=ortho` produces.
 * Legacy geometry (a snapshot saved under spline routing) is not.
 */
function isOrthoPoints(points: NonEmptyArray<Point>): boolean {
  for (let i = 0; i + 3 < points.length; i += 3) {
    // all four points of the cubic must share an axis, not only its endpoints (a legacy arc has them aligned too)
    const cubic = [points[i]!, points[i + 1]!, points[i + 2]!, points[i + 3]!]
    const sameX = cubic.every(([x]) => near(x, cubic[0]![0]))
    const sameY = cubic.every(([, y]) => near(y, cubic[0]![1]))
    if (!sameX && !sameY) {
      return false
    }
  }
  return true
}

/**
 * Corners of an ortho spline: the on-curve points (every third one), endpoints excluded,
 * consecutive duplicates and collinear middles dropped.
 */
function orthoCorners(points: NonEmptyArray<Point>): XYPoint[] {
  const anchors: XYPoint[] = []
  for (let i = 0; i < points.length; i += 3) {
    const [x, y] = points[i]!
    const p = { x: Math.trunc(x), y: Math.trunc(y) }
    const prev = anchors[anchors.length - 1]
    if (!prev || !(near(prev.x, p.x) && near(prev.y, p.y))) {
      anchors.push(p)
    }
  }
  const corners: XYPoint[] = []
  for (let i = 1; i < anchors.length - 1; i++) {
    const a = anchors[i - 1]!, b = anchors[i]!, c = anchors[i + 1]!
    const straight = (near(a.y, b.y) && near(b.y, c.y)) || (near(a.x, b.x) && near(b.x, c.x))
    if (!straight) {
      corners.push(b)
    }
  }
  return corners
}

/**
 * Initial control points of an edge that has none yet, derived from its layouted points.
 * Under ortho routing these are the corners of the route (the midpoint for a straight edge);
 * spline routing, and legacy curved geometry under ortho, derive handles from the curve.
 */
export function initialControlPoints(
  points: NonEmptyArray<Point>,
  routing: EdgeRouting,
): XYPoint[] {
  if (routing !== 'ortho' || !isOrthoPoints(points)) {
    return bezierControlPoints(points)
  }
  const corners = orthoCorners(points)
  if (corners.length > 0) {
    return corners
  }
  const [ax, ay] = points[0]
  const [bx, by] = points[points.length - 1]!
  return [{ x: Math.trunc((ax + bx) / 2), y: Math.trunc((ay + by) / 2) }]
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

/** margin between an orthogonal segment and the node border it leaves or enters */
const ORTHO_NODE_MARGIN = 2
/** corner radius of orthogonal routes, clamped to half of the shorter adjacent segment */
const ORTHO_CORNER_RADIUS = 8
/** below this radius a corner is drawn sharp */
const MIN_ROUNDED_RADIUS = 1

function inside(p: XYPosition, r: BBox, margin: number): boolean {
  return p.x >= r.x - margin && p.x <= r.x + r.width + margin && p.y >= r.y - margin && p.y <= r.y + r.height + margin
}

/**
 * Drops the leading points that lie inside the node and moves the first point onto the node border.
 * Segments are axis-aligned, so the clipped point keeps one coordinate.
 */
function clipStart(points: XYPosition[], node: BBox, margin: number): void {
  while (points.length > 2 && inside(points[1]!, node, margin)) {
    points.shift()
  }
  const p0 = points[0]!, p1 = points[1]
  if (!p1 || !inside(p0, node, margin)) {
    return
  }
  switch (true) {
    case near(p0.y, p1.y): {
      points[0] = { x: p1.x > p0.x ? node.x + node.width + margin : node.x - margin, y: p0.y }
      break
    }
    case near(p0.x, p1.x): {
      points[0] = { x: p0.x, y: p1.y > p0.y ? node.y + node.height + margin : node.y - margin }
      break
    }
  }
}

function roundedPath(points: XYPosition[], radius: number): string {
  if (points.length < 2) {
    return ''
  }
  let d = `M ${points[0]!.x},${points[0]!.y}`
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!, corner = points[i]!, next = points[i + 1]!
    const din = distanceBetweenPoints(prev, corner)
    const dout = distanceBetweenPoints(corner, next)
    const r = Math.min(radius, din / 2, dout / 2)
    if (r < MIN_ROUNDED_RADIUS) {
      d += ` L ${corner.x},${corner.y}`
      continue
    }
    const a = { x: corner.x + (prev.x - corner.x) / din * r, y: corner.y + (prev.y - corner.y) / din * r }
    const b = { x: corner.x + (next.x - corner.x) / dout * r, y: corner.y + (next.y - corner.y) / dout * r }
    d += ` L ${Math.round(a.x)},${Math.round(a.y)} Q ${corner.x},${corner.y} ${Math.round(b.x)},${Math.round(b.y)}`
  }
  const last = points[points.length - 1]!
  return d + ` L ${last.x},${last.y}`
}

/**
 * Orthogonal route from one node to the other through the given anchors:
 * one elbow is inserted between anchors that do not share an axis, continuing the incoming direction
 * (the larger delta first when leaving the node); the ends are clipped at the node borders
 * and the corners are rounded.
 */
function orthoPath(anchors: ReadonlyArray<XYPosition>, from: EdgeEnd, to: EdgeEnd): string {
  const points: XYPosition[] = [{ x: Math.trunc(from.center.x), y: Math.trunc(from.center.y) }]
  let direction: 'h' | 'v' | null = null
  const push = (q: XYPosition) => {
    const p = points[points.length - 1]!
    if (near(p.x, q.x) && near(p.y, q.y)) {
      return
    }
    if (near(p.x, q.x) || near(p.y, q.y)) {
      direction = near(p.y, q.y) ? 'h' : 'v'
      points.push(q)
      return
    }
    const horizontalFirst = direction ? direction === 'h' : Math.abs(q.x - p.x) >= Math.abs(q.y - p.y)
    points.push(horizontalFirst ? { x: q.x, y: p.y } : { x: p.x, y: q.y })
    direction = horizontalFirst ? 'v' : 'h'
    points.push(q)
  }
  for (const a of anchors) {
    push({ x: Math.trunc(a.x), y: Math.trunc(a.y) })
  }
  push({ x: Math.trunc(to.center.x), y: Math.trunc(to.center.y) })
  clipStart(points, from.node, ORTHO_NODE_MARGIN)
  points.reverse()
  clipStart(points, to.node, ORTHO_NODE_MARGIN)
  points.reverse()
  return roundedPath(points, ORTHO_CORNER_RADIUS)
}

type EdgeEnds = {
  source: EdgeEnd
  target: EdgeEnd
  dir?: 'forward' | 'back' | 'both' | undefined
}

function ends({ source, target, dir }: EdgeEnds): [from: EdgeEnd, to: EdgeEnd] {
  return dir === 'back' ? [target, source] : [source, target]
}

/**
 * SVG path of an edited edge (one that has control points), drawn from source to target
 * (or from target to source for `dir: 'back'`), clipped at the node borders.
 * Under ortho routing the control points are corners of an orthogonal route.
 */
export function editedEdgePath({
  controlPoints,
  routing,
  ...edge
}: EdgeEnds & {
  controlPoints: ReadonlyArray<XYPosition>
  routing: EdgeRouting
}): string {
  const [from, to] = ends(edge)
  if (routing === 'ortho') {
    return orthoPath(controlPoints, from, to)
  }
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
 * SVG path of an untouched edge (no control points): its layouted Graphviz spline.
 * Under ortho routing, legacy curved geometry (a snapshot saved under spline routing)
 * is re-routed orthogonally through the handles derived from the curve, without a relayout.
 */
export function layoutedEdgePath({
  points,
  routing,
  ...edge
}: EdgeEnds & {
  points: NonEmptyArray<Point>
  routing: EdgeRouting
}): string {
  if (routing === 'ortho' && !isOrthoPoints(points)) {
    const [from, to] = ends(edge)
    return orthoPath(bezierControlPoints(points), from, to)
  }
  return bezierPath(points)
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
