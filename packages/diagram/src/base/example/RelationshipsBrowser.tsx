import type { DiagramView } from '@likec4/core'
import { useEdgesState, useNodesState } from '@xyflow/react'
import { useRef } from 'react'
import { BaseXYFlow } from '../../base/BaseXYFlow'
import { updateEdges } from '../../base/updateEdges'
import { updateNodes } from '../../base/updateNodes'
import { DiagramFeatures } from '../../context'
import { useUpdateEffect } from '../../hooks'
import type { ExampleTypes as Types } from './_types'
import { edgeTypes, nodeTypes } from './custom'
import { useViewToNodesEdges } from './useViewToNodesEdges'

type ExampleProps = {
  view: DiagramView
}

export function Example({ view }: ExampleProps) {
  const initialRef = useRef<{
    defaultNodes: Types.Node[]
    defaultEdges: Types.Edge[]
    initialWidth: number
    initialHeight: number
  }>(null)

  const {
    xynodes,
    xyedges,
  } = useViewToNodesEdges(view)

  if (initialRef.current == null) {
    initialRef.current = {
      defaultNodes: xynodes,
      defaultEdges: xyedges,
      initialWidth: view.bounds.width,
      initialHeight: view.bounds.height,
    }
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(xynodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(xyedges)

  useUpdateEffect(() => {
    setNodes(updateNodes(xynodes))
    setEdges(updateEdges(xyedges))
  }, [xynodes, xyedges])

  return (
    <DiagramFeatures.Overlays>
      <BaseXYFlow<Types.Node, Types.Edge>
        id="example"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        pannable
        zoomable
      />
    </DiagramFeatures.Overlays>
  )
}
