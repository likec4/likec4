import { cx } from '@likec4/styles/css'
import { ActionIcon, Group } from '@mantine/core'
import { useCallbackRef, useStateHistory } from '@mantine/hooks'
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react'
import { Panel, ReactFlowProvider, useReactFlow, useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { AnimatePresence, LayoutGroup, m } from 'motion/react'
import { memo, useEffect, useRef } from 'react'
import type { SnapshotFrom } from 'xstate'
import { BaseXYFlow } from '../../base/BaseXYFlow'
import type { RelationshipsBrowserTypes, RelationshipsBrowserTypes as Types } from './_types'
import type { RelationshipsBrowserActorRef } from './actor'
import { CompoundNode, ElementNode, EmptyNode, RelationshipEdge } from './custom'
import {
  RelationshipsBrowserActorContext,
  useRelationshipsBrowser,
  useRelationshipsBrowserState,
} from './hooks'
import { useRelationshipsView } from './layout'
import { SelectElement } from './SelectElement'

const nodeTypes = {
  element: ElementNode,
  compound: CompoundNode,
  empty: EmptyNode,
} satisfies {
  [key in RelationshipsBrowserTypes.Node['type']]: any
}

export const edgeTypes = {
  relationship: RelationshipEdge,
} satisfies {
  [key in RelationshipsBrowserTypes.Edge['type']]: any
}

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
      id={browser.rootElementId}
      nodes={nodes}
      edges={edges}
      className={cx(
        isActive ? 'initialized' : 'not-initialized',
        'relationships-browser',
      )}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView={false}
      onNodeClick={useCallbackRef((e, node) => {
        browser.send({ type: 'xyflow.nodeClick', node })
      })}
      onEdgeClick={useCallbackRef((e, edge) => {
        browser.send({ type: 'xyflow.edgeClick', edge })
      })}
      onPaneClick={useCallbackRef((e) => {
        browser.send({ type: 'xyflow.paneClick' })
      })}
      onDoubleClick={useCallbackRef(e => {
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
        if (!edge.data.hovered) {
          browser.send({ type: 'xyflow.edgeMouseEnter', edge })
        }
      })}
      onEdgeMouseLeave={useCallbackRef((_event, edge) => {
        if (edge.data.hovered) {
          browser.send({ type: 'xyflow.edgeMouseLeave', edge })
        }
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
  viewId: state.context.viewId,
  scope: state.context.scope,
  closeable: state.context.closeable,
})

const RelationshipsBrowserInner = memo(() => {
  const browser = useRelationshipsBrowser()
  const {
    subjectId,
    viewId,
    scope,
    closeable,
  } = useRelationshipsBrowserState(selector2)

  const store = useStoreApi<RelationshipsBrowserTypes.Node, RelationshipsBrowserTypes.Edge>()
  const instance = useReactFlow<RelationshipsBrowserTypes.Node, RelationshipsBrowserTypes.Edge>()

  useEffect(() => {
    if (instance.viewportInitialized) {
      browser.send({ type: 'xyflow.init', instance, store })
    }
  }, [store, instance.viewportInitialized, browser])

  const layouted = useRelationshipsView(subjectId, viewId, scope)
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
    browser.updateView(layouted)
  }, [layouted, browser])

  const hasStepBack = current > 0
  const hasStepForward = current + 1 < history.length

  return (
    <>
      <TopLeftPanel
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
  hasStepBack: boolean
  hasStepForward: boolean
  onStepBack: () => void
  onStepForward: () => void
}
const TopLeftPanel = ({
  hasStepBack,
  hasStepForward,
  onStepBack,
  onStepForward,
}: TopLeftPanelProps) => {
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
        </AnimatePresence>
        <SelectElement />
      </Group>
    </Panel>
  )
}
