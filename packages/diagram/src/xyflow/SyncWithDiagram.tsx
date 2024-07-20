import { deepEqual as eq } from 'fast-equals'

import { useEffect } from 'react'
import { omit } from 'remeda'
import { useDiagramState, useDiagramStoreApi } from '../state/useDiagramStore'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'

/**
 * Syncs the diagram state with the XYFlow instance
 */
export function SyncWithDiagram() {
  const xyflowSynced = useDiagramState(s => s.xyflowSynced)
  const diagramStoreApi = useDiagramStoreApi()

  useEffect(() => {
    if (xyflowSynced) {
      return
    }
    const {
      view,
      nodesDraggable,
      nodesSelectable,
      focusedNodeId,
      xystore
    } = diagramStoreApi.getState()
    const updates = diagramViewToXYFlowData(view, {
      draggable: nodesDraggable,
      selectable: nodesSelectable || focusedNodeId !== null
    })

    const {
      nodeLookup,
      edgeLookup,
      setNodes,
      setEdges
    } = xystore.getState()

    setNodes(updates.nodes.map(update => {
      const existing = nodeLookup.get(update.id)?.internals.userNode
      if (existing && existing.type === update.type && eq(existing.parentId, update.parentId)) {
        if (eq(existing.data.element, update.data.element)) {
          return existing
        }
        return {
          ...existing,
          ...update
        }
      }
      return update
    }))

    setEdges(updates.edges.map(update => {
      const existing = edgeLookup.get(update.id)
      if (existing) {
        if (
          eq(existing.data.controlPoints, update.data.controlPoints)
          && eq(existing.markerStart, update.markerStart)
          && eq(existing.markerEnd, update.markerEnd)
          && eq(existing.data.edge, update.data.edge)
        ) {
          return existing
        }
        return {
          ...omit(existing, ['data', 'markerStart', 'markerEnd']),
          ...update,
          data: {
            ...existing.data,
            ...update.data
          }
        }
      }
      return update
    }))

    diagramStoreApi.setState(
      {
        xyflowSynced: true
      },
      false,
      'xyflowSynced'
    )
  }, [xyflowSynced, diagramStoreApi])

  return null
}
