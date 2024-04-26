import { deepEqual as eq } from 'fast-equals'
import { useXYFlow } from './hooks'
import type { XYFlowEdge, XYFlowNode } from './types'

import { memo, useEffect } from 'react'
import { useDiagramStoreApi } from '../store'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'

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
export const UpdateOnDiagramChange = memo(() => {
  const {
    setEdges,
    setNodes,
    viewportInitialized
  } = useXYFlow()
  const diagramStoreApi = useDiagramStoreApi()

  console.log(`UpdateOnDiagramChange ${viewportInitialized}`)

  // const initialized = xyflow.viewportInitialized
  // const initialized = useDiagramStore(s => s.xyflowInitialized)

  useEffect(() => {
    console.log('UpdateOnDiagramChange effect')
    return diagramStoreApi.subscribe(
      // selector
      state => ({
        id: state.view.id,
        nodes: state.view.nodes,
        edges: state.view.edges,
        nodesDraggable: state.nodesDraggable
      }),
      // listener
      ({ nodes, edges, nodesDraggable }) => {
        if (!viewportInitialized) {
          console.log('UpdateOnDiagramChange listener ignored, not initialized')
          return
        }
        console.log('UpdateOnDiagramChange listener')
        const updates = diagramViewToXYFlowData({ nodes, edges }, nodesDraggable)

        setNodes(prev =>
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

        setEdges(prev =>
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
      },
      {
        equalityFn: (a, b) =>
          a.id === b.id && a.nodesDraggable === b.nodesDraggable && eq(a.nodes, b.nodes) && eq(a.edges, b.edges)
      }
    )
  }, [viewportInitialized, setEdges, setNodes])

  // useUpdateEffect(
  //   () => {
  //     if (!initialized) {
  //       return
  //     }
  //     const updates = diagramViewToXYFlowData(view, nodesDraggable)

  //     xyflow.setNodes(prev =>
  //       updates.nodes.map((update) => {
  // const existing = prev.find(isSameNode(update))
  // if (existing) {
  //   if (eq(existing.data.element, update.data.element)) {
  //     return existing
  //   }
  //   return {
  //     ...existing,
  //     ...update
  //   }
  // }
  // return update
  //       })
  //     )

  //     xyflow.setEdges(prev =>
  //       updates.edges.map(update => {
  //         const existing = prev.find(e => e.id === update.id)
  //         if (edgeHasNoChanges(existing, update)) {
  //           return existing
  //         }
  //         return update
  //       })
  //     )
  //   },
  //   [initialized, nodesDraggable, view.nodes, view.edges]
  // )

  return null
})
