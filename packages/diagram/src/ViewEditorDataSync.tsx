import { type DiagramView } from '@likec4/core'
import { isEqual } from '@react-hookz/deep-equal'
import { useDeepCompareEffect } from '@react-hookz/web'
import useTilg from 'tilg'
import { fromDiagramView } from './fromDiagramView'
import { useLikeC4Editor } from './ViewEditorApi'

export const DataSync = ({ view }: {
  view: DiagramView
}) => {
  useTilg()
  const editor = useLikeC4Editor()
  const reactflow = editor.reactflow
  const initialized = reactflow?.viewportInitialized

  useDeepCompareEffect(() => {
    if (!initialized) {
      return
    }
    const update = fromDiagramView(view, editor.nodesDraggable)

    reactflow.setNodes(prev =>
      update.nodes.map(node => {
        const existing = prev.find(n => n.id === node.id)
        if (existing && isEqual(existing.data, node.data)) {
          return existing
        } else {
          return node
        }
      })
    )

    reactflow.setEdges(prev =>
      update.edges.map(edge => {
        const existing = prev.find(e => e.id === edge.id)
        if (existing && isEqual(existing.data.edge, edge.data.edge)) {
          return existing
        } else {
          return edge
        }
      })
    )
  }, [initialized ?? false, view.nodes, view.edges])

  return null
}
