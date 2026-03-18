import type { ComputedView, DiagramEdge, DiagramNode, LayoutedView } from '../types'
import { _layout, _stage } from '../types'

/**
 * When restoring a LayoutedView from cache, the cached view may have stale
 * non-layout data (colors, links, tags, title, navigateTo, etc.)
 * because view-hash only covers layout-affecting properties.
 * This merges current ComputedView data onto the cached layout.
 */
export function applyCachedLayout(current: ComputedView, cached: LayoutedView): LayoutedView {
  const { nodes: currentNodes, edges: currentEdges, hasManualLayout, ...viewProps } = current

  const nodeMap = new Map(currentNodes.map(n => [n.id, n]))
  const edgeMap = new Map(currentEdges.map(e => [e.id, e]))

  const nodes = cached.nodes.map(cachedNode => {
    const computed = nodeMap.get(cachedNode.id)
    if (!computed) return cachedNode
    return {
      ...computed,
      x: cachedNode.x,
      y: cachedNode.y,
      width: cachedNode.width,
      height: cachedNode.height,
      labelBBox: cachedNode.labelBBox,
    } as DiagramNode
  })

  const edges = cached.edges.map(cachedEdge => {
    const computed = edgeMap.get(cachedEdge.id)
    if (!computed) return cachedEdge
    return {
      ...computed,
      points: cachedEdge.points,
      label: cachedEdge.label,
      ...(cachedEdge.controlPoints != null && { controlPoints: cachedEdge.controlPoints }),
      ...(cachedEdge.labelBBox != null && { labelBBox: cachedEdge.labelBBox }),
    } as DiagramEdge
  })

  return {
    ...cached,
    ...viewProps,
    [_stage]: 'layouted' as const,
    [_layout]: hasManualLayout ? 'auto' as const : undefined,
    bounds: cached.bounds,
    nodes,
    edges,
  } as LayoutedView
}
