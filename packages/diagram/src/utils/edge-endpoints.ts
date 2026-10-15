import type { HandleType, InternalNode, XYPosition } from '@xyflow/react'
import type { EdgeEnd } from './edge-path'
import { type MinimalInternalNode, nodeToRect } from './xyflow'

type EndpointNode = MinimalInternalNode & {
  internals: Pick<InternalNode['internals'], 'handleBounds'>
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
    : { x: Math.trunc(rect.x + rect.width / 2), y: Math.trunc(rect.y + rect.height / 2) }
  return { center, node: rect }
}

/**
 * Handle centers of both edge nodes, which is where the route is drawn from.
 * Falls back to the positions XYFlow passes to the edge when a node is missing.
 */
export function edgeEndCenters(
  nodeLookup: ReadonlyMap<string, EndpointNode>,
  edge: { source: string; target: string; sourceX: number; sourceY: number; targetX: number; targetY: number },
): { source: XYPosition; target: XYPosition } {
  return {
    source: edgeEndFromNode(nodeLookup.get(edge.source), 'source')?.center ?? { x: edge.sourceX, y: edge.sourceY },
    target: edgeEndFromNode(nodeLookup.get(edge.target), 'target')?.center ?? { x: edge.targetX, y: edge.targetY },
  }
}
