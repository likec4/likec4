import { type BBox, type Fqn, type ViewId, delay, invariant, nonNullable } from '@likec4/core'
import {
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
  applyEdgeChanges,
  applyNodeChanges,
  useStoreApi,
} from '@xyflow/react'
import { type InternalNodeUpdate, getNodeDimensions, getViewportForBounds } from '@xyflow/system'
import { isNullish, omit, prop } from 'remeda'
import {
  type ActorLogicFrom,
  type ActorRefFromLogic,
  type BaseActorRef,
  type SnapshotFrom,
  assertEvent,
  assign,
  cancel,
  enqueueActions,
  fromPromise,
  raise,
  setup,
} from 'xstate'
import { Base } from '../../base'
import { MinZoom, ZIndexes } from '../../base/const'
import { updateEdges } from '../../base/updateEdges'
import { updateNodes } from '../../base/updateNodes'
import { typedSystem } from '../../state/utils'
import { centerXYInternalNode } from '../../utils'
import type { RelationshipsBrowserTypes } from './_types'
import { ViewPadding } from './const'
import type { LayoutRelationshipsViewResult } from './layout'
import { viewToNodesEdge } from './useViewToNodesEdges'

type XYFLowInstance = ReactFlowInstance<RelationshipsBrowserTypes.Node, RelationshipsBrowserTypes.Edge>

/**
 * Root node in 'subjects' column
 */
const findRootSubject = (nodes: RelationshipsBrowserTypes.Node[]) =>
  nodes.find((n): n is RelationshipsBrowserTypes.ElementNode | RelationshipsBrowserTypes.CompoundNode =>
    n.data.column === 'subjects' && isNullish(n.parentId)
  )

export type XYStoreApi = ReturnType<typeof useStoreApi<RelationshipsBrowserTypes.Node, RelationshipsBrowserTypes.Edge>>

export const layouter = fromPromise<{
  xyedges: RelationshipsBrowserTypes.Edge[]
  xynodes: RelationshipsBrowserTypes.Node[]
}, {
  subjectId: Fqn
  navigateFromNode: string | null
  xyflow: XYFLowInstance
  xystore: XYStoreApi
  update: LayoutRelationshipsViewResult
}>(async ({ input, self, signal }) => {
  const {
    subjectId,
    navigateFromNode,
    xyflow,
    xystore,
    update,
  } = input
  let {
    nodes: currentNodes,
    width,
    height,
  } = xystore.getState()
  const next = viewToNodesEdge(update)

  const updateXYData = () => {
    const { nodes, edges } = xystore.getState()
    return {
      xynodes: updateNodes(nodes, next.xynodes),
      xyedges: updateEdges(edges, next.xyedges),
    }
  }
  const parent = nonNullable(self._parent) as BaseActorRef<Events>

  let zoom = xyflow.getZoom()
  const maxZoom = Math.max(zoom, 1)
  const nextviewport = getViewportForBounds(update.bounds, width, height, MinZoom, maxZoom, ViewPadding)

  const nextSubjectNode = next.xynodes.find(n =>
    n.type !== 'empty' && n.data.column === 'subjects' && n.data.fqn === subjectId
  ) ?? findRootSubject(next.xynodes)
  const currentSubjectNode = findRootSubject(currentNodes)

  const existingNode = navigateFromNode
    ? currentNodes.find(n => n.id === navigateFromNode)
    : currentNodes.find(n => n.type !== 'empty' && n.data.column !== 'subjects' && n.data.fqn === subjectId)

  if (
    !nextSubjectNode || !existingNode || nextSubjectNode.type === 'empty' || !currentSubjectNode ||
    nextSubjectNode.data.fqn === currentSubjectNode.data.fqn
  ) {
    await xyflow.setViewport(nextviewport)
    return updateXYData()
  }

  const nextSubjectCenter = {
    x: nextSubjectNode.position.x + (nextSubjectNode.initialWidth ?? 0) / 2,
    y: nextSubjectNode.position.y + (nextSubjectNode.initialHeight ?? 0) / 2,
  }

  // Center of current subject
  const currentSubjectInternalNode = xyflow.getInternalNode(currentSubjectNode.id)!
  const currentSubjectCenter = centerXYInternalNode(currentSubjectInternalNode)

  // Move to center of existing node
  const existingInternalNode = xyflow.getInternalNode(existingNode.id)!
  const existingDimensions = getNodeDimensions(existingInternalNode)

  // Dim all nodes except the existing node
  // Hide nested nodes
  const nested = new Set<string>()
  currentNodes.forEach(n => {
    if (n.id === existingNode.id) {
      return
    }
    if (n.data.column === 'subjects') {
      nested.add(n.id)
      return
    }
    if (n.parentId && (n.parentId === existingNode.id || nested.has(n.parentId))) {
      nested.add(n.id)
    }
  })
  currentNodes = updateNodes(
    currentNodes,
    currentNodes.flatMap(n => {
      if (nested.has(n.id)) {
        return []
      }
      if (n.id !== existingNode.id) {
        return {
          ...n,
          data: {
            ...n.data,
            dimmed: n.data.column === 'subjects' ? 'immediate' : true,
          },
        } as RelationshipsBrowserTypes.Node
      }
      // Move existing node
      return {
        ...omit(n, ['parentId']),
        position: {
          x: currentSubjectCenter.x - existingDimensions.width / 2,
          y: currentSubjectCenter.y - existingDimensions.height / 2,
        },
        zIndex: ZIndexes.Max,
        hidden: false,
        data: {
          ...n.data,
          dimmed: false,
        },
      } as RelationshipsBrowserTypes.Node
    }),
  )
  parent.send({
    type: 'update.xydata',
    xynodes: currentNodes,
    xyedges: [],
  })

  // Pick the smaller zoom level
  zoom = Math.min(
    zoom,
    nextviewport.zoom,
  )
  // allow framer to render
  await delay(175)
  next.xynodes = next.xynodes.map(Base.setDimmed(false))

  if (signal.aborted) {
    return updateXYData()
  }
  await xyflow.setCenter(currentSubjectCenter.x, currentSubjectCenter.y, { zoom, duration: 350 })
  await xyflow.setCenter(nextSubjectCenter.x, nextSubjectCenter.y, { zoom })
  return updateXYData()
})

export type Input = {
  subject: Fqn
  viewId: ViewId | null
  scope: 'global' | 'view'
  closeable?: boolean
  enableSelectSubject?: boolean
  enableChangeScope?: boolean
  // parentRef?: AnyActorRef| null
}

export type Context = Readonly<{
  subject: Fqn
  viewId: ViewId | null
  scope: 'global' | 'view'
  closeable: boolean
  enableSelectSubject: boolean
  enableChangeScope: boolean
  // parentRef: AnyActorRef | null
  xyflow: XYFLowInstance | null
  xystore: XYStoreApi | null
  layouted: LayoutRelationshipsViewResult | null
  navigateFromNode: string | null
  xynodes: RelationshipsBrowserTypes.Node[]
  xyedges: RelationshipsBrowserTypes.Edge[]
}>

export type Events =
  | { type: 'xyflow.init'; instance: XYFLowInstance; store: XYStoreApi }
  | { type: 'xyflow.nodeClick'; node: RelationshipsBrowserTypes.Node }
  | { type: 'xyflow.edgeClick'; edge: RelationshipsBrowserTypes.Edge }
  | { type: 'xyflow.applyNodeChanges'; changes: NodeChange<RelationshipsBrowserTypes.Node>[] }
  | { type: 'xyflow.applyEdgeChanges'; changes: EdgeChange<RelationshipsBrowserTypes.Edge>[] }
  | { type: 'xyflow.paneClick' }
  | { type: 'xyflow.paneDblClick' }
  | { type: 'xyflow.resized' }
  | { type: 'xyflow.edgeMouseEnter'; edge: RelationshipsBrowserTypes.Edge }
  | { type: 'xyflow.edgeMouseLeave'; edge: RelationshipsBrowserTypes.Edge }
  | { type: 'xyflow.selectionChange'; nodes: RelationshipsBrowserTypes.Node[]; edges: RelationshipsBrowserTypes.Edge[] }
  | { type: 'dim.nonhovered.edges' }
  | { type: 'undim.edges' }
  | { type: 'xyflow.updateNodeInternals' }
  | { type: 'xyflow.unmount' }
  | { type: 'fitDiagram'; duration?: number; bounds?: BBox }
  | { type: 'navigate.to'; subject: Fqn; fromNode?: string | undefined; viewId?: ViewId | undefined }
  | {
    type: 'update.xydata'
    xynodes: RelationshipsBrowserTypes.Node[]
    xyedges: RelationshipsBrowserTypes.Edge[]
  }
  | { type: 'change.scope'; scope: 'global' | 'view' }
  | { type: 'update.view'; layouted: LayoutRelationshipsViewResult }
  | { type: 'close' }

export const relationshipsBrowserLogic = setup({
  types: {
    context: {} as Context,
    tags: '' as 'active',
    children: {} as {
      layouter: 'layouter'
    },
    input: {} as Input,
    events: {} as Events,
  },
  actors: {
    layouter,
  },
  guards: {
    hasViewId: ({ context }) => context.viewId !== null,
    isReady: ({ context }) => context.xyflow !== null && context.xystore !== null && context.layouted !== null,
    anotherSubject: ({ context, event }) => {
      if (event.type === 'update.view') {
        const subject = context.layouted?.subject
        return subject !== event.layouted.subject
      }
      return false
    },
  },
  actions: {
    'xyflow.init': assign(({ event }) => {
      assertEvent(event, 'xyflow.init')
      return {
        xyflow: event.instance,
        xystore: event.store,
      }
    }),
    'update.view': assign(({ event }) => {
      assertEvent(event, 'update.view')
      return {
        layouted: event.layouted,
        ...viewToNodesEdge(event.layouted),
      }
    }),
    'xyflow:updateNodeInternals': ({ context }) => {
      invariant(context.xystore, 'xystore is not initialized')
      const { domNode, updateNodeInternals } = context.xystore.getState()
      const nodeIds = new Set(context.xyedges.flatMap((e) => [e.source, e.target]))

      if (nodeIds.size === 0 || !domNode) {
        return
      }

      const updates = new Map<string, InternalNodeUpdate>()

      for (const updateId of nodeIds) {
        const nodeElement = domNode.querySelector(`.react-flow__node[data-id="${updateId}"]`) as HTMLDivElement
        if (nodeElement) {
          updates.set(updateId, { id: updateId, nodeElement, force: true })
        }
      }

      updateNodeInternals(updates, { triggerFitView: false })
    },
    'xyflow:fitDiagram': ({ context }, params?: { duration?: number; bounds?: BBox }) => {
      let { duration, bounds } = params ?? {}
      duration ??= 450
      const { xyflow, xystore } = context
      invariant(xyflow, 'xyflow is not initialized')
      invariant(xystore, 'xystore is not initialized')
      bounds ??= context.layouted?.bounds
      const maxZoom = Math.max(xyflow.getZoom(), 1)
      if (bounds) {
        const { width, height } = xystore.getState()
        const viewport = getViewportForBounds(bounds, width, height, MinZoom, maxZoom, ViewPadding)
        xyflow.setViewport(viewport, duration > 0 ? { duration } : undefined)
      } else {
        xyflow.fitView({
          minZoom: MinZoom,
          maxZoom,
          padding: ViewPadding,
          ...(duration > 0 && { duration }),
        })
      }
    },
    'xyflow.applyNodeChanges': assign(({ context, event }) => {
      assertEvent(event, 'xyflow.applyNodeChanges')
      return {
        xynodes: applyNodeChanges(event.changes, context.xynodes),
      }
    }),
    'xyflow.applyEdgeChanges': assign(({ context, event }) => {
      assertEvent(event, 'xyflow.applyEdgeChanges')
      return {
        xyedges: applyEdgeChanges(event.changes, context.xyedges),
      }
    }),
  },
}).createMachine({
  id: 'relationships-browser',
  context: ({ input }) => ({
    subject: input.subject,
    viewId: input.viewId,
    scope: input.viewId ? input.scope : 'global',
    closeable: input.closeable ?? true,
    enableSelectSubject: input.enableSelectSubject ?? true,
    enableChangeScope: input.enableChangeScope ?? true,
    xyflow: null,
    xystore: null,
    layouted: null,
    navigateFromNode: null,
    xynodes: [],
    xyedges: [],
  }),
  initial: 'initializing',
  on: {
    'xyflow.applyNodeChanges': {
      actions: 'xyflow.applyNodeChanges',
    },
    'xyflow.applyEdgeChanges': {
      actions: 'xyflow.applyEdgeChanges',
    },
  },
  states: {
    initializing: {
      on: {
        'xyflow.init': {
          actions: 'xyflow.init',
          target: 'isReady',
        },
        'update.view': {
          actions: 'update.view',
          target: 'isReady',
        },
        'stop': 'closed',
        'close': 'closed',
      },
    },
    'isReady': {
      always: [{
        guard: 'isReady',
        actions: [
          { type: 'xyflow:fitDiagram', params: { duration: 0 } },
          raise({ type: 'xyflow.updateNodeInternals' }, { delay: 150 }),
        ],
        target: 'active',
      }, {
        target: 'initializing',
      }],
    },
    'active': {
      initial: 'idle',
      tags: ['active'],
      on: {
        'xyflow.nodeClick': {
          actions: enqueueActions(({ event, enqueue }) => {
            if ('fqn' in event.node.data) {
              const fqn = event.node.data.fqn
              enqueue.raise({
                type: 'navigate.to',
                subject: fqn,
                fromNode: event.node.id,
              })
            }
          }),
        },
        'xyflow.edgeClick': {
          guard: 'hasViewId',
          actions: enqueueActions(({ event, context, system, enqueue }) => {
            if (
              event.edge.selected || event.edge.data.relations.length > 1
              // (context.xyedges.some(e => e.data.dimmed === true || e.data.dimmed === 'immediate') && !event.edge.data.dimmed)
            ) {
              enqueue.sendTo(typedSystem(system).overlaysActorRef!, {
                type: 'open.relationshipDetails',
                viewId: context.viewId!,
                source: event.edge.data.sourceFqn,
                target: event.edge.data.targetFqn,
              })
            }
          }),
        },
        'navigate.to': {
          actions: [
            assign({
              subject: ({ event }) => event.subject,
              viewId: ({ event, context }) => event.viewId ?? context.viewId ?? null,
              navigateFromNode: ({ event }) => event.fromNode ?? null,
            }),
          ],
        },
        'xyflow.paneDblClick': {
          actions: 'xyflow:fitDiagram',
        },
        'update.view': {
          actions: 'update.view',
          target: '.layouting',
        },
        'change.scope': {
          actions: assign({
            scope: ({ event }) => event.scope,
          }),
        },
        'xyflow.updateNodeInternals': {
          actions: 'xyflow:updateNodeInternals',
        },
        'fitDiagram': {
          actions: {
            type: 'xyflow:fitDiagram',
            params: prop('event'),
          },
        },
        'xyflow.resized': {
          actions: [
            cancel('fitDiagram'),
            raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 300 }),
          ],
        },
        'xyflow.init': {
          actions: 'xyflow.init',
        },
        'xyflow.unmount': {
          target: 'initializing',
        },
        'close': 'closed',
      },
      states: {
        'idle': {
          on: {
            'xyflow.edgeMouseEnter': {
              actions: [
                assign({
                  xyedges: ({ context, event }) => {
                    const hasDimmed = context.xyedges.some(edge => edge.data.dimmed !== false || edge.selected)
                    return context.xyedges.map(edge => {
                      if (edge.id === event.edge.id) {
                        return Base.setData(edge, {
                          hovered: true,
                          dimmed: false,
                        })
                      }
                      return hasDimmed && !edge.selected ? Base.setDimmed(edge, 'immediate') : edge
                    })
                  },
                }),
                cancel('undim.edges'),
                cancel('dim.nonhovered.edges'),
                raise({ type: 'dim.nonhovered.edges' }, { id: 'dim.nonhovered.edges', delay: 200 }),
              ],
            },
            'xyflow.edgeMouseLeave': {
              actions: [
                assign({
                  xyedges: ({ context, event }) => {
                    return context.xyedges.map(edge => {
                      if (edge.id === event.edge.id) {
                        return Base.setHovered(edge, false)
                      }
                      return edge
                    })
                  },
                }),
                cancel('dim.nonhovered.edges'),
                raise({ type: 'undim.edges' }, { id: 'undim.edges', delay: 400 }),
              ],
            },
            'dim.nonhovered.edges': {
              actions: assign({
                xyedges: ({ context }) =>
                  context.xyedges.map(edge =>
                    edge.data.hovered
                      ? edge
                      : Base.setDimmed(edge, edge.data.dimmed === 'immediate' ? 'immediate' : true)
                  ),
              }),
            },
            'undim.edges': {
              actions: assign({
                xyedges: ({ context }) => {
                  // const hasSelected = context.xyedges.some(edge => edge.selected === true)
                  // if (hasSelected) {
                  //   return context.xyedges.map(edge =>
                  //     Base.setDimmed(edge, edge.selected !== true ? 'immediate' : false)
                  //   )
                  // }
                  return context.xyedges.map(Base.setDimmed(false))
                },
              }),
            },
            'xyflow.selectionChange': {
              actions: enqueueActions(({ event, context, enqueue }) => {
                if (
                  event.edges.length === 0 && context.xyedges.some(e => e.data.dimmed) &&
                  !context.xyedges.some(e => e.data.hovered)
                ) {
                  enqueue.raise({ type: 'undim.edges' })
                }
              }),
            },
          },
        },
        'layouting': {
          invoke: {
            id: 'layouter',
            src: 'layouter',
            input: ({ context }) => {
              return {
                subjectId: context.subject,
                navigateFromNode: context.navigateFromNode,
                xyflow: nonNullable(context.xyflow),
                xystore: nonNullable(context.xystore),
                update: nonNullable(context.layouted),
              }
            },
            onDone: {
              target: 'idle',
              actions: enqueueActions(({ enqueue, event }) => {
                enqueue.assign({
                  xynodes: event.output.xynodes,
                  xyedges: event.output.xyedges,
                  navigateFromNode: null,
                })
                enqueue.raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 50 })
                for (let i = 0; i < 6; i++) {
                  enqueue.raise({ type: 'xyflow.updateNodeInternals' }, { delay: 100 + i * 100 })
                }
              }),
            },
          },
          on: {
            'update.xydata': {
              actions: assign({
                xynodes: ({ event }) => event.xynodes,
                xyedges: ({ event }) => event.xyedges,
              }),
            },
            'xyflow.applyEdgeChanges': {
              // actions: log('layouting: ignore xyflow.applyEdgeChanges'),
            },
            'xyflow.applyNodeChanges': {
              // actions: log('layouting: ignore xyflow.applyNodeChanges'),
            },
          },
        },
      },
    },
    closed: {
      id: 'closed',
      type: 'final',
    },
  },
  exit: assign({
    xyflow: null,
    layouted: null,
    xystore: null,
    xyedges: [],
    xynodes: [],
  }),
})

export interface RelationshipsBrowserLogic extends ActorLogicFrom<typeof relationshipsBrowserLogic> {
}
export interface RelationshipsBrowserActorRef extends ActorRefFromLogic<RelationshipsBrowserLogic> {
}
export type RelationshipsBrowserSnapshot = SnapshotFrom<RelationshipsBrowserActorRef>
