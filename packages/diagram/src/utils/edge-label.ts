import { distanceBetween } from '@likec4/core/geometry'
import type { EdgeRouting } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/react'
import type { Segment } from './edge-path'

/**
 * The subset of `SVGPathElement` needed to place a label along a path.
 */
export interface MeasurablePath {
  getTotalLength(): number
  getPointAtLength(distance: number): { x: number; y: number }
}

/**
 * Midpoint of the longest straight segment; ties go to the first one.
 */
function longestSegmentMidpoint(segments: ReadonlyArray<Segment>): XYPosition | null {
  let best: Segment | null = null
  let bestLength = -1
  for (const segment of segments) {
    const length = distanceBetween(segment[0], segment[1])
    if (length > bestLength) {
      bestLength = length
      best = segment
    }
  }
  if (!best) {
    return null
  }
  const [a, b] = best
  return { x: Math.round((a.x + b.x) / 2), y: Math.round((a.y + b.y) / 2) }
}

/**
 * Anchor of the edge label on an edge being edited:
 * half the path length under spline routing, the midpoint of the longest straight segment under ortho.
 */
export function edgeLabelAnchor({ path, segments, routing }: {
  path: MeasurablePath
  segments: ReadonlyArray<Segment>
  routing: EdgeRouting
}): XYPosition {
  if (routing === 'ortho') {
    const anchor = longestSegmentMidpoint(segments)
    if (anchor) {
      return anchor
    }
  }
  const point = path.getPointAtLength(path.getTotalLength() * 0.5)
  return {
    x: Math.round(point.x),
    y: Math.round(point.y),
  }
}
