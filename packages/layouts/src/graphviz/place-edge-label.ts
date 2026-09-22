import { placeLabelsAlongRoutes, polylineToSegments, splineToPolyline } from '@likec4/core/geometry'
import type { DiagramEdge, DiagramNode } from '@likec4/core/types'
import { isCompound } from './utils'

type EdgeGeometry = Pick<DiagramEdge, 'id' | 'points' | 'labelBBox'>
type NodeGeometry = Pick<DiagramNode, 'x' | 'y' | 'width' | 'height' | 'children'>

/**
 * Returns orthogonal edges with labels placed beside straight route segments.
 *
 * Avoids leaf nodes, other labels, and relationship lines where space permits. Compound boxes
 * remain available because relationships can run inside them. Graphviz's external labels reserve
 * no routing space, so dense views can still require manual adjustment.
 * Preserves edges without labels and the input edge order.
 */
export function placeEdgeLabels<E extends EdgeGeometry>(
  edges: ReadonlyArray<E>,
  nodes: ReadonlyArray<NodeGeometry>,
): E[] {
  const positions = placeLabelsAlongRoutes(
    edges.map(edge => ({
      id: edge.id,
      segments: polylineToSegments(splineToPolyline(edge.points)),
      labelBBox: edge.labelBBox ?? null,
    })),
    nodes.filter(n => !isCompound(n)),
  )
  return edges.map(edge => {
    const labelBBox = positions.get(edge.id)
    return labelBBox ? { ...edge, labelBBox } : edge
  })
}
