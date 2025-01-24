import type { Fqn } from '@likec4/core'
import { ActionIcon, Box, Group } from '@mantine/core'
import { useCallbackRef, useStateHistory } from '@mantine/hooks'
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react'
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
import { SelectElement } from './SelectElement'
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
  subjectId: state.context.subject,
  initialized: state.context.initialized,
  scope: state.context.scope,
})

const RelationshipsBrowserInner = memo(() => {
  const browser = useRelationshipsBrowser()
  const {
    subjectId,
    initialized,
    scope,
  } = useRelationshipsBrowserState(selector)

  const view = useRelationshipsView(subjectId)
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

  const [historySubjectId, historyOps, { history, current }] = useStateHistory(subjectId)

  useEffect(() => {
    if (historySubjectId !== subjectId) {
      historyOps.set(subjectId)
    }
  }, [subjectId])

  useEffect(() => {
    if (historySubjectId !== subjectId) {
      browser.navigateTo(historySubjectId)
    }
  }, [historySubjectId])

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
          browser.send({ type: 'xyflow.init', instance })
        })}
        onNodeClick={useCallbackRef((e, node) => {
          e.stopPropagation()
          browser.send({ type: 'xyflow.nodeClick', node })
        })}
        onEdgeClick={useCallbackRef((e, edge) => {
          e.stopPropagation()
          browser.send({ type: 'xyflow.edgeClick', edge })
        })}
        onPaneClick={useCallbackRef((e) => {
          e.stopPropagation()
          browser.send({ type: 'xyflow.paneClick' })
        })}
        onViewportResize={() => {
          browser.send({ type: 'xyflow.resized' })
        }}
        nodesDraggable={false}
        fitView={false}
        pannable
        zoomable
      >
        <TopLeftPanel
          subjectId={subjectId}
          hasStepBack={hasStepBack}
          hasStepForward={hasStepForward}
          onStepBack={() => historyOps.back()}
          onStepForward={() => historyOps.forward()}
        />
        <Panel position="top-right">
          <ActionIcon
            variant="default"
            color="gray"
            // color="gray"
            // size={'lg'}
            // data-autofocus
            // autoFocus
            onClick={(e) => {
              e.stopPropagation()
              browser.close()
            }}>
            <IconX />
          </ActionIcon>
        </Panel>
      </BaseXYFlow>
    </LayoutGroup>
  )
})

type TopLeftPanelProps = {
  subjectId: Fqn
  hasStepBack: boolean
  hasStepForward: boolean
  onStepBack: () => void
  onStepForward: () => void
}
const TopLeftPanel = ({
  subjectId,
  hasStepBack,
  hasStepForward,
  onStepBack,
  onStepForward,
}: TopLeftPanelProps) => {
  const browser = useRelationshipsBrowser()
  return (
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
                  onStepBack()
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
                  onStepForward()
                }}>
                <IconChevronRight />
              </ActionIcon>
            </m.div>
          )}
          <Group gap={'xs'} wrap={'nowrap'} ml={'sm'}>
            <Box fz={'xs'} fw={'500'} style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>Relationships of</Box>
            <SelectElement
              subjectId={subjectId}
              onSelect={(id) => browser.navigateTo(id)}
              viewId={browser.getState().scope?.id ?? '' as any}
              scope={'global'}
            />
          </Group>
        </AnimatePresence>
      </Group>
    </Panel>
  )
}
