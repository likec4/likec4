import { type LayoutedDynamicView } from '@likec4/core'
import { ReactFlowProvider } from '@xyflow/react'
import { useMemo, useRef } from 'react'
import { BaseXYFlow } from '../../base/BaseXYFlow'
import type { SequenceViewTypes as Types } from './_types'
import { ActorNode, StepEdge } from './custom'
import { toSequenceView } from './to-sequence-view'

const nodeTypes = {
  actor: ActorNode,
} satisfies {
  [key in Types.Node['type']]: any
}

export const edgeTypes = {
  step: StepEdge,
} satisfies {
  [key in Types.Edge['type']]: any
}

export type SequenceViewProps = {
  dynamicView: LayoutedDynamicView
}
export function SequenceView({ dynamicView }: SequenceViewProps) {
  const initialRef = useRef<{
    defaultNodes: Types.Node[]
    defaultEdges: Types.Edge[]
  }>(null)

  if (initialRef.current == null) {
    initialRef.current = {
      defaultNodes: [],
      defaultEdges: [],
    }
  }

  const { xynodes, xyedges } = useMemo(() => toSequenceView(dynamicView), [dynamicView])

  return (
    <ReactFlowProvider {...initialRef.current}>
      <BaseXYFlow<Types.Node, Types.Edge>
        nodes={xynodes}
        edges={xyedges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        fitView={false}
        pannable
        zoomable
        onNodesChange={() => null}
        onEdgesChange={() => null}
      >
      </BaseXYFlow>
    </ReactFlowProvider>
  )
}
