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
  for (const route of [...routes].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
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
    const beside = (p: XYPoint, otherSide: boolean): BBox =>
      horizontal
        ? {
          x: Math.round(p.x - size.width / 2),
          y: Math.round(otherSide ? p.y + GAP : p.y - GAP - size.height),
          width: size.width,
          height: size.height,
        }
        : {
          x: Math.round(otherSide ? p.x - GAP - size.width : p.x + GAP),
          y: Math.round(p.y - size.height / 2),
          width: size.width,
          height: size.height,
        }
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    fallback ??= beside(mid, false)
    const ux = length === 0 ? 0 : (b.x - a.x) / length
    const uy = length === 0 ? 0 : (b.y - a.y) / length
    // A clear interval starts or ends at an obstacle boundary. Check those positions
    // exactly so a narrow gap is not skipped by stepping along the route.
    const shifts = new Set([0, length / 2, -length / 2])
    const extent = horizontal ? size.width : size.height
    const origin = horizontal ? mid.x : mid.y
    const direction = horizontal ? ux : uy
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
    for (const along of [...shifts].sort((a, b) => Math.abs(a) - Math.abs(b) || b - a)) {
      const p = { x: mid.x + ux * along, y: mid.y + uy * along }
      for (const otherSide of [false, true]) {
        const box = beside(p, otherSide)
        if (isClear(box)) {
          return box
        }
      }
    }
  }
  return fallback ?? { x: 0, y: 0, width: size.width, height: size.height }
}
