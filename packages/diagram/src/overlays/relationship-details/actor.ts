import { type BBox, type DiagramView, type EdgeId, invariant } from '@likec4/core'
import {
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react'
import { prop } from 'remeda'
import {
  type ActorLogicFrom,
  type ActorRefFromLogic,
  type SnapshotFrom,
  assign,
  cancel,
  enqueueActions,
  raise,
  setup,
} from 'xstate'
import { Base } from '../../base'
import { MinZoom } from '../../base/const'
import type { RelationshipDetailsTypes } from './_types'

type XYFLowInstance = ReactFlowInstance<RelationshipDetailsTypes.Node, RelationshipDetailsTypes.Edge>

export type Input = {
  edgeId: EdgeId
  view: DiagramView
  // view: DiagramView | null
  // parentRef?: AnyActorRef| null
}

export type Context = Readonly<
  Input & {
    // parentRef: AnyActorRef | null
    xyflow: XYFLowInstance | null
    initialized: boolean
    xynodes: RelationshipDetailsTypes.Node[]
    xyedges: RelationshipDetailsTypes.Edge[]
    // bounds: BBox | null
  }
>

export type Events =
  | { type: 'xyflow.init'; instance: XYFLowInstance }
  | { type: 'xyflow.nodeClick'; node: RelationshipDetailsTypes.Node }
  | { type: 'xyflow.edgeClick'; edge: RelationshipDetailsTypes.Edge }
  | { type: 'xyflow.edgeMouseEnter'; edge: RelationshipDetailsTypes.Edge }
  | { type: 'xyflow.edgeMouseLeave'; edge: RelationshipDetailsTypes.Edge }
  | { type: 'dim.nonhovered.edges' }
  | { type: 'undim.edges' }
  | { type: 'xyflow.selectionChange'; nodes: RelationshipDetailsTypes.Node[]; edges: RelationshipDetailsTypes.Edge[] }
  | { type: 'xyflow.applyNodeChanges'; changes: NodeChange<RelationshipDetailsTypes.Node>[] }
  | { type: 'xyflow.applyEdgeChanges'; changes: EdgeChange<RelationshipDetailsTypes.Edge>[] }
  | { type: 'xyflow.paneClick' }
  | { type: 'xyflow.resized' }
  | {
    type: 'update.xydata'
    xynodes: RelationshipDetailsTypes.Node[]
    xyedges: RelationshipDetailsTypes.Edge[]
  }
  // | { type: 'update.bounds'; bounds: BBox }
  | { type: 'fitDiagram'; duration?: number; bounds?: BBox }
  | { type: 'navigate.to'; edgeId: EdgeId }
  | { type: 'close' }

export const relationshipDetailsLogic = setup({
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
  initial: 'opening',
  context: ({ input }) => ({
    ...input,
    initialized: false,
    xyflow: null,
    xynodes: [],
    xyedges: [],
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
        'xyflow.edgeMouseEnter': {
          actions: [
            assign({
              xyedges: ({ context, event }) => {
                const hasDimmed = context.xyedges.some(edge => edge.data.dimmed === true)
                return context.xyedges.map(edge => {
                  if (edge.id === event.edge.id) {
                    return Base.setData(edge, {
                      hovered: true,
                      dimmed: false,
                    })
                  }
                  return hasDimmed && !edge.data.dimmed && !edge.selected ? Base.setDimmed(edge, 'immediate') : edge
                })
              },
            }),
            cancel('undim.edges'),
            cancel('dim.nonhovered.edges'),
            raise({ type: 'dim.nonhovered.edges' }, { id: 'dim.nonhovered.edges', delay: 100 }),
          ],
        },
        'xyflow.edgeMouseLeave': {
          actions: [
            assign({
              xyedges: ({ context, event }) =>
                context.xyedges.map(edge => {
                  if (edge.id === event.edge.id) {
                    return Base.setHovered(edge, false)
                  }
                  return edge
                }),
            }),
            cancel('dim.nonhovered.edges'),
            raise({ type: 'undim.edges' }, { id: 'undim.edges', delay: 400 }),
          ],
        },
        'dim.nonhovered.edges': {
          actions: assign({
            xyedges: ({ context }) => context.xyedges.map(edge => Base.setDimmed(edge, edge.data.hovered !== true)),
          }),
        },
        'undim.edges': {
          actions: assign({
            xyedges: ({ context }) => {
              const hasSelected = context.xyedges.some(edge => edge.selected === true)
              if (hasSelected) {
                return context.xyedges.map(edge =>
                  Base.setDimmed(edge, edge.selected !== true ? edge.data.dimmed || 'immediate' : false)
                )
              }
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
    'update.xydata': {
      actions: assign({
        xynodes: ({ event }) => event.xynodes,
        xyedges: ({ event }) => event.xyedges,
      }),
    },
    'xyflow.applyNodeChanges': {
      actions: assign({
        xynodes: ({ context, event }) => {
          return applyNodeChanges(event.changes, context.xynodes)
        },
      }),
    },
    'xyflow.applyEdgeChanges': {
      actions: assign({
        xyedges: ({ context, event }) => {
          return applyEdgeChanges(event.changes, context.xyedges)
        },
      }),
    },
  },
})

export interface RelationshipDetailsLogic extends ActorLogicFrom<typeof relationshipDetailsLogic> {
}
export interface RelationshipDetailsActorRef extends ActorRefFromLogic<RelationshipDetailsLogic> {
}
export type RelationshipDetailsSnapshot = SnapshotFrom<RelationshipDetailsActorRef>
