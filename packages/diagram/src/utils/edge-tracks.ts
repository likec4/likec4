import type { EdgeRouting } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/react'
import { type BBox, type XYPoint, nearlyEqual } from '@likec4/core/geometry'
import { sortBy } from 'remeda'
import {
  type Axis,
  type DrawnEdge,
  type EdgeEnd,
  type Endpoints,
  drawnFromRoute,
  editedEdgePath,
  editedEdgeRoute,
  END_INSET,
  stretchAxis,
} from './edge-path'

// Track separation, in diagram units
const TRACK_SPACING = 12
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
  /** Where the route goes at the ends of the run: negative up or left, positive down or right. */
  turn: number
}

/** A route of a track group with the run that decides its place in the group. */
type Member = { id: string; movable: boolean; run: Run }

/** The side of the run a point lies on: negative up or left, positive down or right, zero on the run. */
function sideOf(run: Run, p: XYPoint | undefined): number {
  const value = p && (run.axis === 'h' ? p.y : p.x)
  return value === undefined || nearlyEqual(value, run.at) ? 0 : Math.sign(value - run.at)
}

/** Straight runs, merging collinear pieces so each run shifts as a whole. */
function runsOf(points: ReadonlyArray<XYPoint>): Run[] {
  const runs: Run[] = []
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!, b = points[i]!
    const axis = stretchAxis(a, b)
    if (!axis) {
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
      runs.push({ axis, at, lo, hi, indices: [i - 1, i], turn: 0 })
    }
  }
  for (const run of runs) {
    run.turn = sideOf(run, points[run.indices[0]! - 1]) + sideOf(run, points[run.indices.at(-1)! + 1])
  }
  return runs
}

function shareTrack(a: Run, b: Run): boolean {
  return a.axis === b.axis
    && Math.abs(a.at - b.at) <= SAME_TRACK
    && Math.min(a.hi, b.hi) - Math.max(a.lo, b.lo) > 1
}

/**
 * Track offsets for the movable routes of a group: around a fixed route, otherwise centered on the
 * original track. The tracks are ordered so that routes do not cross where they leave the group: a
 * route turning up or left runs above or left of one turning down or right, and of two turning the
 * same way the one that turns first runs on the outside. Ties keep a stable id order.
 */
function offsetsOf(members: ReadonlyArray<Member>): Map<string, number> {
  const sorted = sortBy(
    members,
    ({ run }) => run.turn,
    ({ run }) => -Math.sign(run.turn) * (run.hi - run.lo),
    ({ id }) => id,
  )
  const fixed = sorted.find(m => !m.movable)
  const order = sorted.filter(m => m.movable || m === fixed)
  // shortcut: routes that turn the same way all sit on one side of a fixed route, so a short node side
  // runs out of room sooner; space the tracks closer when that shows up
  const origin = fixed ? order.indexOf(fixed) : (order.length - 1) / 2
  return new Map(order.map((m, k) => [m.id, (k - origin) * TRACK_SPACING]))
}

/**
 * Routes sharing a track with this run, following transitive overlaps so every route computes the
 * same group. A route with several runs in the group is placed by its first one along the track.
 */
function trackMembers(
  own: Member,
  routes: ReadonlyArray<{ id: string; movable: boolean; runs: Run[] }>,
): Member[] {
  const members = new Map<string, Member>([[own.id, own]])
  const queue: Run[] = [own.run]
  const seen = new Set<Run>(queue)
  while (queue.length > 0) {
    const run = queue.shift()!
    for (const { id, movable, runs } of routes) {
      for (const candidate of runs) {
        if (seen.has(candidate) || !shareTrack(run, candidate)) {
          continue
        }
        seen.add(candidate)
        queue.push(candidate)
        const member = members.get(id)
        if (!member || (candidate.lo - member.run.lo || candidate.hi - member.run.hi) < 0) {
          members.set(id, { id, movable, run: candidate })
        }
      }
    }
  }
  return [...members.values()]
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
  // the route's own runs take part too: its other runs on the track belong to the same group
  const routes = [
    { id: route.id, movable: true, runs },
    ...others.filter(o => o.id !== route.id).map(o => ({ id: o.id, movable: o.movable, runs: runsOf(o.points) })),
  ]
  const dx: number[] = []
  const dy: number[] = []
  for (const run of runs) {
    const members = trackMembers({ id: route.id, movable: true, run }, routes)
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
