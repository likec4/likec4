import type { Fqn } from '@likec4/core'
import { ActionIcon, Box, Group } from '@mantine/core'
import { useCallbackRef, useStateHistory } from '@mantine/hooks'
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react'
import { Panel, ReactFlowProvider, useReactFlow, useStoreApi } from '@xyflow/react'
import clsx from 'clsx'
import { shallowEqual } from 'fast-equals'
import { AnimatePresence, LayoutGroup, m } from 'framer-motion'
import { memo, useEffect, useRef } from 'react'
import type { SnapshotFrom } from 'xstate'
import { BaseXYFlow } from '../../base/BaseXYFlow'
import { useRelationshipsView } from './-useRelationshipsView'
import type { RelationshipsBrowserTypes, RelationshipsBrowserTypes as Types } from './_types'
import type { RelationshipsBrowserActorRef } from './actor'
import { ViewPadding } from './const'
import { edgeTypes } from './custom/edgeTypes'
import { nodeTypes } from './custom/nodeTypes'
import {
  RelationshipsBrowserActorContext,
  useRelationshipsBrowser,
  useRelationshipsBrowserState,
} from './hooks'
import { SelectElement } from './SelectElement'

export type RelationshipsBrowserProps = {
  actorRef: RelationshipsBrowserActorRef
}
export function RelationshipsBrowser({ actorRef }: RelationshipsBrowserProps) {
  // const actorRef = useDiagramActorState(s => s.children.relationshipsBrowser)
  // if (actorRef == null) {
  //   return null
  // }
  const initialRef = useRef<{
    initialNodes: Types.Node[]
    initialEdges: Types.Edge[]
  }>(null)

  if (initialRef.current == null) {
    initialRef.current = {
      initialNodes: [],
      initialEdges: [],
    }
  }

  return (
    <RelationshipsBrowserActorContext.Provider value={actorRef}>
      <ReactFlowProvider {...initialRef.current}>
        <LayoutGroup id={actorRef.sessionId} inherit={false}>
          <AnimatePresence>
            <RelationshipsBrowserXYFlow />
          </AnimatePresence>
        </LayoutGroup>
      </ReactFlowProvider>
    </RelationshipsBrowserActorContext.Provider>
  )
}

const selector = (state: SnapshotFrom<RelationshipsBrowserActorRef>) => ({
  isActive: state.hasTag('active'),
  nodes: state.context.xynodes,
  edges: state.context.xyedges,
})
const selectorEq = (a: ReturnType<typeof selector>, b: ReturnType<typeof selector>) =>
  a.isActive === b.isActive &&
  shallowEqual(a.nodes, b.nodes) &&
  shallowEqual(a.edges, b.edges)

const RelationshipsBrowserXYFlow = memo(() => {
  const browser = useRelationshipsBrowser()
  const {
    isActive,
    nodes,
    edges,
  } = useRelationshipsBrowserState(
    selector,
    selectorEq,
  )

  return (
    <BaseXYFlow<Types.Node, Types.Edge>
      id={`relationships-browser-${browser.actor.sessionId}`}
      nodes={nodes}
      edges={edges}
      className={clsx(isActive ? 'initialized' : 'not-initialized')}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView={false}
      fitViewPadding={ViewPadding}
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
      onDoubleClick={useCallbackRef(e => {
        e.stopPropagation()
        browser.send({ type: 'xyflow.paneDblClick' })
      })}
      onViewportResize={useCallbackRef(() => {
        browser.send({ type: 'xyflow.resized' })
      })}
      onNodesChange={useCallbackRef((changes) => {
        browser.send({ type: 'xyflow.applyNodeChanges', changes })
      })}
      onEdgesChange={useCallbackRef((changes) => {
        browser.send({ type: 'xyflow.applyEdgeChanges', changes })
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
      pannable
      zoomable
    >
      <RelationshipsBrowserInner />
    </BaseXYFlow>
  )
})

const selector2 = (state: SnapshotFrom<RelationshipsBrowserActorRef>) => ({
  subjectId: state.context.subject,
  closeable: state.context.closeable,
  enableNavigationMenu: state.context.enableNavigationMenu,
})

const RelationshipsBrowserInner = memo(() => {
  const browser = useRelationshipsBrowser()
  const {
    subjectId,
    closeable,
    enableNavigationMenu,
  } = useRelationshipsBrowserState(selector2)

  const store = useStoreApi<RelationshipsBrowserTypes.Node, RelationshipsBrowserTypes.Edge>()
  const instance = useReactFlow<RelationshipsBrowserTypes.Node, RelationshipsBrowserTypes.Edge>()

  useEffect(() => {
    browser.send({ type: 'xyflow.init', instance, store })
  }, [store, instance, browser])

  const layouted = useRelationshipsView(subjectId)
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
  }, [historySubjectId, browser])

  useEffect(() => {
    browser.send({ type: 'update.view', layouted })
  }, [layouted, browser])

  const hasStepBack = current > 0
  const hasStepForward = current + 1 < history.length

  return (
    <>
      <TopLeftPanel
        enableNavigationMenu={enableNavigationMenu}
        subjectId={subjectId}
        hasStepBack={hasStepBack}
        hasStepForward={hasStepForward}
        onStepBack={() => historyOps.back()}
        onStepForward={() => historyOps.forward()}
      />
      {closeable && (
        <Panel position="top-right">
          <ActionIcon
            variant="default"
            color="gray"
            onClick={(e) => {
              e.stopPropagation()
              browser.close()
            }}>
            <IconX />
          </ActionIcon>
        </Panel>
      )}
    </>
  )
})

type TopLeftPanelProps = {
  enableNavigationMenu: boolean
  subjectId: Fqn
  hasStepBack: boolean
  hasStepForward: boolean
  onStepBack: () => void
  onStepForward: () => void
}
const TopLeftPanel = ({
  enableNavigationMenu,
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
          {enableNavigationMenu && (
            <Group gap={'xs'} wrap={'nowrap'} ml={'sm'}>
              <Box fz={'xs'} fw={'500'} style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>Relationships of</Box>
              <SelectElement
                subjectId={subjectId}
                onSelect={(id) => browser.navigateTo(id)}
                viewId={browser.getState().scope?.id ?? '' as any}
                scope={'global'}
              />
            </Group>
          )}
        </AnimatePresence>
      </Group>
    </Panel>
  )
}
