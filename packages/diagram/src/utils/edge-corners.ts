import type { EdgeRouting, NonEmptyArray, Point } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/react'
import { isOrthoSpline, nearlyEqual, projectOnSegment, splineToPolyline } from '@likec4/core/geometry'
import {
  type Axis,
  type EdgeEnd,
  type Endpoints,
  editedOrthoPolyline,
  inDrawingOrder,
  orthoPolyline,
  stretchAxis,
} from './edge-path'
import { bezierControlPoints, isEqualRects } from './xyflow'

/** Interior corners of an orthogonal Graphviz spline. */
function orthoCorners(points: NonEmptyArray<Point>): XYPosition[] {
  const anchors = splineToPolyline(points).map(p => ({ x: Math.trunc(p.x), y: Math.trunc(p.y) }))
  const corners: XYPosition[] = []
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
 * Editing handles from the layout points: the corners of an orthogonal route (its midpoint when
 * straight), otherwise handles derived from the curve.
 */
export function initialControlPoints(
  points: NonEmptyArray<Point>,
  routing: EdgeRouting,
): XYPosition[] {
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

const samePoint = (a: XYPosition | undefined, b: XYPosition | undefined): boolean =>
  !!a && !!b && nearlyEqual(a.x, b.x) && nearlyEqual(a.y, b.y)

/**
 * Corners of an edited ortho edge saved before its ends followed the corners, in drawing order.
 * Where the ends following the corners would move an end, the bend the old route had next to that end
 * becomes a corner, so the edge keeps its route. Converting the result again changes nothing.
 * A self-loop keeps its corners: its ends never followed them.
 */
export function convertLegacyCorners({ controlPoints, ...edge }: Endpoints<EdgeEnd> & {
  controlPoints: ReadonlyArray<XYPosition>
}): XYPosition[] {
  const [from, to] = inDrawingOrder(edge)
  if (isEqualRects(from.node, to.node)) {
    return [...controlPoints]
  }
  const { points: old } = orthoPolyline(controlPoints, from.center, to.center)
  const { points: moved } = editedOrthoPolyline(controlPoints, from, to)
  const result = [...controlPoints]
  // a moved end means the old route bent between the node center and the corner next to it
  if (!samePoint(moved[0], old[0]) && !samePoint(moved[0], old[1])) {
    result.unshift(old[1]!)
  }
  if (!samePoint(moved.at(-1), old.at(-1)) && !samePoint(moved.at(-1), old.at(-2))) {
    result.push(old.at(-2)!)
  }
  return result
}

const SNAP_TOLERANCE = 8 // diagram units

type CornerEditing = Endpoints<EdgeEnd> & {
  controlPoints: ReadonlyArray<XYPosition>
  routing: EdgeRouting
}

/**
 * Snaps a dragged corner to the axes of its neighbours, or the node centers at the ends, within
 * `SNAP_TOLERANCE`. Returns the point unchanged for splines. `followers` names the corners that move with
 * it, by index and the axis of their stretch, and needs `controlPoints` as they were at the press.
 */
export function snapCorner({ index, point, controlPoints, routing, followers, ...edge }: CornerEditing & {
  index: number
  point: XYPosition
  followers?: ReadonlyMap<number, Axis>
}): XYPosition {
  if (routing !== 'ortho') {
    return point
  }
  const [from, to] = inDrawingOrder(edge)
  // Corners that follow move with the dragged corner, so the target on a side is the anchor past them.
  const anchor = (step: -1 | 1, axis: Axis): XYPosition => {
    let i = index + step
    while (followers?.get(i) === axis) {
      i += step
    }
    return controlPoints[i] ?? (step < 0 ? from : to).center
  }
  // A stretch that moves holds its level at the press, as one corner does next to a level neighbour.
  // That level comes first, so it wins a tie.
  const targets = (axis: Axis): XYPosition[] => {
    const moves = followers?.get(index - 1) === axis || followers?.get(index + 1) === axis
    return [...(moves ? [controlPoints[index]!] : []), anchor(-1, axis), anchor(1, axis)]
  }
  const snap = (value: number, candidates: number[]) => {
    let best = value, bestDistance = SNAP_TOLERANCE + 1
    for (const raw of candidates) {
      // Store integer corner coordinates even when node centers have fractional coordinates.
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
    x: snap(point.x, targets('v').map(p => p.x)),
    y: snap(point.y, targets('h').map(p => p.y)),
  }
}

/**
 * Moves a dragged corner from the corners at the press and returns all corners. Under ortho routing, unless
 * `alone`, the corners on each straight stretch it shares with a neighbour follow it across the stretch,
 * up to and including the corner where the line turns. The dragged corner snaps as in {@link snapCorner}
 * and the corners that follow copy its snapped value.
 */
export function dragCorner({ index, point, controlPoints, alone, routing, ...edge }: CornerEditing & {
  index: number
  point: XYPosition
  alone: boolean
}): XYPosition[] {
  const followers = new Map<number, Axis>()
  if (routing === 'ortho' && !alone) {
    for (const step of [-1, 1] as const) {
      const neighbour = controlPoints[index + step]
      const axis = neighbour && stretchAxis(controlPoints[index]!, neighbour)
      if (!axis) {
        continue
      }
      const shared = axis === 'h' ? 'y' : 'x'
      let i = index + step
      while (controlPoints[i] && nearlyEqual(controlPoints[i]![shared], controlPoints[i - step]![shared])) {
        followers.set(i, axis)
        i += step
      }
    }
  }
  const snapped = snapCorner({ index, point, controlPoints, routing, followers, ...edge })
  return controlPoints.map((corner, i) => {
    switch (true) {
      case i === index:
        return snapped
      case followers.get(i) === 'h':
        return { x: corner.x, y: snapped.y }
      case followers.get(i) === 'v':
        return { x: snapped.x, y: corner.y }
      default:
        return corner
    }
  })
}

/**
 * Inserts a corner at the clicked point: projected onto the nearest drawn segment for ortho routing,
 * or the rounded point for splines. Under ortho routing the line keeps its route: where the new corner
 * would move it, the bend drawn there becomes a corner too.
 */
export function insertCorner({ point, controlPoints, routing, ...edge }: CornerEditing & {
  point: XYPosition
}): XYPosition[] {
  const [from, to] = inDrawingOrder(edge)
  const result = [...controlPoints]
  if (routing === 'ortho') {
    const { points, insertAt } = editedOrthoPolyline(controlPoints, from, to)
    let best = { index: 0, point, distance: Infinity }
    for (let i = 1; i < points.length; i++) {
      const candidate = projectOnSegment(point, points[i - 1]!, points[i]!)
      if (candidate.distance < best.distance) {
        best = { index: insertAt[i]!, point: candidate.point, distance: candidate.distance }
      }
    }
    result.splice(best.index, 0, { x: Math.round(best.point.x), y: Math.round(best.point.y) })
    if (!isEqualRects(from.node, to.node)) {
      const after = editedOrthoPolyline(result, from, to).points
      const startBend = points[1], endBend = points.at(-2)
      // The bend next to an end is drawn, not saved. Where the new corner moves that end, keep the bend as a corner.
      if (startBend && !samePoint(after[0], points[0])) {
        result.unshift(startBend)
      }
      if (endBend && !samePoint(after.at(-1), points.at(-1))) {
        result.push(endBend)
      }
      // A corner before a first corner that faces the element can change the turn after it. Keep the bend drawn there.
      // Equal insert indices mean points[2] is a bend after the first corner, not a saved corner.
      const bend = insertAt[2] === insertAt[3] ? points[2] : undefined
      // Relies on the start rule above not having fired, which holds for every click outside the elements.
      if (bend && best.index === 0 && !after.some(p => samePoint(p, bend))) {
        result.splice(2, 0, bend)
      }
    }
    return result
  }
  const anchors = [from.center, ...controlPoints, to.center]
  const newPoint = { x: Math.round(point.x), y: Math.round(point.y) }
  let insertionIndex = 0
  let minDistance = Infinity
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i]!, b = anchors[i + 1]!
    const abx = b.x - a.x, aby = b.y - a.y
    const apx = newPoint.x - a.x, apy = newPoint.y - a.y
    const bpx = newPoint.x - b.x, bpy = newPoint.y - b.y
    // Check whether the pointer projects between the segment endpoints.
    if ((abx * apx + aby * apy) * (abx * bpx + aby * bpy) < 0) {
      // Approximate the curve with the straight segment between its anchors.
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
