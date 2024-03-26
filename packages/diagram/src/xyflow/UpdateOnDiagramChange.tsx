import { deepEqual as eq } from 'fast-equals'
import { useUpdateEffect } from '../hooks/use-update-effect'
import { useXYFlow } from './hooks'
import type { XYFlowNode } from './types'

import type { DiagramView } from '@likec4/core'
import { isNil } from 'remeda'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'

/**
 * Syncs the diagram state with the XYFlow instance
 */
export function UpdateOnDiagramChange({
  nodesDraggable,
  view: {
    nodes,
    edges
  }
}: { view: DiagramView; nodesDraggable: boolean }) {
  const xyflow = useXYFlow()
  const initialized = xyflow.viewportInitialized

  useUpdateEffect(() => {
    if (!initialized) {
      return
    }
    const updates = diagramViewToXYFlowData({
      nodes,
      edges
    }, nodesDraggable)

    xyflow.setNodes(prev =>
      updates.nodes.map(<N extends XYFlowNode>(update: N): N => {
        const existing = prev.find(p => p.id === update.id)
        if (existing && existing.type == update.type) {
          const { data, parentNode, ...rest } = update
          if (!eq(existing.data, data)) {
            existing.data = data
          }
          if (!isNil(parentNode)) {
            existing.parentNode = parentNode
          } else {
            delete existing.parentNode
          }
          return Object.assign(existing, rest as N)
        }
        return update
      })
    )

    xyflow.setEdges(prev =>
      updates.edges.map(update => {
        const existing = prev.find(e => e.id === update.id)
        if (existing) {
          if (eq(existing.data.edge, update.data.edge)) {
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
  }, [initialized, nodesDraggable, nodes, edges])

  return null
}
