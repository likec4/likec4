import { nonNullable } from '@likec4/core'
import type { EdgeChange, NodeChange } from '@xyflow/react'
import { getBoundsOfRects, getViewportForBounds, nodeToRect } from '@xyflow/system'
import { useEffect } from 'react'
import { useDiagramStoreApi } from '../state/hooks'
import { MinZoom } from './const'
import type { XYFlowEdge, XYFlowNode } from './types'

export function SelectEdgesOnNodeFocus() {
  const diagramStore = useDiagramStoreApi()

  useEffect(
    () =>
      diagramStore.subscribe(s => s.focusedNodeId, focusedNodeId => {
        if (!focusedNodeId) {
          return
        }

        const edgeChanges = [] as EdgeChange<XYFlowEdge>[]
        const nodeChanges = [] as NodeChange<XYFlowNode>[]
        const {
          edgeLookup,
          nodeLookup,
          width,
          height,
          panZoom,
          transform,
          triggerNodeChanges,
          triggerEdgeChanges
        } = diagramStore.getState().xystore.getState()
        let focusBounds = nodeToRect(nonNullable(nodeLookup.get(focusedNodeId)))

        for (const [, edge] of edgeLookup) {
          if (edge.source === focusedNodeId || edge.target === focusedNodeId) {
            const anotherNodeId = edge.source === focusedNodeId ? edge.target : edge.source
            const nd = nodeToRect(nonNullable(nodeLookup.get(anotherNodeId)))
            focusBounds = getBoundsOfRects(focusBounds, nd)
          }
          if (edge.selected) {
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

        const maxZoom = Math.max(1, transform[2])
        const viewport = getViewportForBounds(focusBounds, width, height, MinZoom, maxZoom, 0.2)
        panZoom?.setViewport(viewport, {
          duration: 350
        })
      }),
    [diagramStore]
  )

  return null
}
