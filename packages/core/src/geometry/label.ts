import { BBox } from './bbox'
import { type Segment, distanceBetween } from './segment'
import type { Dimensions, XYPoint } from './types'

/** Preferred gap between a route and its label, in diagram units. */
const GAP = 4
/** Clearance from node and label boxes, in diagram units. */
const CLEARANCE = 6
/** Clearance from relationship lines, in diagram units. */
const ROUTE_CLEARANCE = 2

/**
 * Route geometry, label dimensions, and obstacles for automatic label placement.
 */
export interface LabelPlacement {
  /** The route segments, in drawing order. */
  segments: ReadonlyArray<Segment>
  /** The label dimensions, in diagram units. */
  size: Dimensions
  /** The node and label boxes to avoid when a clear position exists. */
  obstacles: ReadonlyArray<BBox>
  /** The relationship segments to avoid, including unlabeled routes. Defaults to an empty list. */
  routes?: ReadonlyArray<Segment>
}

/** A route and its label box; fixed labels keep their position during automatic placement. */
export interface LabelRoute {
  /** The unique route identifier, used to order label placement. */
  id: string
  /** The route segments, in drawing order. */
  segments: ReadonlyArray<Segment>
  /** The existing label box, or `null` for a route without a label. */
  labelBBox: BBox | null
  /** If true, preserves the label position. If false or omitted, places the label automatically. */
  fixed?: boolean
}

/**
 * Places route labels together to avoid nodes, other labels, and relationship lines.
 *
 * Reserves fixed labels and labels without segments before placing automatic labels.
 * Processes automatic labels in identifier order, reserving each position for subsequent labels.
 * Uses all route segments as obstacles, including routes without labels.
 * If no clear position exists, uses the fallback from {@link placeLabelAlongSegments}.
 *
 * @param routes The routes and existing label boxes, with unique identifiers.
 * @param obstacles The node boxes and other reserved areas to avoid.
 * @returns The placed and fixed label boxes by route identifier. Omits routes without labels.
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
 * Returns a label box beside a route, preferring the midpoint of its longest segment.
 *
 * Tries positions above horizontal segments or to the right of vertical segments first.
 * If a position overlaps an obstacle, tries the opposite side, positions along the segment,
 * and then shorter segments. Equal-length segments retain their input order.
 *
 * @returns The first clear label box. If all candidates overlap obstacles, returns the first
 * candidate beside the longest segment. With no segments, returns a box at the origin.
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

/**
 * Returns the label box beside point `p` on a segment: above a horizontal segment or right of a
 * vertical one, or on the opposite side when `otherSide` is set.
 */
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
 * Returns candidate shifts along a segment from its midpoint, nearest first.
 *
 * Includes the midpoint, both ends, and every position where the label sits flush against an
 * obstacle boundary. A clear interval starts or ends at an obstacle boundary, so checking those
 * positions exactly avoids skipping a narrow gap when stepping along the route.
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
