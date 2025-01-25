import { type BBox, type DiagramView, type EdgeId, invariant } from '@likec4/core'
import {
  type ReactFlowInstance,
} from '@xyflow/react'
import { prop } from 'remeda'
import {
  type ActorLogic,
  type ActorRefFromLogic,
  type MachineSnapshot,
  type SnapshotFrom,
  assign,
  cancel,
  raise,
  setup,
} from 'xstate'
import { MinZoom } from '../../base/const'
import type { RelationshipDetailsTypes } from './_types'

type XYFLowInstance = ReactFlowInstance<RelationshipDetailsTypes.Node, RelationshipDetailsTypes.Edge>

export type Input = {
  edgeId: EdgeId
  view: DiagramView
  // scope?: DiagramView | null
  // parentRef?: AnyActorRef| null
}

export type Context = Readonly<
  Input & {
    // parentRef: AnyActorRef | null
    xyflow: XYFLowInstance | null
    initialized: boolean
    // bounds: BBox | null
  }
>

export type Events =
  | { type: 'xyflow.init'; instance: XYFLowInstance }
  | { type: 'xyflow.nodeClick'; node: RelationshipDetailsTypes.Node }
  | { type: 'xyflow.edgeClick'; edge: RelationshipDetailsTypes.Edge }
  | { type: 'xyflow.paneClick' }
  | { type: 'xyflow.resized' }
  // | { type: 'update.bounds'; bounds: BBox }
  | { type: 'fitDiagram'; duration?: number; bounds?: BBox }
  | { type: 'navigate.to'; edgeId: EdgeId }
  | { type: 'close' }

export const relationshipDetailsActor = setup({
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
}).createMachine({
  initial: 'opening',
  context: ({ input }) => ({
    ...input,
    initialized: false,
    xyflow: null,
  }),
  states: {
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
        // 'xyflow.nodeClick': {
        //   actions: enqueueActions(({ event, enqueue }) => {
        //     if ('fqn' in event.node.data) {
        //       const fqn = event.node.data.fqn
        //       enqueue.assign({
        //         subject: fqn,
        //       })
        //       enqueue.raise({ type: 'fitDiagram' }, { delay: 50 })
        //     }
        //   }),
        // },
        'navigate.to': {
          actions: [
            assign({
              edgeId: ({ event }) => event.edgeId,
            }),
            raise({ type: 'fitDiagram' }, { delay: 50 }),
          ],
        },
        'close': {
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
  },
}) as unknown as ActorLogic<
  MachineSnapshot<Context, Events, any, 'opening' | 'active' | 'closed', any, any, any, any>,
  Events,
  Input,
  any,
  any
> // TODO reduce type inference by forcing the types

export type RelationshipDetailsLogic = typeof relationshipDetailsActor
export type RelationshipDetailsActorRef = ActorRefFromLogic<typeof relationshipDetailsActor>
export type RelationshipDetailsSnapshot = SnapshotFrom<RelationshipDetailsActorRef>
