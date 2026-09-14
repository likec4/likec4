import { type BBox, distanceBetween, isOrthoSpline, nearlyEqual, splineToPolyline } from '@likec4/core/geometry'
import type { EdgeRouting, NonEmptyArray, Point } from '@likec4/core/types'
import { nonNullable } from '@likec4/core/utils'
import type { XYPosition } from '@xyflow/react'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { first, last } from 'remeda'
import { bezierControlPoints, bezierPath, getNodeIntersectionFromCenterToPoint } from './xyflow'

/**
 * One end of an edge: the node centre (as xyflow reports it) and the node rectangle.
 */
export type EdgeEnd = {
  readonly center: XYPosition
  readonly node: BBox
}

/**
 * The two ends of an edge in declaration order, and the direction it is drawn in.
 */
export type Endpoints<T> = {
  source: T
  target: T
  dir?: 'forward' | 'back' | 'both' | undefined
}

type EdgeEndpoints = Endpoints<EdgeEnd>

/** the ends in drawing order: a `back` edge is drawn from the target to the source */
export function inDrawingOrder<T>({ source, target, dir }: Endpoints<T>): [from: T, to: T] {
  return dir === 'back' ? [target, source] : [source, target]
}

/**
 * A straight piece of a drawn edge, as `[from, to]`.
 */
export type Segment = [XYPosition, XYPosition]

/**
 * A drawn edge: its SVG path data and, under ortho routing, its straight pieces
 * (the rounded corners between them excluded), used to place the label.
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

/** margin between an orthogonal segment and the node border it leaves or enters */
const ORTHO_NODE_MARGIN = 2
/** corner radius of orthogonal routes, clamped to half of the shorter adjacent segment */
const ORTHO_CORNER_RADIUS = 8
/** below this radius a corner is drawn sharp */
const MIN_ROUNDED_RADIUS = 1

/**
 * Collects straight pieces in drawing order. Consecutive pieces of one straight run
 * (split by a sharp collinear corner or by a straight cubic) form one segment.
 * Pieces only continue each other when `from` is the very point the previous piece ended on:
 * after a rounded corner the next piece starts at a new point, so every arc splits a run.
 */
function segmentCollector(): { add: (from: XYPosition, to: XYPosition) => void; segments: Segment[] } {
  const segments: Segment[] = []
  return {
    segments,
    add(from, to) {
      const previous = segments[segments.length - 1]
      const continues = previous
        && previous[1] === from
        && ((nearlyEqual(previous[0].x, from.x) && nearlyEqual(from.x, to.x) &&
          Math.sign(to.y - from.y) === Math.sign(from.y - previous[0].y))
          || (nearlyEqual(previous[0].y, from.y) && nearlyEqual(from.y, to.y) &&
            Math.sign(to.x - from.x) === Math.sign(from.x - previous[0].x)))
      if (continues) {
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
 * Polyline with rounded corners. A corner too tight to round is drawn sharp.
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
    if (r < MIN_ROUNDED_RADIUS) {
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
  const end = points[points.length - 1]!
  add(start, end)
  return { d: d + ` L ${end.x},${end.y}`, segments }
}

/**
 * Unclipped orthogonal polyline from one centre to the other through the anchors:
 * one elbow is inserted between anchors that do not share an axis, continuing the incoming direction
 * (the larger delta first when leaving the node). `insertAt[i]` is the control point index at which
 * a corner placed on the segment ending at `points[i]` belongs.
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
    const p = points[points.length - 1]!
    if (nearlyEqual(p.x, q.x) && nearlyEqual(p.y, q.y)) {
      return
    }
    if (nearlyEqual(p.x, q.x) || nearlyEqual(p.y, q.y)) {
      direction = nearlyEqual(p.y, q.y) ? 'h' : 'v'
      points.push(q)
      insertAt.push(index)
      return
    }
    const horizontalFirst = direction ? direction === 'h' : Math.abs(q.x - p.x) >= Math.abs(q.y - p.y)
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
 * Orthogonal route from one node to the other through the given anchors,
 * clipped at the node borders, with rounded corners.
 */
function orthoPath(anchors: ReadonlyArray<XYPosition>, from: EdgeEnd, to: EdgeEnd): DrawnEdge {
  const { points } = orthoPolyline(anchors, from.center, to.center)
  clipStart(points, from.node, ORTHO_NODE_MARGIN)
  points.reverse()
  clipStart(points, to.node, ORTHO_NODE_MARGIN)
  points.reverse()
  return roundedPath(points, ORTHO_CORNER_RADIUS)
}

function isSameNode(a: BBox, b: BBox): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

/** point of the node border closest to `p` (its own position when `p` is inside) */
function borderPointToward(node: BBox, p: XYPosition): XYPosition {
  return {
    x: Math.trunc(Math.max(node.x, Math.min(node.x + node.width, p.x))),
    y: Math.trunc(Math.max(node.y, Math.min(node.y + node.height, p.y))),
  }
}

/** default corners of an edited self-loop that lost all its corners: a loop above the node */
const SELF_LOOP_SIZE = 80

/**
 * Orthogonal route of a self-loop: leaves the node border below the first corner,
 * visits the corners, and re-enters below the last one, so the route never
 * retraces itself through the node centre.
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
 * An edited edge (one that has control points), drawn from source to target
 * (or from target to source for `dir: 'back'`), clipped at the node borders.
 * Under ortho routing the control points are corners of an orthogonal route.
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
    return isSameNode(from.node, to.node)
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
 * An untouched edge (no control points): its layouted Graphviz spline.
 * Under ortho routing, legacy curved geometry (a snapshot saved under spline routing)
 * is re-routed orthogonally through the handles derived from the curve, without a relayout.
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
  // every cubic is straight: the on-curve points are the corners
  const { add, segments } = segmentCollector()
  const polyline = splineToPolyline(points)
  for (let i = 1; i < polyline.length; i++) {
    add(polyline[i - 1]!, polyline[i]!)
  }
  return { d: bezierPath(points), segments }
}
