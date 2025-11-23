import {
  type BBox,
  type EdgeId,
  type ExclusiveUnion,
  type Fqn,
  type ViewId,
  invariant,
} from '@likec4/core'
import {
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
  type ReactFlowState,
  applyEdgeChanges,
  applyNodeChanges,
  getViewportForBounds,
} from '@xyflow/react'
import type { InternalNodeUpdate } from '@xyflow/system'
import { shallowEqual } from 'fast-equals'
import { isString, prop } from 'remeda'
import {
  type ActorRef,
  type SnapshotFrom,
  type StateMachine,
  assertEvent,
  assign,
  cancel,
  enqueueActions,
  raise,
  setup,
} from 'xstate'
import { Base } from '../../base'
import { MinZoom } from '../../base/const'
import { updateEdges } from '../../base/updateEdges'
import { updateNodes } from '../../base/updateNodes'
import { typedSystem } from '../../likec4diagram/state/utils'
import type { RelationshipDetailsTypes } from './_types'
import type { LayoutResult } from './layout'
import { layoutResultToXYFlow } from './layout-to-xyflow'

type XYFLowInstance = ReactFlowInstance<RelationshipDetailsTypes.AnyNode, RelationshipDetailsTypes.Edge>
type XYStoreState = ReactFlowState<RelationshipDetailsTypes.AnyNode, RelationshipDetailsTypes.Edge>
type XYStoreApi = {
  getState: () => XYStoreState
}

export type Input = ExclusiveUnion<{
  Edge: {
    edgeId: EdgeId
    viewId: ViewId
  }
  Between: {
    source: Fqn
    target: Fqn
    viewId: ViewId
  }
}>

type Subject = {
  edgeId: EdgeId
  source?: never
  target?: never
  // relationships: null
} | {
  source: Fqn
  target: Fqn
  edgeId?: never
  // relationships: null
}

export type Context = Readonly<{
  // parentRef: AnyActorRef | null
  subject: Subject
  // Scope
  viewId: ViewId
  xyflow: XYFLowInstance | null
  xystore: XYStoreApi | null
  initialized: {
    xydata: boolean
    xyflow: boolean
  }
  xynodes: RelationshipDetailsTypes.Node[]
  xyedges: RelationshipDetailsTypes.Edge[]
  bounds: BBox
}>

function inputToSubject(input: { edgeId: EdgeId } | { source: Fqn; target: Fqn }): Context['subject'] {
  if ('edgeId' in input) {
    invariant(isString(input.edgeId), 'edgeId is required')
    return {
      edgeId: input.edgeId,
    }
  }
  return {
    source: input.source,
    target: input.target,
  }
}

export type Events =
  | { type: 'xyflow.init'; instance: XYFLowInstance; store: XYStoreApi }
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
  | { type: 'xyflow.paneDblClick' }
  | { type: 'xyflow.resized' }
  | { type: 'xyflow.updateNodeInternals' }
  | {
    type: 'update.layoutData'
    data: LayoutResult
  }
  // | { type: 'update.bounds'; bounds: BBox }
  | { type: 'fitDiagram'; duration?: number; bounds?: BBox }
  | { type: 'navigate.to'; params: { edgeId: EdgeId; viewId?: ViewId } | { source: Fqn; target: Fqn; viewId?: ViewId } }
  | { type: 'close' }

const ViewPadding = {
  x: '22px',
  y: '22px',
} as const

export type Tags = never

const _relationshipDetailsLogic = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    tags: {} as Tags,
    events: {} as Events,
  },
  actions: {
    'xyflow:fitDiagram': ({ context }, params?: { duration?: number; bounds?: BBox }) => {
      let { duration, bounds } = params ?? {}
      duration ??= 450
      const { xyflow, xystore } = context
      invariant(xyflow, 'xyflow is not initialized')
      invariant(xystore, 'xystore is not initialized')
      bounds ??= context.bounds
      const maxZoom = Math.max(xyflow.getZoom(), 1)
      if (bounds) {
        const { width, height } = xystore.getState()
        const viewport = getViewportForBounds(bounds, width, height, MinZoom, maxZoom, ViewPadding)
        xyflow.setViewport(viewport, duration > 0 ? { duration } : undefined).catch(console.error)
      } else {
        xyflow.fitView({
          minZoom: MinZoom,
          maxZoom,
          padding: ViewPadding,
          ...(duration > 0 && { duration, interpolate: 'smooth' }),
        }).catch(console.error)
      }
    },
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
    'updateXYFlow': assign(({ context, event }) => {
      assertEvent(event, 'xyflow.init')
      let initialized = context.initialized
      if (!initialized.xyflow) {
        initialized = {
          ...initialized,
          xyflow: true,
        }
      }
      return {
        initialized,
        xyflow: event.instance,
        xystore: event.store,
      }
    }),
    'updateLayoutData': assign(({ context, event }) => {
      assertEvent(event, 'update.layoutData')
      const { xynodes, xyedges, bounds } = layoutResultToXYFlow(event.data)
      let initialized = context.initialized
      if (!initialized.xydata) {
        initialized = {
          ...initialized,
          xydata: true,
        }
      }
      return {
        initialized,
        xynodes: updateNodes(context.xynodes, xynodes),
        xyedges: updateEdges(context.xyedges, xyedges),
        bounds: shallowEqual(context.bounds, bounds) ? context.bounds : bounds,
      }
    }),
    'open relationship source': enqueueActions(({ system, event }) => {
      if (event.type !== 'xyflow.edgeClick') {
        return
      }
      const diagramActor = typedSystem(system).diagramActorRef
      const relationId = event.edge.data.relationId
      if (relationId) {
        diagramActor.send({ type: 'open.source', relation: relationId })
      }
    }),
  },
  guards: {
    'isReady': ({ context }) => context.initialized.xydata && context.initialized.xyflow,
    'enable: navigate.to': () => true,
  },
}).createMachine({
  initial: 'initializing',
  context: ({ input }) => ({
    subject: inputToSubject(input),
    viewId: input.viewId,
    bounds: {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    },
    initialized: {
      xydata: false,
      xyflow: false,
    },
    xyflow: null,
    xystore: null,
    xynodes: [],
    xyedges: [],
  }),
  states: {
    'initializing': {
      on: {
        'xyflow.init': {
          actions: 'updateXYFlow',
          target: 'isReady',
        },
        'update.layoutData': {
          actions: 'updateLayoutData',
          target: 'isReady',
        },
        'close': {
          target: 'closed',
        },
      },
    },
    'isReady': {
      always: [{
        guard: 'isReady',
        actions: [
          { type: 'xyflow:fitDiagram', params: { duration: 0 } },
          raise({ type: 'xyflow.updateNodeInternals' }, { delay: 50 }),
        ],
        target: 'ready',
      }, {
        target: 'initializing',
      }],
    },
    'ready': {
      on: {
        'xyflow.edgeMouseEnter': {
          actions: [
            assign({
              xyedges: ({ context, event }) => {
                const hasDimmed = context.xyedges.some(edge =>
                  edge.data.dimmed === true || edge.data.dimmed === 'immediate'
                )
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
        'update.layoutData': {
          actions: [
            'updateLayoutData',
            cancel('fitDiagram'),
            raise({ type: 'fitDiagram', duration: 0 }, { id: 'fitDiagram', delay: 50 }),
            raise({ type: 'xyflow.updateNodeInternals' }, { delay: 75 }),
          ],
        },
        'xyflow.init': {
          actions: 'updateXYFlow',
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
        'xyflow.paneDblClick': {
          actions: 'xyflow:fitDiagram',
        },
        'xyflow.edgeClick': {
          actions: 'open relationship source',
        },
        'navigate.to': {
          actions: assign({
            subject: ({ event }) => inputToSubject(event.params),
            viewId: ({ context, event }) => event.params.viewId ?? context.viewId,
          }),
        },
        'close': {
          target: 'closed',
        },
      },
      exit: assign({
        xyedges: [],
        xynodes: [],
        initialized: {
          xydata: false,
          xyflow: false,
        },
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
    'xyflow.updateNodeInternals': {
      actions: 'xyflow:updateNodeInternals',
    },
  },
})

export interface RelationshipDetailsLogic extends
  StateMachine<
    Context,
    Events,
    {},
    any,
    any,
    any,
    any,
    any,
    Tags,
    Input,
    any,
    any,
    any,
    any
  >
{
}

export const relationshipDetailsLogic: RelationshipDetailsLogic = _relationshipDetailsLogic as any
export type RelationshipDetailsSnapshot = SnapshotFrom<RelationshipDetailsLogic>

export interface RelationshipDetailsActorRef extends
  ActorRef<
    RelationshipDetailsSnapshot,
    Events
  >
{
}

export type {
  Input as RelationshipDetailsInput,
}
