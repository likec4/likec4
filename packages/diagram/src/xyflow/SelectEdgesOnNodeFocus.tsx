import { nonNullable } from '@likec4/core'
import type { EdgeChange, NodeChange } from '@xyflow/react'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import { useDiagramState, useDiagramStoreApi } from '../state/hooks'
import { MinZoom } from './const'
import { useXYStoreApi } from './hooks/useXYFlow'
import type { XYFlowEdge, XYFlowNode } from './types'

export function SelectEdgesOnNodeFocus() {
  const focusedNodeId = useDiagramState(s => s.focusedNodeId)
  const diagramStore = useDiagramStoreApi()
  const xyflowApi = useXYStoreApi()

  useUpdateEffect(() => {
    if (!focusedNodeId) {
      xyflowApi.getState().resetSelectedElements()
      return
    }

    const edgeChanges = [] as EdgeChange<XYFlowEdge>[]
    const nodeChanges = [] as NodeChange<XYFlowNode>[]
    const { edgeLookup, nodeLookup, transform, triggerNodeChanges, fitView, triggerEdgeChanges } = xyflowApi.getState()
    const fitViewNodes = new Set<XYFlowNode>()
    fitViewNodes.add(nonNullable(nodeLookup.get(focusedNodeId)))

    for (const [, edge] of edgeLookup) {
      if (edge.source === focusedNodeId || edge.target === focusedNodeId) {
        edgeChanges.push({
          id: edge.id,
          type: 'select',
          selected: true
        })
        const anotherNode = nonNullable(nodeLookup.get(edge.source === focusedNodeId ? edge.target : edge.source))
        fitViewNodes.add(anotherNode)
      } else if (edge.selected) {
        edgeChanges.push({
          id: edge.id,
          type: 'select',
          selected: false
        })
      }
    }
    for (const [, node] of nodeLookup) {
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
    triggerNodeChanges(nodeChanges)

    fitView({
      duration: 350,
      padding: 0.2,
      minZoom: MinZoom,
      maxZoom: Math.max(1, transform[2]),
      nodes: Array.from(fitViewNodes)
    })
  }, [diagramStore, xyflowApi, focusedNodeId])

  return null
}
