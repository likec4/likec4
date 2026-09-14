import { BBox } from './bbox'
import { type Segment, distanceBetween } from './segment'
import type { Dimensions, XYPoint } from './types'

/** free space between the line and the label */
const GAP = 4
/** free space kept between the label and an obstacle */
const CLEARANCE = 6
/** distance between candidate positions when sliding along a run */
const STEP = 8

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
}

/**
 * Label box beside a route made of straight runs: centred on the middle of the longest run,
 * above a horizontal run or to the right of a vertical one. When that spot touches an obstacle,
 * the other side of the line is tried, then the label slides along the run, then the next
 * longest run is tried. When nothing is clear, the first spot is used anyway.
 */
export function placeLabelAlongSegments({ segments, size, obstacles }: LabelPlacement): BBox {
  const blocked = obstacles.map(o => BBox.expand(o, CLEARANCE))
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
    for (let shift = 0; shift <= length / 2; shift += STEP) {
      for (const along of shift === 0 ? [0] : [shift, -shift]) {
        const p = { x: mid.x + ux * along, y: mid.y + uy * along }
        for (const otherSide of [false, true]) {
          const box = beside(p, otherSide)
          if (isClear(box)) {
            return box
          }
        }
      }
    }
  }
  return fallback ?? { x: 0, y: 0, width: size.width, height: size.height }
}
