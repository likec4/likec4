import {
  type BBox,
  type Segment,
  continuesRun,
  distanceBetween,
  isOrthoSpline,
  nearlyEqual,
  polylineToSegments,
  splineToPolyline,
} from '@likec4/core/geometry'
import type { DiagramEdge, EdgeRouting, NonEmptyArray, Point } from '@likec4/core/types'
import { nonNullable } from '@likec4/core/utils'
import type { XYPosition } from '@xyflow/react'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { first, last } from 'remeda'
import { bezierControlPoints, bezierPath, getNodeIntersectionFromCenterToPoint, isEqualRects } from './xyflow'

/**
 * An edge endpoint with its XYFlow handle center and node bounds.
 */
export type EdgeEnd = {
  readonly center: XYPosition
  readonly node: BBox
}

/**
 * The source and target in declaration order, with the drawing direction.
 */
export type Endpoints<T> = {
  source: T
  target: T
  dir?: DiagramEdge['dir'] | undefined
}

/** The axis of a straight segment: horizontal (`h`) or vertical (`v`). */
export type Axis = 'h' | 'v'

type EdgeEndpoints = Endpoints<EdgeEnd>

/**
 * Returns endpoints in drawing order, reversing them for `dir: 'back'`.
 */
export function inDrawingOrder<T>({ source, target, dir }: Endpoints<T>): [from: T, to: T] {
  return dir === 'back' ? [target, source] : [source, target]
}

/**
 * SVG path data and straight segments used for label placement.
 * Orthogonal segments exclude rounded corners. Spline paths have no straight segments.
 */
export type DrawnEdge = {
  readonly d: string
  readonly segments: ReadonlyArray<Segment>
}

const NODE_MARGIN = 6

const catmullRom = d3line<XYPosition>()
  .curve(curveCatmullRomOpen.alpha(0.7))
  .x(d => Math.trunc(d.x))
  .y(d => Math.trunc(d.y))

/** Gap between an orthogonal edge and its endpoint node borders, in diagram units. */
const ORTHO_NODE_MARGIN = 2
/** Corner radius in diagram units, limited to half the shorter adjacent segment. */
const ORTHO_CORNER_RADIUS = 8
/** Minimum corner radius in diagram units; smaller corners remain sharp. */
const MIN_ROUNDED_RADIUS = 1

/**
 * Collects connected straight segments in drawing order.
 *
 * Merges consecutive collinear segments only when they share the same endpoint object.
 * A rounded corner separates segments because the following segment starts at a different point.
 */
function segmentCollector(): { add: (from: XYPosition, to: XYPosition) => void; segments: Segment[] } {
  const segments: Segment[] = []
  return {
    segments,
    add(from, to) {
      const previous = segments.at(-1)
      if (previous && previous[1] === from && continuesRun(previous, from, to)) {
        previous[1] = to
      } else {
        segments.push([from, to])
      }
    },
  }
}

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
    case nearlyEqual(p0.y, p1.y): {
      points[0] = { x: p1.x > p0.x ? node.x + node.width + margin : node.x - margin, y: p0.y }
      break
    }
    case nearlyEqual(p0.x, p1.x): {
      points[0] = { x: p0.x, y: p1.y > p0.y ? node.y + node.height + margin : node.y - margin }
      break
    }
  }
}

/**
 * Returns an SVG path with rounded corners and its straight segments.
 *
 * Leaves corners sharp when the available radius is below `MIN_ROUNDED_RADIUS` or the path reverses.
 * Returns empty path data and segments for fewer than two points.
 */
function roundedPath(points: XYPosition[], radius: number): DrawnEdge {
  if (points.length < 2) {
    return { d: '', segments: [] }
  }
  const { add, segments } = segmentCollector()
  let start = points[0]!
  let d = `M ${start.x},${start.y}`
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!, corner = points[i]!, next = points[i + 1]!
    const din = distanceBetween(prev, corner)
    const dout = distanceBetween(corner, next)
    const r = Math.min(radius, din / 2, dout / 2)
    // A corner that reverses direction has no arc to draw; keep it sharp.
    const reverses = (prev.x - corner.x) * (next.x - corner.x) + (prev.y - corner.y) * (next.y - corner.y) > 0
    if (r < MIN_ROUNDED_RADIUS || reverses) {
      d += ` L ${corner.x},${corner.y}`
      add(start, corner)
      start = corner
      continue
    }
    const a = {
      x: Math.round(corner.x + (prev.x - corner.x) / din * r),
      y: Math.round(corner.y + (prev.y - corner.y) / din * r),
    }
    const b = {
      x: Math.round(corner.x + (next.x - corner.x) / dout * r),
      y: Math.round(corner.y + (next.y - corner.y) / dout * r),
    }
    d += ` L ${a.x},${a.y} Q ${corner.x},${corner.y} ${b.x},${b.y}`
    add(start, a)
    start = b
  }
  const end = points.at(-1)!
  add(start, end)
  return { d: d + ` L ${end.x},${end.y}`, segments }
}

/**
 * Returns an orthogonal polyline through the anchors, before clipping to node borders.
 *
 * Inserts a bend between anchors that don't share an axis, continuing the incoming direction
 * unless that would double back over the previous segment.
 * The first segment follows the larger coordinate difference from the starting node.
 * Each `insertAt[i]` gives the control point insertion index for the segment ending at `points[i]`.
 */
export function orthoPolyline(
  anchors: ReadonlyArray<XYPosition>,
  from: XYPosition,
  to: XYPosition,
): { points: XYPosition[]; insertAt: number[] } {
  const points: XYPosition[] = [{ x: Math.trunc(from.x), y: Math.trunc(from.y) }]
  const insertAt: number[] = [0]
  let direction: 'h' | 'v' | null = null
  const push = (q: XYPosition, index: number) => {
    const p = points.at(-1)!
    if (nearlyEqual(p.x, q.x) && nearlyEqual(p.y, q.y)) {
      return
    }
    if (nearlyEqual(p.x, q.x) || nearlyEqual(p.y, q.y)) {
      direction = nearlyEqual(p.y, q.y) ? 'h' : 'v'
      points.push(q)
      insertAt.push(index)
      return
    }
    const prev = points.at(-2)
    let horizontalFirst: boolean
    if (!direction || !prev) {
      horizontalFirst = Math.abs(q.x - p.x) >= Math.abs(q.y - p.y)
    } else {
      // Continue along the incoming axis unless that would run back over the previous segment.
      const reverses = direction === 'h'
        ? Math.sign(q.x - p.x) !== Math.sign(p.x - prev.x)
        : Math.sign(q.y - p.y) !== Math.sign(p.y - prev.y)
      horizontalFirst = reverses ? direction !== 'h' : direction === 'h'
    }
    points.push(horizontalFirst ? { x: q.x, y: p.y } : { x: p.x, y: q.y })
    insertAt.push(index)
    direction = horizontalFirst ? 'v' : 'h'
    points.push(q)
    insertAt.push(index)
  }
  anchors.forEach((a, index) => push({ x: Math.trunc(a.x), y: Math.trunc(a.y) }, index))
  push({ x: Math.trunc(to.x), y: Math.trunc(to.y) }, anchors.length)
  return { points, insertAt }
}

/**
 * Returns an orthogonal route through the anchors, clipped to the endpoint node borders.
 */
function orthoRoute(anchors: ReadonlyArray<XYPosition>, from: EdgeEnd, to: EdgeEnd): XYPosition[] {
  const { points } = orthoPolyline(anchors, from.center, to.center)
  clipStart(points, from.node, ORTHO_NODE_MARGIN)
  points.reverse()
  clipStart(points, to.node, ORTHO_NODE_MARGIN)
  points.reverse()
  return points
}

/**
 * Returns SVG path data with rounded corners and straight segments for label placement.
 */
export function drawnFromRoute(points: XYPosition[]): DrawnEdge {
  return roundedPath(points, ORTHO_CORNER_RADIUS)
}

function orthoPath(anchors: ReadonlyArray<XYPosition>, from: EdgeEnd, to: EdgeEnd): DrawnEdge {
  return drawnFromRoute(orthoRoute(anchors, from, to))
}

/** Clamps `p` to the node bounds. Points inside the node retain their position. */
function borderPointToward(node: BBox, p: XYPosition): XYPosition {
  return {
    x: Math.trunc(Math.max(node.x, Math.min(node.x + node.width, p.x))),
    y: Math.trunc(Math.max(node.y, Math.min(node.y + node.height, p.y))),
  }
}

/** Height in diagram units of the default self-loop above its node. */
const SELF_LOOP_SIZE = 80

/**
 * Returns an orthogonal self-loop through the supplied corners.
 *
 * Uses the node bounds nearest the first and last corners as endpoints.
 * With no corners, creates a loop above the node.
 */
function orthoSelfLoopPath(controlPoints: ReadonlyArray<XYPosition>, node: BBox): DrawnEdge {
  const corners = controlPoints.length > 0 ? controlPoints : [
    { x: node.x + node.width / 2 - SELF_LOOP_SIZE / 2.5, y: node.y - SELF_LOOP_SIZE },
    { x: node.x + node.width / 2 + SELF_LOOP_SIZE / 2.5, y: node.y - SELF_LOOP_SIZE },
  ]
  const exit = borderPointToward(node, first(corners)!)
  const entry = borderPointToward(node, last(corners)!)
  const { points } = orthoPolyline(corners, exit, entry)
  return roundedPath(points, ORTHO_CORNER_RADIUS)
}

/**
 * Returns an edited orthogonal route and its endpoint node bounds in drawing order.
 *
 * The route can move between tracks to separate shared segments.
 * Returns `null` for a self-loop, which uses a separate path.
 */
export function editedEdgeRoute({
  controlPoints,
  ...edge
}: EdgeEndpoints & {
  controlPoints: ReadonlyArray<XYPosition>
}): { points: XYPosition[]; bounds: { from: BBox; to: BBox } } | null {
  const [from, to] = inDrawingOrder(edge)
  if (isEqualRects(from.node, to.node)) {
    return null
  }
  return { points: orthoRoute(controlPoints, from, to), bounds: { from: from.node, to: to.node } }
}

/**
 * Returns the orthogonal polyline for an edge without editing handles.
 *
 * Uses the Graphviz corners for orthogonal geometry. For saved spline geometry, derives
 * handles from the curve and routes through them without moving nodes.
 */
export function layoutedEdgeRoute({
  points,
  ...edge
}: EdgeEndpoints & {
  points: NonEmptyArray<Point>
}): XYPosition[] {
  if (isOrthoSpline(points)) {
    return splineToPolyline(points)
  }
  const [from, to] = inDrawingOrder(edge)
  return orthoRoute(bezierControlPoints(points), from, to)
}

/**
 * Returns a path through editing handles, clipped to the endpoint node borders.
 *
 * Draws from source to target, or from target to source for `dir: 'back'`.
 * For orthogonal routing, treats the handles as corners and returns straight segments
 * for label placement. For spline routing, returns a curve with no straight segments.
 */
export function editedEdgePath({
  controlPoints,
  routing,
  ...edge
}: EdgeEndpoints & {
  controlPoints: ReadonlyArray<XYPosition>
  routing: EdgeRouting
}): DrawnEdge {
  const [from, to] = inDrawingOrder(edge)
  if (routing === 'ortho') {
    return isEqualRects(from.node, to.node)
      ? orthoSelfLoopPath(controlPoints, from.node)
      : orthoPath(controlPoints, from, to)
  }
  const points: XYPosition[] = [
    from.center,
    getNodeIntersectionFromCenterToPoint(from.node, first(controlPoints) ?? to.center, NODE_MARGIN),
    ...controlPoints,
    getNodeIntersectionFromCenterToPoint(to.node, last(controlPoints) ?? from.center, NODE_MARGIN),
    to.center,
  ]
  return { d: nonNullable(catmullRom(points)), segments: [] }
}

/**
 * Returns a path for an edge without editing handles.
 *
 * Preserves the Graphviz spline when its geometry matches the routing mode.
 * For saved curves displayed with orthogonal routing, derives handles from the curve
 * and routes through them without moving nodes.
 */
export function layoutedEdgePath({
  points,
  routing,
  ...edge
}: EdgeEndpoints & {
  points: NonEmptyArray<Point>
  routing: EdgeRouting
}): DrawnEdge {
  if (routing !== 'ortho') {
    return { d: bezierPath(points), segments: [] }
  }
  if (!isOrthoSpline(points)) {
    const [from, to] = inDrawingOrder(edge)
    return orthoPath(bezierControlPoints(points), from, to)
  }
  return { d: bezierPath(points), segments: polylineToSegments(splineToPolyline(points)) }
}
