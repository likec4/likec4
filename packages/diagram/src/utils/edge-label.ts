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
 * Returns the label's top-left position for an edge being edited.
 *
 * For spline routing, centers the label at half the path length. For orthogonal routing,
 * places automatic labels beside straight segments while avoiding obstacles where space permits.
 * For customized labels, returns a base position centered on the longest segment.
 * The caller adds the saved offset to preserve manual placement.
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
    // Use the longest segment, retaining the first on equal lengths.
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
