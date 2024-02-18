import { type DiagramView } from '@likec4/core'
import { isEqual } from '@react-hookz/deep-equal'
import { useDeepCompareEffect } from '@react-hookz/web'
import { memo, useEffect } from 'react'
import useTilg from 'tilg'
import { fromDiagramView } from './fromDiagramView'
import { useLikeC4ViewState } from './likec4view_.state'
import type { XYFlowNode } from './likec4view_.xyflow-types'

export const LikeC4ViewStateSync = memo(() => {
  useTilg()
  const state = useLikeC4ViewState()
  const xyflow = state.xyflow
  const initialized = xyflow?.viewportInitialized

  useEffect(() => {
    if (!initialized) {
      return
    }
    console.debug('DataSync: update reactflow')
    const update = fromDiagramView({
      nodes: state.viewNodes,
      edges: state.viewEdges
    }, state.nodesDraggable)

    xyflow.setNodes(prev =>
      update.nodes.map(<N extends XYFlowNode>(node: N): N => {
        const existing = prev.find((n): n is N => n.id === node.id && n.type === node.type)
        if (existing && existing.parentNode == node.parentNode) {
          if (isEqual(existing.data, node.data)) {
            return existing
          }
          return {
            ...existing,
            ...node
          }
        } else {
          return node
        }
      })
    )

    xyflow.setEdges(prev =>
      update.edges.map(edge => {
        const existing = prev.find(e => e.id === edge.id)
        if (existing) {
          if (isEqual(existing.data.edge, edge.data.edge)) {
            return existing
          }
          return {
            ...existing,
            ...edge
          }
        } else {
          return edge
        }
      })
    )
  }, [initialized ?? false, state.viewNodes, state.viewEdges])

  return null
})

export default LikeC4ViewStateSync
