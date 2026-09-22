import { placeLabelsAlongRoutes, polylineToSegments, splineToPolyline } from '@likec4/core/geometry'
import type { DiagramEdge, DiagramNode } from '@likec4/core/types'
import { isCompound } from './utils'

type EdgeGeometry = Pick<DiagramEdge, 'id' | 'points' | 'labelBBox'>
type NodeGeometry = Pick<DiagramNode, 'x' | 'y' | 'width' | 'height' | 'children'>

/**
 * Places the labels of orthogonal edges beside straight runs, avoiding leaf nodes, other labels and
 * routes. Compound boxes are not obstacles because routes run inside them.
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
