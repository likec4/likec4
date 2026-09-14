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

/** distance between the tracks of edges that share a run */
const TRACK_SPACING = 12
/** how close to a node corner a shifted end point may get */
const END_INSET = 8
/** runs this close together count as the same track (the handle a route starts at sits a few units off the node centre) */
const SAME_TRACK = 4

/**
 * The drawn route of an edge, as the polyline of an orthogonal route.
 */
export type TrackRoute =
  & { id: string; points: ReadonlyArray<XYPoint> }
  & (
    /** an untouched route stays where Graphviz put it */
    | { movable: false }
    /** an edited route can move to another track; `bounds` are the node boxes its first and last points lie on, in drawing order */
    | { movable: true; bounds: { from: BBox; to: BBox } }
  )

/** a straight run of a route: its axis, its coordinate across the axis, its extent along it, and its points */
interface Run {
  axis: Axis
  at: number
  lo: number
  hi: number
  /** indices of every point on the run, collinear corners included */
  indices: number[]
}

/** the straight runs of a polyline; collinear pieces form one run so it shifts as a whole */
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

/** whether two runs lie on the same track and overlap by more than a corner touch */
function shareTrack(a: Run, b: Run): boolean {
  return a.axis === b.axis
    && Math.abs(a.at - b.at) <= SAME_TRACK
    && Math.min(a.hi, b.hi) - Math.max(a.lo, b.lo) > 1
}

/**
 * Track offsets of the members of one group: untouched routes keep their place,
 * edited routes take the free tracks around them, in id order so the result is stable.
 */
function offsetsOf(members: ReadonlyArray<{ id: string; movable: boolean }>): Map<string, number> {
  const offsets = new Map<string, number>()
  const movable = members.filter(m => m.movable).map(m => m.id).sort()
  const fixed = members.some(m => !m.movable)
  movable.forEach((id, k) => {
    // with a fixed member on the track itself: +1, -1, +2, -2 ...; otherwise centred on it
    const slot = fixed ? (k % 2 === 0 ? k / 2 + 1 : -(k + 1) / 2) : k - (movable.length - 1) / 2
    offsets.set(id, slot * TRACK_SPACING)
  })
  return offsets
}

/**
 * Every route that is on the same track as `run`, directly or through a chain of overlapping runs,
 * so that all members of a shared track agree on one group whichever of them asks.
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

/** the offset a run may take so that its end point stays on the side of its node */
function clampToSide(offset: number, run: Run, end: XYPoint, box: BBox): number {
  const [value, lo, hi] = run.axis === 'h'
    ? [end.y, box.y + END_INSET, box.y + box.height - END_INSET]
    : [end.x, box.x + END_INSET, box.x + box.width - END_INSET]
  return Math.max(lo - value, Math.min(hi - value, offset))
}

/**
 * The route with every run that shares a track with another edge's run moved onto its own track.
 * Two runs share a track when they lie on the same axis, at the same coordinate, and overlap;
 * runs chained through such overlaps form one group. The shift moves the whole run across its axis,
 * so a run leaving a node slides along the node side, which spreads the exit points of edges that
 * leave the same side; a side too short for all tracks limits the shift of the run that ends on it.
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
 * An edited edge drawn on its own track: its orthogonal route, moved off the runs it shares with the
 * other routes of the view, with rounded corners. Self-loops and spline routing keep their own drawing.
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
