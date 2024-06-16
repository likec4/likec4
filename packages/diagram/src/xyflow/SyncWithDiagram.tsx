import { deepEqual as eq } from 'fast-equals'
import { useXYStoreApi } from './hooks'

import { useEffect } from 'react'
import { useDiagramState, useDiagramStoreApi } from '../state'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'

/**
 * Syncs the diagram state with the XYFlow instance
 */
export function SyncWithDiagram() {
  const xyflowSynced = useDiagramState(s => s.xyflowSynced)
  const xyflowApi = useXYStoreApi()
  const diagramStoreApi = useDiagramStoreApi()

  useEffect(() => {
    if (xyflowSynced) {
      return
    }
    const {
      view,
      nodesDraggable,
      nodesSelectable,
      focusedNodeId
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
    } = xyflowApi.getState()

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
        return eq(existing.data.edge, update.data.edge) ? existing : {
          ...existing,
          ...update,
          data: {
            ...existing.data,
            ...update.data,
            // null-coalesce because we don't want accidentally
            // overwrite existing control points with null
            controlPoints: update.data.controlPoints ?? existing.data.controlPoints
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
  }, [xyflowSynced, xyflowApi, diagramStoreApi])

  return null
}
