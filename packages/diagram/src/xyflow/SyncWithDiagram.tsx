import { deepEqual as eq, shallowEqual } from 'fast-equals'
import { useXYFlow, useXYStoreApi } from './hooks'
import type { XYFlowNode } from './types'

import { memo, useEffect, useRef } from 'react'
import { useDiagramStoreApi } from '../state'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'
import { toDomPrecision } from './utils'

const isSameNode = (a: XYFlowNode) => (b: XYFlowNode) =>
  a.id === b.id && a.type === b.type && Object.is(a.parentId, b.parentId)

/**
 * Syncs the diagram state with the XYFlow instance
 */
export const SyncWithDiagram = memo(() => {
  const _xyflow = useXYFlow()
  const xyflowRef = useRef(_xyflow)
  xyflowRef.current = _xyflow

  const xyflowApi = useXYStoreApi()
  const diagramStoreApi = useDiagramStoreApi()

  useEffect(() => {
    return diagramStoreApi.subscribe(
      // selector
      state => ({
        viewId: state.view.id,
        nodes: state.view.nodes,
        edges: state.view.edges,
        draggable: state.nodesDraggable,
        selectable: state.nodesSelectable
      }),
      // listener
      ({ viewId, nodes, edges, ...opts }) => {
        const { lastOnNavigate } = diagramStoreApi.getState()
        const updates = diagramViewToXYFlowData({ nodes, edges }, opts)

        xyflowRef.current.setNodes(prev =>
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

        xyflowRef.current.setEdges(prev =>
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
            const centerFrom = lastOnNavigate.elementCenterScreenPosition
            const nextZoom = Math.min(elFrom.width / elTo.width, elFrom.height / elTo.height)

            requestAnimationFrame(() => {
              // requestAnimationFrame(() => {
              const v = xyflowRef.current.getViewport()
              if (nextZoom < v.zoom) {
                xyflowRef.current.setViewport({
                  x: v.x,
                  y: v.y,
                  zoom: nextZoom
                })
              }
              const centerTo = xyflowRef.current.flowToScreenPosition({
                  x: elTo.position[0] + elTo.width / 2,
                  y: elTo.position[1] + elTo.height / 2
                }),
                diff = {
                  x: toDomPrecision(centerFrom.x - centerTo.x),
                  y: toDomPrecision(centerFrom.y - centerTo.y)
                }
              xyflowApi.getState().panBy(diff)
              // })
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
  }, [xyflowApi, diagramStoreApi])

  return null
})
