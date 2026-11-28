import type { BBox } from '@likec4/core/geometry'
import type { HandleType, InternalNode } from '@xyflow/react'
import type { EdgeEnd } from './edge-path'
import { type MinimalInternalNode, nodeToRect } from './xyflow'

type EndpointNode = MinimalInternalNode & {
  internals: Pick<InternalNode['internals'], 'handleBounds'>
}

/** An edge endpoint at the center of a box. */
export function edgeEndAtCenter(node: BBox): EdgeEnd {
  return { center: { x: Math.trunc(node.x + node.width / 2), y: Math.trunc(node.y + node.height / 2) }, node }
}

/**
 * Returns an edge endpoint from the node's actual bounds and handle center.
 * Falls back to the node center when handle bounds are unavailable.
 */
export function edgeEndFromNode(node: EndpointNode | undefined, handle: HandleType): EdgeEnd | null {
  if (!node) {
    return null
  }
  const rect = nodeToRect(node)
  const bounds = node.internals.handleBounds?.[handle]?.[0]
  const center = bounds
    ? { x: Math.trunc(rect.x + bounds.x + bounds.width / 2), y: Math.trunc(rect.y + bounds.y + bounds.height / 2) }
    : edgeEndAtCenter(rect).center
  return { center, node: rect }
}

type EdgeOfNodes = {
  source: string
  target: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
}

/**
 * Both ends of an edge with their node bounds, which is where the route is drawn from.
 * Falls back to a box of size zero at the position XYFlow passes to the edge when a node is missing.
 */
export function edgeEndsFromNodes(
  nodeLookup: ReadonlyMap<string, EndpointNode>,
  edge: EdgeOfNodes,
): { source: EdgeEnd; target: EdgeEnd } {
  const at = (x: number, y: number): EdgeEnd => ({ center: { x, y }, node: { x, y, width: 0, height: 0 } })
  return {
    source: edgeEndFromNode(nodeLookup.get(edge.source), 'source') ?? at(edge.sourceX, edge.sourceY),
    target: edgeEndFromNode(nodeLookup.get(edge.target), 'target') ?? at(edge.targetX, edge.targetY),
  }
}
