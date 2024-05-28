import { nonNullable } from '@likec4/core'
import type { EdgeChange, NodeChange } from '@xyflow/react'
import { useEffect } from 'react'
import { useDiagramStoreApi } from '../state/useDiagramStore'
import { MinZoom } from './const'
import { useXYStoreApi } from './hooks/useXYFlow'
import type { XYFlowEdge, XYFlowNode } from './types'

export function SelectEdgesOnNodeFocus() {
  const diagramStore = useDiagramStoreApi()
  const xyflowApi = useXYStoreApi()

  useEffect(() =>
    diagramStore.subscribe(
      s => s.focusedNodeId,
      (focusedNodeId) => {
        if (!focusedNodeId) {
          return
        }

        const edgeChanges = [] as EdgeChange<XYFlowEdge>[]
        const nodeChanges = [] as NodeChange<XYFlowNode>[]
        const { edges, nodes, nodeLookup, triggerNodeChanges, fitView, triggerEdgeChanges } = xyflowApi.getState()
        const fitViewNodes = new Set<XYFlowNode>()
        fitViewNodes.add(nonNullable(nodeLookup.get(focusedNodeId)))

        for (const edge of edges) {
          if (edge.source === focusedNodeId || edge.target === focusedNodeId) {
            edgeChanges.push({
              id: edge.id,
              type: 'select',
              selected: true
            })
            const anotherNode = nodeLookup.get(edge.source === focusedNodeId ? edge.target : edge.source)
            fitViewNodes.add(nonNullable(anotherNode))
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
        triggerNodeChanges(nodeChanges)

        fitView({
          includeHiddenNodes: true,
          duration: 300,
          padding: 0.1,
          minZoom: MinZoom,
          maxZoom: 1,
          nodes: Array.from(fitViewNodes)
        })
      }
    ), [diagramStore, xyflowApi])

  return null
}
