import { isEqualReactSimple as eq } from '@react-hookz/deep-equal'
import { memo } from 'react'
import useTilg from 'tilg'
import { useUpdateEffect } from '../hooks/use-update-effect'
import { fromDiagramView } from '../state/fromDiagramView'
import { useDiagramState } from '../state/state'
import { useXYFlow } from '.'
import type { XYFlowNode } from './types'

function isNodesEqual(a: XYFlowNode, b: XYFlowNode) {
  return a.id === b.id
    && eq(a.data, b.data)
    && eq(a.position, b.position)
    && eq(a.width, b.width)
    && eq(a.height, b.height)
}

/**
 * Syncs the diagram state with the XYFlow instance
 */
export const LikeC4ViewSync = memo(function DiagramStateSync() {
  useTilg()
  const state = useDiagramState(),
    initialized = state.viewportInitialized,
    nodes = state.viewNodes,
    edges = state.viewEdges

  const xyflow = useXYFlow()

  useUpdateEffect(() => {
    if (!initialized) {
      return
    }
    const updates = fromDiagramView({ nodes, edges }, state.nodesDraggable)

    xyflow.setNodes(prev =>
      updates.nodes.map(<N extends XYFlowNode>(update: N): N => {
        const existing = prev.find((n): n is N => n.id === update.id && n.type === update.type)
        if (existing && existing.parentNode == update.parentNode) {
          if (isNodesEqual(existing, update)) {
            return existing
          }
          return {
            ...existing,
            ...update
          }
        }
        return update
      })
    )

    xyflow.setEdges(prev =>
      updates.edges.map(edge => {
        const existing = prev.find(e => e.id === edge.id)
        if (existing) {
          if (eq(existing.data.edge, edge.data.edge)) {
            return existing
          }
          return {
            ...existing,
            ...edge
          }
        } else {
          return edge
        }
      })
    )
  }, [initialized ?? false, nodes, edges])

  return null
})
