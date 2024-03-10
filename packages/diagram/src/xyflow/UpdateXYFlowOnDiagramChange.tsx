import { deepEqual as eq } from 'fast-equals'
import { useUpdateEffect } from '../hooks/use-update-effect'
import { useXYFlow } from './hooks'
import type { XYFlowNode } from './types'

import type { DiagramView } from '@likec4/core'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'

/**
 * Syncs the diagram state with the XYFlow instance
 */
export function UpdateXYFlowOnDiagramChange({
  nodesDraggable,
  view: {
    nodes,
    edges
  }
}: { view: DiagramView; nodesDraggable: boolean }) {
  const xyflow = useXYFlow()
  const initialized = xyflow.viewportInitialized

  useUpdateEffect(() => {
    const updates = diagramViewToXYFlowData({
      nodes,
      edges
    }, nodesDraggable)

    xyflow.setNodes(prev =>
      updates.nodes.map(<N extends XYFlowNode>(update: N): N => {
        const existing = prev.find(p => p.id === update.id)
        if (existing && existing.parentNode == update.parentNode) {
          const { position, data, parentNode, ...rest } = update
          existing.position.x = position.x
          existing.position.y = position.y
          if (!eq(existing.data, data)) {
            existing.data = data
          }
          return Object.assign(existing, rest as N)
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
        }
        return edge
      })
    )
  }, [initialized, nodes, edges])

  return null
}
