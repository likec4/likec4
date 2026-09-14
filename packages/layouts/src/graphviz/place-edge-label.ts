import { placeLabelAlongSegments, polylineToSegments, splineToPolyline } from '@likec4/core/geometry'
import type { DiagramEdge, DiagramNode } from '@likec4/core/types'
import { isCompound } from './utils'

type EdgeGeometry = Pick<DiagramEdge, 'points' | 'labelBBox'>
type NodeGeometry = Pick<DiagramNode, 'x' | 'y' | 'width' | 'height' | 'children'>

/**
 * Places the label of an orthogonally routed edge beside the middle of the longest straight run
 * of its route, clear of every leaf node in the view. Compound nodes are not obstacles:
 * a route, and its label, may run inside the box of a compound.
 * Graphviz puts an `xlabel` near the midpoint by path length, which on an L-shaped route
 * is the bend, and it reserves no space for it, so the label may sit on a node.
 * Returns the same edge when it has no label.
 */
export function placeEdgeLabel<E extends EdgeGeometry>(edge: E, nodes: ReadonlyArray<NodeGeometry>): E {
  const bbox = edge.labelBBox
  if (!bbox) {
    return edge
  }
  const segments = polylineToSegments(splineToPolyline(edge.points))
  if (segments.length === 0) {
    return edge
  }
  const obstacles = nodes.filter(n => !isCompound(n))
  const { x, y } = placeLabelAlongSegments({ segments, size: bbox, obstacles })
  return { ...edge, labelBBox: { ...bbox, x, y } }
}
