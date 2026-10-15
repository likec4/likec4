import { BBox } from './bbox'
import { type Segment, distanceBetween } from './segment'
import type { Dimensions, XYPoint } from './types'

// Spacing around labels, in diagram units
const GAP = 4
const CLEARANCE = 6
const ROUTE_CLEARANCE = 2

export interface LabelPlacement {
  segments: ReadonlyArray<Segment>
  size: Dimensions
  obstacles: ReadonlyArray<BBox>
  /** Relationship segments to avoid, including unlabeled routes. Defaults to none. */
  routes?: ReadonlyArray<Segment>
}

/** A route and its label box. */
export interface LabelRoute {
  id: string
  segments: ReadonlyArray<Segment>
  labelBBox: BBox | null
  /** Keeps the label where it is instead of placing it automatically. */
  fixed?: boolean
}

/**
 * Places the labels of several routes together, so each avoids nodes, other labels and every route.
 * Fixed labels and labels of routes without segments keep their boxes; the rest are placed in id order.
 */
export function placeLabelsAlongRoutes(
  routes: ReadonlyArray<LabelRoute>,
  obstacles: ReadonlyArray<BBox>,
): ReadonlyMap<string, BBox> {
  const placed = new Map<string, BBox>()
  const occupied = [...obstacles]
  const segments = routes.flatMap(route => route.segments)
  for (const route of routes) {
    if (route.labelBBox && (route.fixed || route.segments.length === 0)) {
      placed.set(route.id, route.labelBBox)
      occupied.push(route.labelBBox)
    }
  }
  for (const route of [...routes].sort(compareIds)) {
    if (!route.labelBBox || placed.has(route.id)) {
      continue
    }
    const box = placeLabelAlongSegments({
      segments: route.segments,
      size: route.labelBBox,
      obstacles: occupied,
      routes: segments,
    })
    placed.set(route.id, box)
    occupied.push(box)
  }
  return placed
}

/**
 * Places a label beside the route, preferring the midpoint of its longest segment: above a horizontal
 * run or right of a vertical one, then the other side, then along the run, then shorter runs.
 * Falls back to the first candidate when nothing is clear.
 */
export function placeLabelAlongSegments({ segments, size, obstacles, routes = [] }: LabelPlacement): BBox {
  const blocked = [
    ...obstacles.map(o => BBox.expand(o, CLEARANCE)),
    ...routes.map(([a, b]) => BBox.expand(BBox.fromPoints([[a.x, a.y], [b.x, b.y]]), ROUTE_CLEARANCE)),
  ]
  const isClear = (box: BBox) => !blocked.some(o => BBox.intersects(o, box))
  const byLength = segments
    .map((segment, index) => ({ segment, index, length: distanceBetween(segment[0], segment[1]) }))
    .sort((a, b) => b.length - a.length || a.index - b.index)
  let fallback: BBox | null = null
  for (const { segment: [a, b], length } of byLength) {
    const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    fallback ??= labelBeside(mid, size, horizontal, false)
    const ux = length === 0 ? 0 : (b.x - a.x) / length
    const uy = length === 0 ? 0 : (b.y - a.y) / length
    const shifts = shiftsAlong(
      {
        origin: horizontal ? mid.x : mid.y,
        direction: horizontal ? ux : uy,
        length,
        extent: horizontal ? size.width : size.height,
      },
      blocked,
      horizontal,
    )
    for (const along of shifts) {
      const p = { x: mid.x + ux * along, y: mid.y + uy * along }
      for (const otherSide of [false, true]) {
        const box = labelBeside(p, size, horizontal, otherSide)
        if (isClear(box)) {
          return box
        }
      }
    }
  }
  return fallback ?? { x: 0, y: 0, width: size.width, height: size.height }
}

function compareIds(a: LabelRoute, b: LabelRoute): number {
  if (a.id < b.id) {
    return -1
  }
  return a.id > b.id ? 1 : 0
}

function labelBeside(p: XYPoint, size: Dimensions, horizontal: boolean, otherSide: boolean): BBox {
  if (horizontal) {
    return {
      x: Math.round(p.x - size.width / 2),
      y: Math.round(otherSide ? p.y + GAP : p.y - GAP - size.height),
      width: size.width,
      height: size.height,
    }
  }
  return {
    x: Math.round(otherSide ? p.x - GAP - size.width : p.x + GAP),
    y: Math.round(p.y - size.height / 2),
    width: size.width,
    height: size.height,
  }
}

/**
 * Candidate offsets from the segment midpoint, nearest first. Includes the positions where the label
 * sits flush against an obstacle boundary, so a narrow gap between obstacles is not skipped.
 */
function shiftsAlong(
  { origin, direction, length, extent }: { origin: number; direction: number; length: number; extent: number },
  blocked: ReadonlyArray<BBox>,
  horizontal: boolean,
): number[] {
  const shifts = new Set([0, length / 2, -length / 2])
  if (direction !== 0) {
    for (const obstacle of blocked) {
      const start = horizontal ? obstacle.x : obstacle.y
      const end = start + (horizontal ? obstacle.width : obstacle.height)
      for (const coordinate of [Math.floor(start - extent) + extent / 2, Math.ceil(end) + extent / 2]) {
        const shift = (coordinate - origin) / direction
        if (Math.abs(shift) <= length / 2) {
          shifts.add(shift)
        }
      }
    }
  }
  return [...shifts].sort((a, b) => Math.abs(a) - Math.abs(b) || b - a)
}
