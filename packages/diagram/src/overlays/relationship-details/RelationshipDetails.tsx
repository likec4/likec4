import { type DiagramEdge, type DiagramView, invariant, isAncestor, nonNullable } from '@likec4/core'
import { cx } from '@likec4/styles/css'
import { ActionIcon, Group } from '@mantine/core'
import { useCallbackRef, useStateHistory } from '@mantine/hooks'
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react'
import { useSelector } from '@xstate/react'
import { Panel, ReactFlowProvider, useReactFlow, useStoreApi } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { AnimatePresence, LayoutGroup, m } from 'motion/react'
import { memo, useEffect, useMemo, useRef } from 'react'
import { find, isTruthy } from 'remeda'
import { BaseXYFlow } from '../../base/BaseXYFlow'
import { useLikeC4Model } from '../../likec4model/useLikeC4Model'
import type { RelationshipDetailsTypes, RelationshipDetailsTypes as Types } from './_types'
import type { RelationshipDetailsActorRef, RelationshipDetailsSnapshot } from './actor'
import {
  type RelationshipDetailsViewData,
  computeEdgeDetailsViewData,
  computeRelationshipDetailsViewData,
} from './compute'
import { CompoundNode, ElementNode, RelationshipEdge } from './custom'
import {
  RelationshipDetailsActorContext,
  useRelationshipDetails,
  useRelationshipDetailsActor,
  useRelationshipDetailsState,
} from './hooks'
import { layoutRelationshipDetails } from './layout'
import { SelectEdge } from './SelectEdge'

const nodeTypes = {
  element: ElementNode,
  compound: CompoundNode,
} satisfies {
  [key in RelationshipDetailsTypes.Node['type']]: any
}

export const edgeTypes = {
  relationship: RelationshipEdge,
} satisfies {
  [key in RelationshipDetailsTypes.Edge['type']]: any
}

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
            <RelationshipDetailsInner key="xyflow" />
            <SyncRelationshipDetailsXYFlow key="sync" />
          </AnimatePresence>
        </LayoutGroup>
      </ReactFlowProvider>
    </RelationshipDetailsActorContext.Provider>
  )
}

const selectSubject = (state: RelationshipDetailsSnapshot) => ({
  ...state.context.subject,
  viewId: state.context.viewId,
})

const SyncRelationshipDetailsXYFlow = memo(() => {
  const actor = useRelationshipDetailsActor()
  const subject = useSelector(actor, selectSubject, deepEqual)
  const likec4model = useLikeC4Model()
  const view = likec4model.findView(subject.viewId) ?? null
  const data = useMemo(() => {
    let data: RelationshipDetailsViewData
    if ('edgeId' in subject && isTruthy(subject.edgeId)) {
      invariant(view, `view ${subject.viewId} not found`)
      const edge = nonNullable(view.findEdge(subject.edgeId), `edge ${subject.edgeId} not found in ${subject.viewId}`)
      data = computeEdgeDetailsViewData([edge.id], view)
    } else if (!!subject.source && !!subject.target) {
      data = computeRelationshipDetailsViewData({
        source: likec4model.element(subject.source),
        target: likec4model.element(subject.target),
      })
    } else {
      return null
    }
    return layoutRelationshipDetails(data, view)
  }, [
    subject,
    view,
    likec4model,
  ])

  const store = useStoreApi<RelationshipDetailsTypes.Node, RelationshipDetailsTypes.Edge>()
  const instance = useReactFlow<RelationshipDetailsTypes.Node, RelationshipDetailsTypes.Edge>()

  useEffect(() => {
    if (instance.viewportInitialized) {
      actor.send({ type: 'xyflow.init', instance, store })
    }
  }, [store, instance.viewportInitialized, actor])

  useEffect(() => {
    if (data !== null) {
      actor.send({ type: 'update.layoutData', data })
    }
  }, [data, actor])

  return null
})

const selector = ({ context }: RelationshipDetailsSnapshot) => ({
  // subject: context.subject,
  // view: state.context.view,
  initialized: context.initialized.xydata && context.initialized.xyflow,
  nodes: context.xynodes,
  edges: context.xyedges,
})

const RelationshipDetailsInner = memo(() => {
  const browser = useRelationshipDetails()
  const {
    initialized,
    nodes,
    edges,
  } = useRelationshipDetailsState(selector, deepEqual)

  return (
    <BaseXYFlow<Types.Node, Types.Edge>
      id={browser.rootElementId}
      nodes={nodes}
      edges={edges}
      className={cx(
        initialized ? 'initialized' : 'not-initialized',
        'likec4-relationship-details',
      )}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={useCallbackRef((changes) => {
        browser.send({ type: 'xyflow.applyNodeChanges', changes })
      })}
      onEdgesChange={useCallbackRef((changes) => {
        browser.send({ type: 'xyflow.applyEdgeChanges', changes })
      })}
      fitViewPadding={0.05}
      onNodeClick={useCallbackRef((e, node) => {
        e.stopPropagation()
        browser.send({ type: 'xyflow.nodeClick', node })
      })}
      onEdgeClick={useCallbackRef((e, edge) => {
        e.stopPropagation()
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
      fitView={false}
      pannable
      zoomable
    >
      <TopLeftPanel />
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

// type TopLeftPanelProps = {
//   edge: DiagramEdge
//   view: DiagramView
//   hasStepBack: boolean
//   hasStepForward: boolean
//   onStepBack: () => void
//   onStepForward: () => void
// }
const topLeftPanelselector = ({ context }: RelationshipDetailsSnapshot) => ({
  subject: context.subject,
  viewId: context.viewId,
})
const TopLeftPanel = memo(() => {
  const { subject, viewId } = useRelationshipDetailsState(topLeftPanelselector, deepEqual)
  const likec4model = useLikeC4Model()
  const view = likec4model.findView(viewId)

  if (!view || !view.isDiagram()) {
    return null
  }

  const edges = [...view.edges()]

  let edge = ('edgeId' in subject && isTruthy(subject.edgeId))
    ? edges.find(e => e.id === subject.edgeId)
    : (
      find(edges, (e) => e.source.element?.id === subject.source && e.target.element?.id === subject.target)
      || find(edges, (e) => {
        return (e.source.element?.id === subject.source ||
          isAncestor(e.source.element?.id ?? '__', subject.source ?? '__')) &&
          (e.target.element?.id === subject.target || isAncestor(e.target.element?.id ?? '__', subject.target ?? '__'))
      })
    )
  if (!edge) {
    return null
  }
  return <TopLeftPanelInner edge={edge.$edge} view={view.$view} />
})

type TopLeftPanelProps = {
  edge: DiagramEdge
  view: DiagramView
}
const TopLeftPanelInner = ({ edge, view }: TopLeftPanelProps) => {
  const browser = useRelationshipDetails()
  const edgeId = edge.id
  const [historyEdgeId, historyOps, { history, current }] = useStateHistory(edge.id)

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

          <Group gap={'xs'} wrap={'nowrap'} ml={'sm'}>
            {/* <Box fz={'xs'} fw={'500'} style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>Relationships of</Box> */}
            <SelectEdge edge={edge} view={view} />
          </Group>
        </AnimatePresence>
      </Group>
    </Panel>
  )
}
