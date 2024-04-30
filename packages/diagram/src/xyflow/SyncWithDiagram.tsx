import { deepEqual as eq, shallowEqual } from 'fast-equals'
import { useXYFlow, useXYStoreApi } from './hooks'
import type { XYFlowEdge, XYFlowNode } from './types'

import { memo, useEffect } from 'react'
import { useDiagramStoreApi } from '../state'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'
import { toDomPrecision } from './utils'

const isSameNode = (a: XYFlowNode) => (b: XYFlowNode) =>
  a.id === b.id && a.type === b.type && Object.is(a.parentId, b.parentId)

function hasNoChanges(existing: XYFlowNode, update: XYFlowNode) {
  return existing.id === update.id
    && existing.type === update.type
    && existing.parentId == update.parentId
    && eq(existing.data.element, update.data.element)
}

function edgeHasNoChanges(existing: XYFlowEdge, update: XYFlowEdge) {
  return existing.id === update.id
    && existing.type === update.type
    && existing.source === update.source
    && existing.target === update.target
    && eq(existing.data, update.data)
}

/**
 * Syncs the diagram state with the XYFlow instance
 */
export const SyncWithDiagram = memo(() => {
  const xyflow = useXYFlow()
  const xyflowApi = useXYStoreApi()
  const diagramStoreApi = useDiagramStoreApi()

  useEffect(() => {
    return diagramStoreApi.subscribe(
      // selector
      state => ({
        viewId: state.view.id,
        nodes: state.view.nodes,
        edges: state.view.edges,
        nodesDraggable: state.nodesDraggable
      }),
      // listener
      ({ viewId, nodes, edges, nodesDraggable }) => {
        const { lastOnNavigate } = diagramStoreApi.getState()
        const updates = diagramViewToXYFlowData({ nodes, edges }, nodesDraggable)

        xyflow.setNodes(prev =>
          updates.nodes.map(update => {
            const existing = prev.find(isSameNode(update))
            if (existing) {
              if (eq(existing.data.element, update.data.element)) {
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
          updates.edges.map(update => {
            const existing = prev.find(e => e.id === update.id)
            if (existing) {
              return eq(existing.data, update.data) ? existing : {
                ...existing,
                ...update
              }
            }
            return update
          })
        )

        if (lastOnNavigate?.toView === viewId && !lastOnNavigate.positionCorrected) {
          const elFrom = lastOnNavigate.element
          const elTo = nodes.find(n => n.id === elFrom.id)
          if (elTo) {
            const centerFrom = xyflow.flowToScreenPosition({
                x: elFrom.position[0] + elFrom.width / 2,
                y: elFrom.position[1] + elFrom.height / 2
              }),
              centerTo = xyflow.flowToScreenPosition({
                x: elTo.position[0] + elTo.width / 2,
                y: elTo.position[1] + elTo.height / 2
              }),
              diff = {
                x: toDomPrecision(centerFrom.x - centerTo.x),
                y: toDomPrecision(centerFrom.y - centerTo.y)
              }
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                xyflowApi.getState().panBy(diff)
              })
            })
          }
          diagramStoreApi.setState(
            {
              lastOnNavigate: {
                ...lastOnNavigate,
                positionCorrected: true
              }
            },
            false,
            'positionCorrected'
          )
        }
      },
      {
        equalityFn: shallowEqual
      }
    )
  }, [xyflow, xyflowApi, diagramStoreApi])

  return null
})
