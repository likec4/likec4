import { type DiagramView } from '@likec4/core'
import { isEqual } from '@react-hookz/deep-equal'
import { useDeepCompareEffect } from '@react-hookz/web'
import { memo, useEffect } from 'react'
import useTilg from 'tilg'
import { fromDiagramView } from './fromDiagramView'
import { useLikeC4Editor } from './ViewEditorApi'

const DataSyncMemo = memo(function DataSync() {
  useTilg()
  const editor = useLikeC4Editor()
  const reactflow = editor.reactflow
  const initialized = reactflow?.viewportInitialized

  useDeepCompareEffect(() => {
    if (!initialized) {
      return
    }
    console.debug('DataSync: update reactflow')
    const update = fromDiagramView({
      nodes: editor.viewNodes,
      edges: editor.viewEdges
    }, editor.nodesDraggable)

    reactflow.setNodes(prev =>
      update.nodes.map(node => {
        const existing = prev.find(n => n.id === node.id)
        if (existing) {
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

    reactflow.setEdges(prev =>
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
  }, [initialized ?? false, editor.viewNodes, editor.viewEdges])

  return null
})

export default DataSyncMemo
