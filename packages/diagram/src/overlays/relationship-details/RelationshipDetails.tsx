import type { DiagramEdge, DiagramView } from '@likec4/core'
import { ActionIcon, Group } from '@mantine/core'
import { useCallbackRef, useStateHistory } from '@mantine/hooks'
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react'
import { Panel, ReactFlowProvider } from '@xyflow/react'
import clsx from 'clsx'
import { AnimatePresence, LayoutGroup, m } from 'framer-motion'
import { memo, useEffect, useRef } from 'react'
import { BaseXYFlow } from '../../base/BaseXYFlow'
import type { RelationshipDetailsTypes as Types } from './_types'
import type { RelationshipDetailsActorRef, RelationshipDetailsSnapshot } from './actor'
import { edgeTypes } from './custom/edgeTypes'
import { nodeTypes } from './custom/nodeTypes'
import {
  RelationshipDetailsActorContext,
  useRelationshipDetails,
  useRelationshipDetailsState,
} from './hooks'
import { SelectEdge } from './SelectEdge'
import { useLayoutedDetails } from './useLayoutedDetails'

export type RelationshipDetailsProps = {
  actorRef: RelationshipDetailsActorRef
}
export function RelationshipDetails({ actorRef }: RelationshipDetailsProps) {
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
    <RelationshipDetailsActorContext.Provider value={actorRef}>
      <ReactFlowProvider {...initialRef.current}>
        <LayoutGroup id={actorRef.sessionId} inherit={false}>
          <AnimatePresence>
            <RelationshipDetailsInner />
          </AnimatePresence>
        </LayoutGroup>
      </ReactFlowProvider>
    </RelationshipDetailsActorContext.Provider>
  )
}

const selector = (state: RelationshipDetailsSnapshot) => ({
  edgeId: state.context.edgeId,
  view: state.context.view,
  initialized: state.context.initialized,
  nodes: state.context.xynodes,
  edges: state.context.xyedges,
})

const RelationshipDetailsInner = memo(() => {
  const browser = useRelationshipDetails()
  const {
    edgeId,
    view,
    initialized,
    nodes,
    edges,
  } = useRelationshipDetailsState(selector)

  const {
    edge,
    xynodes,
    xyedges,
    bounds,
  } = useLayoutedDetails(edgeId, view)

  useEffect(() => {
    browser.send({ type: 'update.xydata', xynodes, xyedges })
  }, [xynodes, xyedges])

  const [historyEdgeId, historyOps, { history, current }] = useStateHistory(edgeId)

  useEffect(() => {
    if (historyEdgeId !== edgeId) {
      historyOps.set(edgeId)
    }
  }, [edgeId])

  useEffect(() => {
    if (historyEdgeId !== edgeId) {
      browser.navigateTo(historyEdgeId)
    }
  }, [historyEdgeId])

  const hasStepBack = current > 0
  const hasStepForward = current + 1 < history.length

  return (
    <BaseXYFlow<Types.Node, Types.Edge>
      id={`relationships-details-${browser.actor.sessionId}`}
      nodes={nodes}
      edges={edges}
      className={clsx(initialized ? 'initialized' : 'not-initialized')}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={useCallbackRef((changes) => {
        browser.send({ type: 'xyflow.applyNodeChanges', changes })
      })}
      onEdgesChange={useCallbackRef((changes) => {
        browser.send({ type: 'xyflow.applyEdgeChanges', changes })
      })}
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
      onViewportResize={useCallbackRef(() => {
        browser.send({ type: 'xyflow.resized' })
      })}
      onEdgeMouseEnter={useCallbackRef((_event, edge) => {
        browser.send({ type: 'xyflow.edgeMouseEnter', edge })
      })}
      onEdgeMouseLeave={useCallbackRef((_event, edge) => {
        browser.send({ type: 'xyflow.edgeMouseLeave', edge })
      })}
      onSelectionChange={useCallbackRef((params) => {
        browser.send({ type: 'xyflow.selectionChange', ...params })
      })}
      nodesDraggable={false}
      fitView={false}
      pannable
      zoomable
    >
      <TopLeftPanel
        edge={edge}
        view={view}
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
  )
})

type TopLeftPanelProps = {
  edge: DiagramEdge
  view: DiagramView
  hasStepBack: boolean
  hasStepForward: boolean
  onStepBack: () => void
  onStepForward: () => void
}
const TopLeftPanel = ({
  edge,
  view,
  hasStepBack,
  hasStepForward,
  onStepBack,
  onStepForward,
}: TopLeftPanelProps) => {
  const browser = useRelationshipDetails()
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
            {/* <Box fz={'xs'} fw={'500'} style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>Relationships of</Box> */}
            <SelectEdge edge={edge} view={view} />
          </Group>
        </AnimatePresence>
      </Group>
    </Panel>
  )
}
