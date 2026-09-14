import { type XYPoint, BBox, distanceBetween, projectOnSegment, splineToPolyline } from '@likec4/core/geometry'
import type { DiagramEdge, DiagramNode, NodeId } from '@likec4/core/types'

/** distance between two candidate positions along the route (1px: a tight gap may leave a single clear spot) */
const STEP = 1
/**
 * Free space to keep between a label box and the node box it clears.
 * The rendered label pill is a few pixels larger than the text box Graphviz reports,
 * so the margin covers that padding.
 */
const MARGIN = 6

type EdgeGeometry = Pick<DiagramEdge, 'source' | 'target' | 'points' | 'labelBBox'>
type NodeGeometry = Pick<DiagramNode, 'x' | 'y' | 'width' | 'height' | 'children'>

function pointAt(polyline: XYPoint[], distance: number): XYPoint {
  let rest = Math.max(0, distance)
  for (let i = 0; i + 1 < polyline.length; i++) {
    const a = polyline[i]!, b = polyline[i + 1]!
    const len = distanceBetween(a, b)
    if (rest <= len || i + 2 === polyline.length) {
      const t = len === 0 ? 0 : Math.min(1, rest / len)
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    }
    rest -= len
  }
  return polyline[0]!
}

/** distance along the polyline of the point closest to `p` */
function closestDistanceAlong(polyline: XYPoint[], p: XYPoint): number {
  let best = 0, bestDist = Infinity, walked = 0
  for (let i = 0; i + 1 < polyline.length; i++) {
    const a = polyline[i]!, b = polyline[i + 1]!
    const len = distanceBetween(a, b)
    const { t, distance } = projectOnSegment(p, a, b)
    if (distance < bestDist) {
      bestDist = distance
      best = walked + len * t
    }
    walked += len
  }
  return best
}

/**
 * Moves the label of an orthogonally routed edge to the nearest position along the route
 * where it clears the leaf nodes it connects (plus a small margin). Compound endpoints are ignored:
 * a label inside the box of a compound it connects to is expected.
 * Returns the same edge when the label already clears them, or when no position on the route does
 * (for example a label wider than the whole gap between two boxes).
 */
export function nudgeLabelOffEndpoints<E extends EdgeGeometry>(
  edge: E,
  nodes: ReadonlyMap<NodeId, NodeGeometry>,
): E {
  const bbox = edge.labelBBox
  if (!bbox) {
    return edge
  }
  const obstacles = [edge.source, edge.target]
    .map(id => nodes.get(id))
    .filter((n): n is NodeGeometry => !!n && n.children.length === 0)
    .map(n => BBox.expand(n, MARGIN))
  if (!obstacles.some(o => BBox.intersects(bbox, o))) {
    return edge
  }
  const polyline = splineToPolyline(edge.points)
  if (polyline.length < 2) {
    return edge
  }
  const total = polyline.reduce((sum, p, i) => i === 0 ? 0 : sum + distanceBetween(polyline[i - 1]!, p), 0)
  const center = BBox.center(bbox)
  const along = closestDistanceAlong(polyline, center)
  const anchor = pointAt(polyline, along)
  // keep the label's offset from the route while sliding
  const offset = { x: center.x - anchor.x, y: center.y - anchor.y }

  const candidateAt = (distance: number): BBox => {
    const p = pointAt(polyline, distance)
    return {
      ...bbox,
      x: Math.round(p.x + offset.x - bbox.width / 2),
      y: Math.round(p.y + offset.y - bbox.height / 2),
    }
  }
  // walk outward from the current position, the first clear spot wins
  for (let shift = STEP; shift <= Math.max(along, total - along); shift += STEP) {
    for (const distance of [along + shift, along - shift]) {
      if (distance < 0 || distance > total) {
        continue
      }
      const candidate = candidateAt(distance)
      if (!obstacles.some(o => BBox.intersects(candidate, o))) {
        return { ...edge, labelBBox: candidate }
      }
    }
  }
  return edge
}
