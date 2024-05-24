import type { Edge } from '@xyflow/react'
import { useUpdateEffect } from '../hooks'
import { useDiagramState } from '../state/useDiagramStore'
import { useXYFlow, useXYStoreApi } from './hooks/useXYFlow'

export function SelectEdgesOnNodeFocus() {
  const focusedNodeId = useDiagramState(s => s.focusedNodeId)
  const xyflow = useXYFlow()
  const xyflowApi = useXYStoreApi()

  useUpdateEffect(() => {
    const selectEdges = [] as string[]
    const { edges, addSelectedEdges } = xyflowApi.getState()
    for (const edge of edges) {
      if (edge.source === focusedNodeId || edge.target === focusedNodeId) {
        selectEdges.push(edge.id)
      }
    }
    addSelectedEdges(selectEdges)
    if (focusedNodeId) {
      xyflow.updateNode(focusedNodeId, { selected: true })
    }
  }, [focusedNodeId])

  return null
}
