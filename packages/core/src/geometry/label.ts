import { BBox } from './bbox'
import { type Segment, distanceBetween } from './segment'
import type { Dimensions, XYPoint } from './types'

/** free space between the line and the label */
const GAP = 4
/** free space kept between the label and an obstacle */
const CLEARANCE = 6
/** free space kept between the label and a relationship line */
const ROUTE_CLEARANCE = 2

/**
 * What a label needs to be placed along a route
 */
export interface LabelPlacement {
  /** straight runs of the route, in drawing order */
  segments: ReadonlyArray<Segment>
  /** size of the label box */
  size: Dimensions
  /** boxes the label must not touch */
  obstacles: ReadonlyArray<BBox>
  /** relationship segments the label must not cover, including unlabelled relationships */
  routes?: ReadonlyArray<Segment>
}

/** A route and its label box; fixed labels keep their position during automatic placement. */
export interface LabelRoute {
  id: string
  segments: ReadonlyArray<Segment>
  labelBBox: BBox | null
  fixed?: boolean
}

/**
 * Places labels together, reserving manually positioned labels first and each automatic label
 * as it is placed. All routes are obstacles, including those without labels. Stable id order
 * gives the same result when the caller changes the order of the routes.
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
 * Label box beside a route made of straight runs: centred on the middle of the longest run,
 * above a horizontal run or to the right of a vertical one. When that spot touches an obstacle,
 * the other side of the line is tried, then the label slides along the run, then the next
 * longest run is tried. When nothing is clear, the first spot is used anyway.
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
