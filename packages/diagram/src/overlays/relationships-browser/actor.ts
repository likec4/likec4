import { type BBox, type DiagramView, type Fqn, delay, invariant, isAncestor, nonNullable } from '@likec4/core'
import { logger } from '@likec4/log/browser'
import {
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
  applyEdgeChanges,
  applyNodeChanges,
  useStoreApi,
} from '@xyflow/react'
import { getNodeDimensions, getViewportForBounds } from '@xyflow/system'
import { isNullish, omit, prop } from 'remeda'
import {
  type ActorLogic,
  type ActorRefFromLogic,
  type BaseActorRef,
  type MachineSnapshot,
  type SnapshotFrom,
  assign,
  cancel,
  enqueueActions,
  fromPromise,
  log,
  raise,
  setup,
} from 'xstate'
import { Base } from '../../base'
import { MinZoom, ZIndexes } from '../../base/const'
import { updateEdges } from '../../base/updateEdges'
import { updateNodes } from '../../base/updateNodes'
import { centerXYInternalNode } from '../../utils'
import type { LayoutRelationshipsViewResult } from './-useRelationshipsView'
import type { RelationshipsBrowserTypes } from './_types'
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

export type Input = {
  subject: Fqn
  scope?: DiagramView | null
  closeable?: boolean
  enableNavigationMenu?: boolean
  // parentRef?: AnyActorRef| null
}

export type Context = Readonly<
  Input & {
    closeable: boolean
    enableNavigationMenu: boolean
    // parentRef: AnyActorRef | null
    xyflow: XYFLowInstance | null
    xystore: XYStoreApi | null
    initialized: boolean
    layouted: LayoutRelationshipsViewResult | null
    navigateFromNode: string | null
    xynodes: RelationshipsBrowserTypes.Node[]
    xyedges: RelationshipsBrowserTypes.Edge[]
  }
>

export type Events =
  | { type: 'xyflow.init'; instance: XYFLowInstance; store: XYStoreApi }
  | { type: 'xyflow.nodeClick'; node: RelationshipsBrowserTypes.Node }
  | { type: 'xyflow.edgeClick'; edge: RelationshipsBrowserTypes.Edge }
  | { type: 'xyflow.applyNodeChages'; changes: NodeChange<RelationshipsBrowserTypes.Node>[] }
  | { type: 'xyflow.applyEdgeChages'; changes: EdgeChange<RelationshipsBrowserTypes.Edge>[] }
  | { type: 'xyflow.paneClick' }
  | { type: 'xyflow.paneDblClick' }
  | { type: 'xyflow.resized' }
  | { type: 'xyflow.edgeMouseEnter'; edge: RelationshipsBrowserTypes.Edge }
  | { type: 'xyflow.edgeMouseLeave'; edge: RelationshipsBrowserTypes.Edge }
  | { type: 'fitDiagram'; duration?: number; bounds?: BBox }
  | { type: 'navigate.to'; subject: Fqn; fromNode?: string | undefined }
  | {
    type: 'update.xydata'
    xynodes: RelationshipsBrowserTypes.Node[]
    xyedges: RelationshipsBrowserTypes.Edge[]
  }
  | { type: 'update.view'; layouted: LayoutRelationshipsViewResult }
  | { type: 'close' }

export const relationshipsBrowserActor = setup({
  types: {
    context: {} as Context,
    tags: '' as 'active',
    input: {} as Input,
    events: {} as Events,
  },
  actions: {
    'xyflow:fitDiagram': ({ context }, params?: { duration?: number; bounds?: BBox }) => {
      let {
        duration = 450,
        bounds,
      } = params ?? {}
      const { xyflow, xystore } = context
      invariant(xyflow, 'xyflow is not initialized')
      invariant(xystore, 'xystore is not initialized')
      bounds ??= context.layouted?.bounds
      const maxZoom = Math.max(xyflow.getZoom(), 1)
      if (bounds) {
        const { width, height } = xystore.getState()
        const viewport = getViewportForBounds(bounds, width, height, MinZoom, maxZoom, 0.05)
        xyflow.setViewport(viewport, duration > 0 ? { duration } : undefined)
      } else {
        xyflow.fitView({
          minZoom: MinZoom,
          maxZoom,
          padding: 0.05,
          ...(duration > 0 && { duration }),
        })
      }
    },
  },
  guards: {
    'enable: navigate.to': () => true,
    'closeable': ({ context }) => context.closeable,
  },
  actors: {
    layouter: fromPromise<{
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
      const {
        nodes: currentNodes,
        edges: currentEdges,
        setNodes,
        setEdges,
        width,
        height,
      } = xystore.getState()
      const next = viewToNodesEdge(update)

      const updateCurrent = () => {
        const { nodes, edges } = xystore.getState()
        return {
          xynodes: updateNodes(nodes, next.xynodes),
          xyedges: updateEdges(edges, next.xyedges),
        }
      }
      // next.xynodes = updateNodes(currentNodes, next.xynodes.map(Base.setDimmed(false)))
      // next.xyedges = updateEdges(currentEdges, next.xyedges.map(Base.setDimmed(false)))

      const nextSubjectNode = findRootSubject(next.xynodes)
      const currentSubjectNode = findRootSubject(currentNodes)

      const parent = nonNullable(self._parent) as BaseActorRef<Events>

      //  If subject node is the same, don't animate
      if (currentSubjectNode && nextSubjectNode?.data.fqn === currentSubjectNode.data.fqn) {
        return updateCurrent()
      }

      if (!nextSubjectNode) {
        console.error('Subject node not found')
      } else if (nextSubjectNode.data.fqn !== subjectId) {
        console.error(`Subject node mismatch, expected: ${subjectId} got: ${nextSubjectNode.data.fqn}`)
      }

      const nextSubjectCenter = nextSubjectNode && {
        x: nextSubjectNode.position.x + (nextSubjectNode.initialWidth ?? 0) / 2,
        y: nextSubjectNode.position.y + (nextSubjectNode.initialHeight ?? 0) / 2,
      }

      const existingNode = navigateFromNode
        ? currentNodes.find(n => n.id === navigateFromNode)
        : currentNodes.find(n => n.type !== 'empty' && n.data.column !== 'subjects' && n.data.fqn === subjectId)

      if (!existingNode || !nextSubjectCenter || !nextSubjectNode || !currentSubjectNode) {
        return updateCurrent()
      }

      // Center of current subject
      const currentSubjectInternalNode = xyflow.getInternalNode(currentSubjectNode.id)!
      const currentSubjectCenter = centerXYInternalNode(currentSubjectInternalNode)

      // Move to center of existing node
      const existingInternalNode = xyflow.getInternalNode(existingNode.id)!
      const existingDimensions = getNodeDimensions(existingInternalNode)

      logger.debug('layouter - Dim all nodes except the existing node')
      // Dim all nodes except the existing node
      logger.debug('layouter - setNodes')
      setNodes(currentNodes.map(n => {
        if (n.id !== existingNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              dimmed: 'immediate' as const,
              // dimmed: n.data.column === 'subjects' ? 'immediate' : true,
              // dimmed: 'immediate',
            },
            // hidden: n.data.column === 'subjects',
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
          data: {
            ...n.data,
            dimmed: false,
          },
        } as RelationshipsBrowserTypes.Node
      }))
      logger.debug('layouter - setEdges')
      setEdges(currentEdges.map(e => ({
        ...e,
        data: {
          ...e.data,
          dimmed: 'immediate' as const,
        },
        hidden: e.source === existingNode.id
          || e.target === existingNode.id
          || isAncestor(existingNode.id, e.source)
          || isAncestor(existingNode.id, e.target),
      })))

      const nextzoom = getViewportForBounds(input.update.bounds, width, height, MinZoom, 1, 0.1).zoom

      // Pick the smaller zoom level
      const zoom = Math.min(
        xyflow.getViewport().zoom,
        nextzoom,
      )
      // allow frameer to render
      await delay(150)

      next.xynodes = next.xynodes.map(Base.setDimmed(false))
      next.xyedges = next.xyedges.map(Base.setDimmed(false))

      if (signal.aborted) {
        return updateCurrent()
      }

      logger.debug('layouter.setCenter animate')
      await xyflow.setCenter(currentSubjectCenter.x, currentSubjectCenter.y, { zoom, duration: 250 })

      if (signal.aborted) {
        return updateCurrent()
      }

      logger.debug('layouter.setCenter istant')
      xyflow.setCenter(nextSubjectCenter.x, nextSubjectCenter.y, { zoom })
      const final = updateCurrent()
      // requestAnimationFrame(() => {
      logger.debug('layouter - setNodes')
      setNodes(final.xynodes)
      logger.debug('layouter - setEdges')
      setEdges(final.xyedges)
      // })

      await delay(100)

      // parent.send({
      //   type: 'set.nodes.edges',
      //   xynodes: next.xynodes.map(Base.setDimmed(false)),
      //   xyedges: next.xyedges.map(Base.setDimmed(false)),
      //   layouted: input.update,
      // })

      // await delay(100)
      logger.debug('layouter - done')
      return final
    }),
  },
}).createMachine({
  initial: 'initializing',
  context: ({ input }) => ({
    ...input,
    closeable: input.closeable ?? true,
    enableNavigationMenu: input.enableNavigationMenu ?? true,
    initialized: false,
    xyflow: null,
    xystore: null,
    layouted: null,
    navigateFromNode: null,
    xynodes: [],
    xyedges: [],
  }),
  states: {
    'initializing': {
      on: {
        'xyflow.init': {
          actions: [
            assign({
              initialized: true,
              xyflow: ({ event }) => event.instance,
              xystore: ({ event }) => event.store,
            }),
          ],
          target: 'waiting-data',
        },
        'close': {
          target: 'closed',
        },
      },
    },
    'waiting-data': {
      on: {
        'update.view': {
          actions: [
            assign(({ event }) => {
              return {
                layouted: event.layouted,
                ...viewToNodesEdge(event.layouted),
              }
            }),
            raise({ type: 'fitDiagram', duration: 0 }),
          ],
          target: 'active',
        },
      },
    },
    'active': {
      initial: 'idle',
      tags: ['active'],
      states: {
        'idle': {},
        'layouting': {
          entry: [
            log('enter layouting'),
          ],
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
              actions: [
                log('layouting.onDone'),
                assign({
                  xynodes: ({ event }) => event.output.xynodes,
                  xyedges: ({ event }) => event.output.xyedges,
                  navigateFromNode: null,
                }),
                raise({ type: 'fitDiagram' }, { delay: 50 }),
              ],
            },
          },
          on: {
            'update.xydata': {
              actions: [
                assign({
                  xynodes: ({ event }) => event.xynodes,
                  xyedges: ({ event }) => event.xyedges,
                }),
              ],
            },
            'xyflow.applyEdgeChages': {
              actions: log('layouting: ignore xyflow.applyEdgeChages'),
            },
            'xyflow.applyNodeChages': {
              actions: log('layouting: ignore xyflow.applyNodeChages'),
            },
          },
        },
      },
      on: {
        'xyflow.nodeClick': {
          guard: 'enable: navigate.to',
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
        'navigate.to': {
          guard: 'enable: navigate.to',
          actions: [
            assign({
              subject: ({ event }) => event.subject,
              navigateFromNode: ({ event }) => event.fromNode ?? null,
            }),
          ],
        },
        'xyflow.paneDblClick': {
          actions: 'xyflow:fitDiagram',
        },
        'update.view': {
          actions: [
            assign({
              layouted: ({ event }) => event.layouted,
            }),
            log('update.view'),
          ],
          target: '.layouting',
          // actions: enqueueActions(({ context, event, enqueue }) => {
          //   const updated = viewToNodesEdge(event.layouted)
          //   enqueue.assign({
          //     layouted: event.layouted,
          //     xynodes: updateNodes(context.xynodes, updated.xynodes),
          //     xyedges: updateEdges(context.xyedges, updated.xyedges),
          //   })
          //   enqueue.raise({ type: 'fitDiagram' }, { delay: 50 })
          // }),
        },
        // 'set.nodes.edges': {
        //   actions: assign({
        //     xynodes: ({ event, context }) => updateNodes(context.xynodes, event.xynodes),
        //     xyedges: ({ event, context }) => updateEdges(context.xyedges, event.xyedges),
        //     layouted: ({ event, context }) => event.layouted ?? context.layouted,
        //   }),
        // },
        'close': {
          guard: 'closeable',
          target: 'closed',
        },
      },
      exit: assign({
        initialized: false,
        xyflow: null,
        xystore: null,
      }),
    },
    'closed': {
      type: 'final',
    },
  },
  on: {
    'fitDiagram': {
      actions: {
        type: 'xyflow:fitDiagram',
        params: prop('event'),
      },
    },
    'xyflow.resized': {
      actions: [
        cancel('fitDiagram'),
        raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 200 }),
      ],
    },
    'xyflow.applyNodeChages': {
      actions: assign({
        xynodes: ({ context, event }) => {
          logger.debug('xyflow.applyNodeChages', event.changes)
          return applyNodeChanges(event.changes, context.xynodes)
        },
      }),
    },
    'xyflow.applyEdgeChages': {
      actions: assign({
        xyedges: ({ context, event }) => {
          logger.debug('xyflow.applyEdgeChanges', event.changes)
          return applyEdgeChanges(event.changes, context.xyedges)
        },
      }),
    },
  },
}) as unknown as ActorLogic<
  MachineSnapshot<Context, Events, any, 'initializing' | 'waiting-data' | 'active' | 'closed', 'active', any, any, any>,
  Events,
  Input,
  any,
  any
> // TODO reduce type inference by forcing the types

export type RelationshipsBrowserLogic = typeof relationshipsBrowserActor
export type RelationshipsBrowserActorRef = ActorRefFromLogic<typeof relationshipsBrowserActor>
export type RelationshipsBrowserSnapshot = SnapshotFrom<RelationshipsBrowserActorRef>
