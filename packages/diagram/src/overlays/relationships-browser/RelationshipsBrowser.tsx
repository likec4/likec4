import { ActionIcon, Group } from '@mantine/core'
import { useCallbackRef, useStateHistory } from '@mantine/hooks'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { Panel, ReactFlowProvider, useEdgesState, useNodesState } from '@xyflow/react'
import clsx from 'clsx'
import { AnimatePresence, LayoutGroup, m } from 'framer-motion'
import { memo, useEffect, useRef } from 'react'
import type { SnapshotFrom } from 'xstate'
import { BaseXYFlow } from '../../base/BaseXYFlow'
import { updateEdges } from '../../base/updateEdges'
import { updateNodes } from '../../base/updateNodes'
import { useUpdateEffect } from '../../hooks'
import { useRelationshipsView } from './-useRelationshipsView'
import type { RelationshipsBrowserTypes as Types } from './_types'
import type { RelationshipsBrowserActorRef } from './actor'
import { edgeTypes, nodeTypes } from './custom'
import {
  RelationshipsBrowserActorContext,
  useRelationshipsBrowser,
  useRelationshipsBrowserState,
} from './hooks'
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
  const { send, navigateTo } = useRelationshipsBrowser()
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

  const [historySubjectId, historyOps, { history, current }] = useStateHistory(subject)

  useEffect(() => {
    if (historySubjectId !== subject) {
      historyOps.set(subject)
    }
  }, [subject])

  useEffect(() => {
    if (historySubjectId !== subject) {
      navigateTo(historySubjectId)
    }
  }, [historySubjectId])

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

  const hasStepBack = current > 0
  const hasStepForward = current + 1 < history.length

  return (
    <LayoutGroup>
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
        onViewportResize={() => {
          send({ type: 'xyflow.resized' })
        }}
        nodesDraggable={false}
        fitView={false}
        pannable
        zoomable
      >
        <Panel position="top-left">
          <Group gap={4} wrap={'nowrap'}>
            <AnimatePresence mode="popLayout">
              {hasStepBack && (
                <m.div
                  layout
                  initial={{ opacity: 0.05, transform: 'translateX(-5px)' }}
                  animate={{ opacity: 1, transform: 'translateX(0)' }}
                  exit={{
                    opacity: 0.05,
                    transform: 'translateX(-10px)',
                  }}
                  key={'back'}>
                  <ActionIcon
                    variant="default"
                    color="gray"
                    onClick={e => {
                      e.stopPropagation()
                      historyOps.back()
                    }}>
                    <IconChevronLeft />
                  </ActionIcon>
                </m.div>
              )}
              {hasStepForward && (
                <m.div
                  layout
                  initial={{ opacity: 0.05, transform: 'translateX(5px)' }}
                  animate={{ opacity: 1, transform: 'translateX(0)' }}
                  exit={{
                    opacity: 0,
                    transform: 'translateX(5px)',
                  }}
                  key={'forward'}>
                  <ActionIcon
                    variant="default"
                    color="gray"
                    onClick={e => {
                      e.stopPropagation()
                      historyOps.forward()
                    }}>
                    <IconChevronRight />
                  </ActionIcon>
                </m.div>
              )}
            </AnimatePresence>
          </Group>
        </Panel>
      </BaseXYFlow>
    </LayoutGroup>
  )
})
