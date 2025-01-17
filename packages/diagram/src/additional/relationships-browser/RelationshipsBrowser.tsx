import { useCallbackRef } from '@mantine/hooks'
import { ReactFlowProvider, useEdgesState, useNodesState } from '@xyflow/react'
import clsx from 'clsx'
import { memo, useRef } from 'react'
import type { SnapshotFrom } from 'xstate'
import { BaseXYFlow } from '../../base/BaseXYFlow'
import { updateEdges } from '../../base/updateEdges'
import { updateNodes } from '../../base/updateNodes'
import { DiagramFeatures } from '../../context'
import { useUpdateEffect } from '../../hooks'
import { useRelationshipsView } from './-useRelationshipsView'
import type { RelationshipsBrowserTypes as Types } from './_types'
import { edgeTypes, nodeTypes } from './custom'
import { RelationshipsBrowserActorContext, useRelationshipsBrowserActor, useRelationshipsBrowserState } from './hooks'
import type { RelationshipsBrowserActorRef } from './state'
import { useViewToNodesEdges } from './useViewToNodesEdges'

export type RelationshipsBrowserProps = {
  actorRef: RelationshipsBrowserActorRef
}
export function RelationshipsBrowser({ actorRef }: RelationshipsBrowserProps) {
  // const actorRef = useDiagramActorState(s => s.children.relationshipsBrowser)
  // if (actorRef == null) {
  //   return null
  // }
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

  return (
    <RelationshipsBrowserActorContext.Provider value={actorRef}>
      <ReactFlowProvider {...initialRef.current}>
        <RelationshipsBrowserInner />
      </ReactFlowProvider>
    </RelationshipsBrowserActorContext.Provider>
  )
}

const selector = (state: SnapshotFrom<RelationshipsBrowserActorRef>) => ({
  subject: state.context.subject,
  initialized: state.context.initialized,
  scope: state.context.scope,
})

const RelationshipsBrowserInner = memo(() => {
  const { send } = useRelationshipsBrowserActor()
  const {
    subject,
    initialized,
    scope,
  } = useRelationshipsBrowserState(selector)

  const view = useRelationshipsView(subject)
  const {
    xynodes,
    xyedges,
  } = useViewToNodesEdges(view)
  const [nodes, setNodes, onNodesChange] = useNodesState(xynodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(xyedges)

  useUpdateEffect(() => {
    setNodes(updateNodes(xynodes))
    setEdges(updateEdges(xyedges))
  }, [xynodes, xyedges])

  // useEffect(() => {
  //   if (readonly !== true && where != null) {
  //     console.warn('Ignore filter, supported in readonly mode only\n', { where })
  //   }
  //   if (hasLikec4model) {
  //     return
  //   }
  //   if (enableRelationshipDetails) {
  //     console.warn('Invalid showRelationshipDetails=true, requires LikeC4ModelProvider')
  //   }
  //   if (enableElementDetails) {
  //     console.warn('Invalid enableElementDetails=true, requires LikeC4ModelProvider')
  //   }
  //   if (enableRelationshipBrowser) {
  //     console.warn('Invalid enableRelationshipBrowser=true, requires LikeC4ModelProvider')
  //   }
  // })

  return (
    <DiagramFeatures.Overlays>
      <BaseXYFlow<Types.Node, Types.Edge>
        id="relationships-browser"
        nodes={nodes}
        edges={edges}
        className={clsx(initialized ? 'initialized' : 'not-initialized')}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        fitViewPadding={0.05}
        onInit={useCallbackRef((instance) => {
          send({ type: 'xyflow.init', instance })
        })}
        onNodeClick={useCallbackRef((e, node) => {
          e.stopPropagation()
          send({ type: 'xyflow.nodeClick', node })
        })}
        onEdgeClick={useCallbackRef((e, edge) => {
          e.stopPropagation()
          send({ type: 'xyflow.edgeClick', edge })
        })}
        onPaneClick={useCallbackRef((e) => {
          e.stopPropagation()
          send({ type: 'xyflow.paneClick' })
        })}
        nodesDraggable={false}
        fitView={false}
        pannable
        zoomable
      />
    </DiagramFeatures.Overlays>
  )
})
