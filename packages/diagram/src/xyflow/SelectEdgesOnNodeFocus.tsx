import type { EdgeChange, NodeChange } from '@xyflow/react'
import { useUpdateEffect } from '../hooks'
import { useDiagramState } from '../state/useDiagramStore'
import { useXYStoreApi } from './hooks/useXYFlow'
import type { XYFlowEdge, XYFlowNode } from './types'

export function SelectEdgesOnNodeFocus() {
  const focusedNodeId = useDiagramState(s => s.focusedNodeId)
  const xyflowApi = useXYStoreApi()

  useUpdateEffect(() => {
    const edgeChanges = [] as EdgeChange<XYFlowEdge>[]
    const nodeChanges = [] as NodeChange<XYFlowNode>[]
    const { edges, nodes, triggerNodeChanges, triggerEdgeChanges } = xyflowApi.getState()
    if (focusedNodeId) {
      for (const edge of edges) {
        if (edge.source === focusedNodeId || edge.target === focusedNodeId) {
          edgeChanges.push({
            id: edge.id,
            type: 'select',
            selected: true
          })
        } else if (edge.selected) {
          edgeChanges.push({
            id: edge.id,
            type: 'select',
            selected: false
          })
        }
      }
      for (const node of nodes) {
        if (node.selected && node.id !== focusedNodeId) {
          nodeChanges.push({
            id: node.id,
            type: 'select',
            selected: false
          })
        }
      }
      nodeChanges.push({
        id: focusedNodeId,
        type: 'select',
        selected: true
      })
      if (edgeChanges.length > 0) {
        triggerEdgeChanges(edgeChanges)
      }
      if (nodeChanges.length > 0) {
        triggerNodeChanges(nodeChanges)
      }
    } else {
      xyflowApi.getState().resetSelectedElements()
    }
  }, [focusedNodeId])

  return null
}
