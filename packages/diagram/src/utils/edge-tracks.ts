import { type BBox, type XYPoint, nearlyEqual } from '@likec4/core/geometry'
import type { EdgeRouting } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/react'
import {
  type Axis,
  type DrawnEdge,
  type EdgeEnd,
  type Endpoints,
  drawnFromRoute,
  editedEdgePath,
  editedEdgeRoute,
} from './edge-path'

/** Target spacing between shared tracks, in diagram units. */
const TRACK_SPACING = 12
/** Minimum distance from a shifted endpoint to a node corner, in diagram units. */
const END_INSET = 8
/** Maximum separation for shared tracks, accounting for handles offset from node centers. */
const SAME_TRACK = 4

/**
 * An orthogonal edge polyline and the constraints on moving it between tracks.
 */
export type TrackRoute =
  & { id: string; points: ReadonlyArray<XYPoint> }
  & (
    /** An unedited route retains its Graphviz position. */
    | { movable: false }
    /** A movable route with endpoint node bounds in drawing order. */
    | { movable: true; bounds: { from: BBox; to: BBox } }
  )

/** A straight run with its axis, perpendicular coordinate, extent, and point indices. */
interface Run {
  axis: Axis
  at: number
  lo: number
  hi: number
  /** Indices of all points on the run, including collinear corners. */
  indices: number[]
}

/**
 * Returns straight runs, merging collinear pieces so each run shifts as a whole.
 */
function runsOf(points: ReadonlyArray<XYPoint>): Run[] {
  const runs: Run[] = []
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!, b = points[i]!
    let axis: Axis
    switch (true) {
      case nearlyEqual(a.y, b.y) && !nearlyEqual(a.x, b.x):
        axis = 'h'
        break
      case nearlyEqual(a.x, b.x) && !nearlyEqual(a.y, b.y):
        axis = 'v'
        break
      default:
        continue
    }
    const at = axis === 'h' ? a.y : a.x
    const [lo, hi] = axis === 'h' ? [Math.min(a.x, b.x), Math.max(a.x, b.x)] : [Math.min(a.y, b.y), Math.max(a.y, b.y)]
    const previous = runs[runs.length - 1]
    if (
      previous && previous.axis === axis && previous.indices[previous.indices.length - 1] === i - 1 &&
      nearlyEqual(previous.at, at)
    ) {
      previous.lo = Math.min(previous.lo, lo)
      previous.hi = Math.max(previous.hi, hi)
      previous.indices.push(i)
    } else {
      runs.push({ axis, at, lo, hi, indices: [i - 1, i] })
    }
  }
  return runs
}

/**
 * Checks whether parallel runs are within `SAME_TRACK` units and overlap by more than one unit.
 */
function shareTrack(a: Run, b: Run): boolean {
  return a.axis === b.axis
    && Math.abs(a.at - b.at) <= SAME_TRACK
    && Math.min(a.hi, b.hi) - Math.max(a.lo, b.lo) > 1
}

/**
 * Returns track offsets for edited routes in stable identifier order.
 *
 * Leaves unedited routes fixed and assigns edited routes to adjacent free tracks.
 */
function offsetsOf(members: ReadonlyArray<{ id: string; movable: boolean }>): Map<string, number> {
  const offsets = new Map<string, number>()
  const movable = members.filter(m => m.movable).map(m => m.id).sort()
  const fixed = members.some(m => !m.movable)
  movable.forEach((id, k) => {
    // Alternate around a fixed route; otherwise center the group on the original track.
    const slot = fixed ? (k % 2 === 0 ? k / 2 + 1 : -(k + 1) / 2) : k - (movable.length - 1) / 2
    offsets.set(id, slot * TRACK_SPACING)
  })
  return offsets
}

/**
 * Returns routes connected to a run through overlapping shared tracks.
 *
 * Includes transitive overlaps so every route computes the same group.
 */
function trackMembers(
  own: { id: string; run: Run },
  others: ReadonlyArray<{ id: string; movable: boolean; runs: Run[] }>,
): Array<{ id: string; movable: boolean }> {
  const members = new Map<string, boolean>([[own.id, true]])
  const queue: Run[] = [own.run]
  const seen = new Set<Run>([own.run])
  while (queue.length > 0) {
    const run = queue.shift()!
    for (const other of others) {
      for (const candidate of other.runs) {
        if (!seen.has(candidate) && shareTrack(run, candidate)) {
          seen.add(candidate)
          queue.push(candidate)
          members.set(other.id, other.movable)
        }
      }
    }
  }
  return [...members].map(([id, movable]) => ({ id, movable }))
}

/**
 * Limits a track offset to keep the endpoint on its node side.
 */
function clampToSide(offset: number, run: Run, end: XYPoint, box: BBox): number {
  const [value, lo, hi] = run.axis === 'h'
    ? [end.y, box.y + END_INSET, box.y + box.height - END_INSET]
    : [end.x, box.x + END_INSET, box.x + box.width - END_INSET]
  return Math.max(lo - value, Math.min(hi - value, offset))
}

/**
 * Returns a route shifted to separate segments that share tracks with other edges.
 *
 * Groups overlapping parallel runs within `SAME_TRACK` diagram units, including transitive overlaps.
 * Moves each run perpendicular to its axis. At node borders, limits shifts to the available side length,
 * so endpoints can remain closer than `TRACK_SPACING`. Unedited routes retain their positions.
 */
export function keepOwnTrack(route: TrackRoute, others: ReadonlyArray<TrackRoute>): XYPoint[] {
  if (!route.movable || route.points.length < 2) {
    return [...route.points]
  }
  const runs = runsOf(route.points)
  const otherRuns = others
    .filter(o => o.id !== route.id)
    .map(o => ({ id: o.id, movable: o.movable, runs: runsOf(o.points) }))
  const dx: number[] = []
  const dy: number[] = []
  for (const run of runs) {
    const members = trackMembers({ id: route.id, run }, otherRuns)
    if (members.length < 2) {
      continue
    }
    let offset = offsetsOf(members).get(route.id) ?? 0
    if (run === runs[0]) {
      offset = clampToSide(offset, run, route.points[0]!, route.bounds.from)
    }
    if (run === runs[runs.length - 1]) {
      offset = clampToSide(offset, run, route.points[route.points.length - 1]!, route.bounds.to)
    }
    for (const i of run.indices) {
      if (run.axis === 'h') {
        dy[i] = offset
      } else {
        dx[i] = offset
      }
    }
  }
  return route.points.map((p, i) => ({ x: p.x + (dx[i] ?? 0), y: p.y + (dy[i] ?? 0) }))
}

/**
 * Returns an edited edge path with track separation and rounded orthogonal corners.
 *
 * Applies track separation where endpoint space permits. Self-loops and spline routes
 * use their existing path construction.
 */
export function trackedEdgePath({ id, controlPoints, routing, others, ...endpoints }: Endpoints<EdgeEnd> & {
  id: string
  controlPoints: ReadonlyArray<XYPosition>
  routing: EdgeRouting
  others: Iterable<TrackRoute>
}): DrawnEdge {
  const route = routing === 'ortho' ? editedEdgeRoute({ ...endpoints, controlPoints }) : null
  if (!route) {
    return editedEdgePath({ ...endpoints, controlPoints, routing })
  }
  return drawnFromRoute(keepOwnTrack({ id, movable: true, ...route }, [...others]))
}
