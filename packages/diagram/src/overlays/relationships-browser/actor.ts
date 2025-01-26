import { type BBox, type DiagramView, type Fqn, invariant } from '@likec4/core'
import {
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react'
import { prop } from 'remeda'
import {
  type ActorLogic,
  type ActorRefFromLogic,
  type MachineSnapshot,
  type SnapshotFrom,
  assign,
  cancel,
  enqueueActions,
  raise,
  setup,
} from 'xstate'
import { MinZoom } from '../../base/const'
import { updateEdges } from '../../base/updateEdges'
import { updateNodes } from '../../base/updateNodes'
import type { LayoutRelationshipsViewResult } from './-useRelationshipsView'
import type { RelationshipsBrowserTypes } from './_types'
import { viewToNodesEdge } from './useViewToNodesEdges'

type XYFLowInstance = ReactFlowInstance<RelationshipsBrowserTypes.Node, RelationshipsBrowserTypes.Edge>

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
    initialized: boolean
    layouted: LayoutRelationshipsViewResult | null
    xynodes: RelationshipsBrowserTypes.Node[]
    xyedges: RelationshipsBrowserTypes.Edge[]
  }
>

export type Events =
  | { type: 'xyflow.init'; instance: XYFLowInstance }
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
  | { type: 'navigate.to'; subject: Fqn }
  | { type: 'update.view'; layouted: LayoutRelationshipsViewResult }
  | { type: 'close' }

export const relationshipsBrowserActor = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    events: {} as Events,
  },
  actions: {
    'xyflow:fitDiagram': ({ context }, params?: { duration?: number; bounds?: BBox }) => {
      const {
        duration = 450,
        bounds,
      } = params ?? {}
      const { xyflow } = context
      invariant(xyflow, 'xyflow is not initialized')
      if (bounds) {
        xyflow.fitBounds(bounds, duration > 0 ? { duration } : undefined)
      } else {
        const maxZoom = Math.max(xyflow.getZoom(), 1)
        xyflow.fitView({
          minZoom: MinZoom,
          maxZoom,
          padding: 0.1,
          ...(duration > 0 && { duration }),
        })
      }
    },
  },
  guards: {
    'enable: navigate.to': () => true,
  },
}).createMachine({
  initial: 'waiting-data',
  context: ({ input }) => ({
    ...input,
    closeable: input.closeable ?? true,
    enableNavigationMenu: input.enableNavigationMenu ?? true,
    initialized: false,
    xyflow: null,
    layouted: null,
    xynodes: [],
    xyedges: [],
  }),
  states: {
    'waiting-data': {
      on: {
        'update.view': {
          actions: assign(({ event }) => {
            return {
              layouted: event.layouted,
              ...viewToNodesEdge(event.layouted),
            }
          }),
          target: 'opening',
        },
      },
    },
    'opening': {
      on: {
        'xyflow.init': {
          actions: assign({
            initialized: true,
            xyflow: ({ event }) => event.instance,
          }),
          target: 'active',
        },
        'close': {
          target: 'closed',
        },
      },
    },
    'active': {
      entry: {
        type: 'xyflow:fitDiagram',
        params: { duration: 0 },
      },
      on: {
        'xyflow.nodeClick': {
          guard: 'enable: navigate.to',
          actions: enqueueActions(({ event, enqueue }) => {
            if ('fqn' in event.node.data) {
              const fqn = event.node.data.fqn
              enqueue.assign({
                subject: fqn,
              })
            }
          }),
        },
        'navigate.to': {
          guard: 'enable: navigate.to',
          actions: [
            assign({
              subject: ({ event }) => event.subject,
            }),
          ],
        },
        'xyflow.paneDblClick': {
          actions: 'xyflow:fitDiagram',
        },
        'update.view': {
          actions: enqueueActions(({ context, event, enqueue }) => {
            const updated = viewToNodesEdge(event.layouted)
            enqueue.assign({
              layouted: event.layouted,
              xynodes: updateNodes(context.xynodes, updated.xynodes),
              xyedges: updateEdges(context.xyedges, updated.xyedges),
            })
            enqueue.raise({ type: 'fitDiagram' }, { delay: 50 })
          }),
        },
        'close': {
          guard: ({ context }) => context.closeable,
          target: 'closed',
        },
      },
      exit: assign({
        initialized: false,
        xyflow: null,
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
        xynodes: ({ context, event }) => applyNodeChanges(event.changes, context.xynodes),
      }),
    },
    'xyflow.applyEdgeChages': {
      actions: assign({
        xyedges: ({ context, event }) => applyEdgeChanges(event.changes, context.xyedges),
      }),
    },
  },
}) as unknown as ActorLogic<
  MachineSnapshot<Context, Events, any, 'opening' | 'active' | 'closed', any, any, any, any>,
  Events,
  Input,
  any,
  any
> // TODO reduce type inference by forcing the types

export type RelationshipsBrowserLogic = typeof relationshipsBrowserActor
export type RelationshipsBrowserActorRef = ActorRefFromLogic<typeof relationshipsBrowserActor>
export type RelationshipsBrowserSnapshot = SnapshotFrom<RelationshipsBrowserActorRef>
