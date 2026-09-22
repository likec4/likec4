import {
  type BBox,
  type Dimensions,
  type Segment,
  distanceBetween,
  placeLabelAlongSegments,
} from '@likec4/core/geometry'
import type { EdgeRouting } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/react'
import { firstBy } from 'remeda'

/**
 * The subset of `SVGPathElement` needed to place a label along a path.
 */
export interface MeasurablePath {
  getTotalLength(): number
  getPointAtLength(distance: number): { x: number; y: number }
}

/**
 * Top-left of the label of an edge being edited.
 * Under spline routing the label is centred on half the path length.
 * Under ortho routing an auto-placed label sits beside the middle of the longest straight run,
 * clear of nodes, other labels, and routes, the same rule the layout side applies to untouched edges.
 * A label the user moved by hand (`customized`) keeps its offset from a base that does not flip sides
 * as the route changes: the middle of the longest run itself.
 */
export function edgeLabelPosition({ path, segments, routing, size, obstacles, routes = [], customized = false }: {
  path: MeasurablePath
  segments: ReadonlyArray<Segment>
  routing: EdgeRouting
  size: Dimensions
  obstacles: ReadonlyArray<BBox>
  routes?: ReadonlyArray<Segment>
  customized?: boolean
}): XYPosition {
  if (routing === 'ortho' && segments.length > 0) {
    if (!customized) {
      const { x, y } = placeLabelAlongSegments({ segments, size, obstacles, routes })
      return { x, y }
    }
    // the longest run, the first one on a tie
    const [a, b] = firstBy(segments, [s => distanceBetween(s[0], s[1]), 'desc'])!
    return centredAt({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, size)
  }
  return centredAt(path.getPointAtLength(path.getTotalLength() * 0.5), size)
}

function centredAt(point: { x: number; y: number }, size: Dimensions): XYPosition {
  return {
    x: Math.round(point.x - size.width / 2),
    y: Math.round(point.y - size.height / 2),
  }
}
