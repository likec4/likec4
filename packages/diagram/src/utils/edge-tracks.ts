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

// Track separation, in diagram units
const TRACK_SPACING = 12
const END_INSET = 8
const SAME_TRACK = 4 // runs this close share a track; handles can sit off the node center

/** An orthogonal edge polyline and whether it may move to another track. */
export type TrackRoute =
  & { id: string; points: ReadonlyArray<XYPoint> }
  & (
    | { movable: false }
    | { movable: true; bounds: { from: BBox; to: BBox } }
  )

interface Run {
  axis: Axis
  at: number
  lo: number
  hi: number
  /** Indices of all points on the run, including collinear corners. */
  indices: number[]
}

/** Straight runs, merging collinear pieces so each run shifts as a whole. */
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
    const previous = runs.at(-1)
    if (previous?.axis === axis && previous.indices.at(-1) === i - 1 && nearlyEqual(previous.at, at)) {
      previous.lo = Math.min(previous.lo, lo)
      previous.hi = Math.max(previous.hi, hi)
      previous.indices.push(i)
    } else {
      runs.push({ axis, at, lo, hi, indices: [i - 1, i] })
    }
  }
  return runs
}

function shareTrack(a: Run, b: Run): boolean {
  return a.axis === b.axis
    && Math.abs(a.at - b.at) <= SAME_TRACK
    && Math.min(a.hi, b.hi) - Math.max(a.lo, b.lo) > 1
}

/** Track offsets for the movable routes of a group, in stable id order. */
function offsetsOf(members: ReadonlyArray<{ id: string; movable: boolean }>): Map<string, number> {
  const offsets = new Map<string, number>()
  const movable = members.filter(m => m.movable).map(m => m.id).sort()
  const fixed = members.some(m => !m.movable)
  movable.forEach((id, k) => {
    offsets.set(id, trackSlot(k, movable.length, fixed) * TRACK_SPACING)
  })
  return offsets
}

/** Slot of the k-th movable route: alternating around a fixed route, otherwise centered on the original track. */
function trackSlot(k: number, count: number, aroundFixed: boolean): number {
  if (!aroundFixed) {
    return k - (count - 1) / 2
  }
  return k % 2 === 0 ? k / 2 + 1 : -(k + 1) / 2
}

/** Routes sharing a track with this run, following transitive overlaps so every route computes the same group. */
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

function clampToSide(offset: number, run: Run, end: XYPoint, box: BBox): number {
  const [value, lo, hi] = run.axis === 'h'
    ? [end.y, box.y + END_INSET, box.y + box.height - END_INSET]
    : [end.x, box.x + END_INSET, box.x + box.width - END_INSET]
  return Math.max(lo - value, Math.min(hi - value, offset))
}

/**
 * Shifts the route's runs that share a track with other edges, each run as a whole and perpendicular
 * to its axis. The first and last run are limited to the node side, so endpoints can end up closer
 * than `TRACK_SPACING`. Unedited routes never move.
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
    if (run === runs.at(-1)) {
      offset = clampToSide(offset, run, route.points.at(-1)!, route.bounds.to)
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

/** Path of an edited edge with track separation applied; self-loops and splines use the plain path. */
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
