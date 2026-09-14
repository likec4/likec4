import {
  type BBox,
  type XYPoint,
  distanceBetween,
  isOrthoSpline,
  nearlyEqual,
  projectOnSegment,
  splineToPolyline,
} from '@likec4/core/geometry'
import type { EdgeRouting, NonEmptyArray, Point } from '@likec4/core/types'
import { nonNullable } from '@likec4/core/utils'
import type { XYPosition } from '@xyflow/react'
import { curveCatmullRomOpen, line as d3line } from 'd3-shape'
import { first, last } from 'remeda'
import { bezierControlPoints, bezierPath, getNodeIntersectionFromCenterToPoint } from './xyflow'

// Geometry of relationship edges. Every function takes the view's edge routing,
// so each routing keeps its own implementation here; hooks and components only
// gather the inputs and render the results.

/**
 * Edge routing of a view, `spline` when the view does not set one.
 */
export function viewRouting(view: { readonly routing?: EdgeRouting | undefined }): EdgeRouting {
  return view.routing ?? 'spline'
}

/**
 * Corners of an ortho spline: the on-curve points (every third one), endpoints excluded,
 * consecutive duplicates and collinear middles dropped.
 */
function orthoCorners(points: NonEmptyArray<Point>): XYPoint[] {
  const anchors = splineToPolyline(points).map(p => ({ x: Math.trunc(p.x), y: Math.trunc(p.y) }))
  const corners: XYPoint[] = []
  for (let i = 1; i < anchors.length - 1; i++) {
    const a = anchors[i - 1]!, b = anchors[i]!, c = anchors[i + 1]!
    const straight = (nearlyEqual(a.y, b.y) && nearlyEqual(b.y, c.y)) ||
      (nearlyEqual(a.x, b.x) && nearlyEqual(b.x, c.x))
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
  if (routing !== 'ortho' || !isOrthoSpline(points)) {
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

function roundedPath(points: XYPosition[], radius: number): string {
  if (points.length < 2) {
    return ''
  }
  let d = `M ${points[0]!.x},${points[0]!.y}`
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!, corner = points[i]!, next = points[i + 1]!
    const din = distanceBetween(prev, corner)
    const dout = distanceBetween(corner, next)
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
 * Unclipped orthogonal polyline from one centre to the other through the anchors:
 * one elbow is inserted between anchors that do not share an axis, continuing the incoming direction
 * (the larger delta first when leaving the node). `insertAt[i]` is the control point index at which
 * a corner placed on the segment ending at `points[i]` belongs.
 */
function orthoPolyline(
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
function orthoPath(anchors: ReadonlyArray<XYPosition>, from: EdgeEnd, to: EdgeEnd): string {
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
function orthoSelfLoopPath(controlPoints: ReadonlyArray<XYPosition>, node: BBox): string {
  const corners = controlPoints.length > 0 ? controlPoints : [
    { x: node.x + node.width / 2 - SELF_LOOP_SIZE / 2.5, y: node.y - SELF_LOOP_SIZE },
    { x: node.x + node.width / 2 + SELF_LOOP_SIZE / 2.5, y: node.y - SELF_LOOP_SIZE },
  ]
  const exit = borderPointToward(node, first(corners)!)
  const entry = borderPointToward(node, last(corners)!)
  const { points } = orthoPolyline(corners, exit, entry)
  return roundedPath(points, ORTHO_CORNER_RADIUS)
}

type Ends<T> = {
  source: T
  target: T
  dir?: 'forward' | 'back' | 'both' | undefined
}

type EdgeEnds = Ends<EdgeEnd>

/** the ends in drawing order: a `back` edge is drawn from the target to the source */
function ends<T>({ source, target, dir }: Ends<T>): [from: T, to: T] {
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
  if (routing === 'ortho' && !isOrthoSpline(points)) {
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
 * Absolute commands of an SVG path as produced by this module (`M`, `L`, `Q`, `C`) with their numbers.
 */
export function pathCommands(d: string): Array<{ op: string; args: number[] }> {
  return [...d.matchAll(/([MLQC])([^MLQC]*)/g)].map(([, op, rest]) => ({
    op: op!,
    args: rest!.trim().split(/[\s,]+/).filter(Boolean).map(Number),
  }))
}

/**
 * Straight segments of an SVG path as `[from, to]` pairs: `L` commands, and `C` commands
 * whose four points share an axis (how an untouched ortho edge is drawn from its Graphviz points).
 */
export function straightSegments(d: string): Array<[XYPosition, XYPosition]> {
  const segments: Array<[XYPosition, XYPosition]> = []
  let current: XYPosition | null = null
  const add = (from: XYPosition, to: XYPosition) => {
    const previous = segments[segments.length - 1]
    // consecutive pieces of one straight run (split by a collinear point or a straight cubic) form one segment
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
  }
  for (const { op, args } of pathCommands(d)) {
    const end = { x: args[args.length - 2]!, y: args[args.length - 1]! }
    if (current) {
      switch (true) {
        case op === 'L': {
          add(current, end)
          break
        }
        case op === 'C': {
          const xs = [current.x, args[0]!, args[2]!, end.x]
          const ys = [current.y, args[1]!, args[3]!, end.y]
          if (xs.every(x => nearlyEqual(x, current!.x)) || ys.every(y => nearlyEqual(y, current!.y))) {
            add(current, end)
          }
          break
        }
      }
    }
    current = end
  }
  return segments
}

/**
 * Midpoint of the longest straight segment of an SVG path; ties go to the first one.
 * Rounded corners (`Q`) shorten the segments they join by at most a corner radius each.
 */
function longestSegmentMidpoint(d: string): XYPosition | null {
  let best: [XYPosition, XYPosition] | null = null
  let bestLength = -1
  for (const segment of straightSegments(d)) {
    const length = distanceBetween(segment[0], segment[1])
    if (length > bestLength) {
      bestLength = length
      best = segment
    }
  }
  if (!best) {
    return null
  }
  const [a, b] = best
  return { x: Math.round((a.x + b.x) / 2), y: Math.round((a.y + b.y) / 2) }
}

/**
 * Anchor of the edge label on an edited edge:
 * half the path length under spline routing, the midpoint of the longest segment under ortho.
 */
export function edgeLabelAnchor({ path, d, routing }: {
  path: MeasurablePath
  d: string
  routing: EdgeRouting
}): XYPosition {
  if (routing === 'ortho') {
    const anchor = longestSegmentMidpoint(d)
    if (anchor) {
      return anchor
    }
  }
  const point = path.getPointAtLength(path.getTotalLength() * 0.5)
  return {
    x: Math.round(point.x),
    y: Math.round(point.y),
  }
}

/** how close (flow units) a dragged corner must come to a neighbour's axis to snap onto it */
const SNAP_TOLERANCE = 8

/** node centres of the edge, in the order the edge is declared */
type CornerEditing = Ends<XYPosition> & {
  controlPoints: ReadonlyArray<XYPosition>
  routing: EdgeRouting
}

/**
 * Position of a dragged corner. Under ortho routing it snaps to the x or y of the previous
 * or next anchor (the node centres for the end corners) when within tolerance,
 * so a careful drag keeps segments straight and a deliberate one creates an elbow.
 * Snapping both axes onto the same neighbour makes the corner coincide with it,
 * which the drawn route then skips.
 */
export function snapCorner({ index, point, controlPoints, routing, ...edge }: CornerEditing & {
  index: number
  point: XYPosition
}): XYPosition {
  if (routing !== 'ortho') {
    return point
  }
  const [from, to] = ends(edge)
  const prev = controlPoints[index - 1] ?? from
  const next = controlPoints[index + 1] ?? to
  const snap = (value: number, candidates: number[]) => {
    let best = value, bestDistance = SNAP_TOLERANCE + 1
    for (const raw of candidates) {
      // node centres may be fractional; corners are stored as integers
      const candidate = Math.trunc(raw)
      const distance = Math.abs(candidate - value)
      if (distance <= SNAP_TOLERANCE && distance < bestDistance) {
        best = candidate
        bestDistance = distance
      }
    }
    return best
  }
  return {
    x: snap(point.x, [prev.x, next.x]),
    y: snap(point.y, [prev.y, next.y]),
  }
}

/**
 * Control points after inserting a new one where the user clicked.
 * Under spline routing the raw point is inserted before the segment (between consecutive anchors)
 * it is closest to. Under ortho routing the point is projected onto the drawn route
 * (elbow legs included), so the new corner lies exactly on the line until it is dragged.
 */
export function insertCorner({ point, controlPoints, routing, ...edge }: CornerEditing & {
  point: XYPosition
}): XYPosition[] {
  const [from, to] = ends(edge)
  const result = [...controlPoints]
  if (routing === 'ortho') {
    const { points, insertAt } = orthoPolyline(controlPoints, from, to)
    let best = { index: 0, point, distance: Infinity }
    for (let i = 1; i < points.length; i++) {
      const candidate = projectOnSegment(point, points[i - 1]!, points[i]!)
      if (candidate.distance < best.distance) {
        best = { index: insertAt[i]!, point: candidate.point, distance: candidate.distance }
      }
    }
    result.splice(best.index, 0, { x: Math.round(best.point.x), y: Math.round(best.point.y) })
    return result
  }
  const anchors = [from, ...controlPoints, to]
  const newPoint = { x: Math.round(point.x), y: Math.round(point.y) }
  let insertionIndex = 0
  let minDistance = Infinity
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i]!, b = anchors[i + 1]!
    const abx = b.x - a.x, aby = b.y - a.y
    const apx = newPoint.x - a.x, apy = newPoint.y - a.y
    const bpx = newPoint.x - b.x, bpy = newPoint.y - b.y
    // is the pointer alongside the segment?
    if ((abx * apx + aby * apy) * (abx * bpx + aby * bpy) < 0) {
      // distance to the segment approximated by a straight line
      const distanceToEdge = Math.abs(abx * apy - aby * apx) / Math.hypot(abx, aby)
      if (distanceToEdge < minDistance) {
        minDistance = distanceToEdge
        insertionIndex = i
      }
    }
  }
  result.splice(insertionIndex, 0, newPoint)
  return result
}
