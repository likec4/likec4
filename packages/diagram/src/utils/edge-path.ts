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

/** An edge endpoint: the XYFlow handle center and the node bounds. */
export type EdgeEnd = {
  readonly center: XYPosition
  readonly node: BBox
}

/** Source and target in declaration order; `dir: 'back'` draws from target to source. */
export type Endpoints<T> = {
  source: T
  target: T
  dir?: DiagramEdge['dir'] | undefined
}

/** The axis of a straight segment: horizontal (`h`) or vertical (`v`). */
export type Axis = 'h' | 'v'

type EdgeEndpoints = Endpoints<EdgeEnd>

/** Endpoints in drawing order, reversed for `dir: 'back'`. */
export function inDrawingOrder<T>({ source, target, dir }: Endpoints<T>): [from: T, to: T] {
  return dir === 'back' ? [target, source] : [source, target]
}

/** SVG path data plus the straight segments used for label placement (empty for splines). */
export type DrawnEdge = {
  readonly d: string
  readonly segments: ReadonlyArray<Segment>
}

const NODE_MARGIN = 6

const catmullRom = d3line<XYPosition>()
  .curve(curveCatmullRomOpen.alpha(0.7))
  .x(d => Math.trunc(d.x))
  .y(d => Math.trunc(d.y))

// Orthogonal drawing, in diagram units
const ORTHO_NODE_MARGIN = 2
const ORTHO_CORNER_RADIUS = 8
const MIN_ROUNDED_RADIUS = 1

/**
 * Collects straight segments, merging collinear pieces only when they share the same endpoint object,
 * so a rounded corner, which starts the next piece at a new point, splits them.
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

/** Drops leading points inside the node and moves the first point onto its border. */
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
 * Draws the polyline with rounded corners; a corner stays sharp when the radius would be below
 * `MIN_ROUNDED_RADIUS` or the path reverses.
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
 * Orthogonal polyline through the anchors, before clipping at the nodes. Between anchors that don't
 * share an axis it inserts a bend, continuing the incoming axis unless that would double back.
 * `insertAt[i]` is the control point index to insert at for the segment ending at `points[i]`.
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

function orthoRoute(anchors: ReadonlyArray<XYPosition>, from: EdgeEnd, to: EdgeEnd): XYPosition[] {
  const { points } = orthoPolyline(anchors, from.center, to.center)
  clipStart(points, from.node, ORTHO_NODE_MARGIN)
  points.reverse()
  clipStart(points, to.node, ORTHO_NODE_MARGIN)
  points.reverse()
  return points
}

export function drawnFromRoute(points: XYPosition[]): DrawnEdge {
  return roundedPath(points, ORTHO_CORNER_RADIUS)
}

function orthoPath(anchors: ReadonlyArray<XYPosition>, from: EdgeEnd, to: EdgeEnd): DrawnEdge {
  return drawnFromRoute(orthoRoute(anchors, from, to))
}

function borderPointToward(node: BBox, p: XYPosition): XYPosition {
  return {
    x: Math.trunc(Math.max(node.x, Math.min(node.x + node.width, p.x))),
    y: Math.trunc(Math.max(node.y, Math.min(node.y + node.height, p.y))),
  }
}

const SELF_LOOP_SIZE = 80 // height of the default loop above the node

/**
 * Self-loop through the corners, or a default loop above the node; the endpoints are the node
 * border points nearest the first and last corner.
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

/** Route of an edited edge with its endpoint bounds in drawing order, or `null` for a self-loop. */
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
 * Polyline of an unedited edge: the Graphviz corners, or a route through the spline handles when
 * the saved geometry is curved.
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
 * Path through the editing handles, clipped at the node borders: orthogonal with straight segments,
 * or a curve without segments.
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
 * Path of an unedited edge: the Graphviz spline as is, or re-routed orthogonally when a curved
 * layout is shown with ortho routing.
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
