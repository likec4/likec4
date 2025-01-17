import {
  type BBox,
  type DiagramView,
  type Fqn,
  type NodeId,
  type ViewChange,
  type ViewId,
  type XYPoint,
  DiagramNode,
  getBBoxCenter,
  invariant,
  nonexhaustive,
  nonNullable,
} from '@likec4/core'
import {
  type ReactFlowInstance,
  type useStoreApi,
  applyEdgeChanges,
  applyNodeChanges,
  getViewportForBounds,
} from '@xyflow/react'
import type { EdgeChange, NodeChange, Viewport } from '@xyflow/system'
import { prop } from 'remeda'
import {
  type ActorRefFromLogic,
  type SnapshotFrom,
  and,
  assertEvent,
  assign,
  enqueueActions,
  log,
  or,
  setup,
  spawnChild,
  stopChild,
} from 'xstate'
import { relationshipsBrowserLogic } from '../../additional/relationships-browser/state'
import { MinZoom } from '../../base/const'
import type { EnabledFeatures } from '../../context'
import { AllDisabled } from '../../context/DiagramFeatures'
import type { OpenSourceParams } from '../../LikeC4Diagram.props'
import type { Types } from '../types'
import {
  focusNodesEdges,
  lastClickedNode,
  mergeUpdateViewEvent,
  navigateBack,
  navigateForward,
  unfocusNodesEdges,
  updateNavigationHistory,
} from './assign'
import { type HotKeyEvent, hotkeyActor } from './hotkeyActor'
import { focusedBounds } from './utils'

export type XYStoreApi = ReturnType<typeof useStoreApi<Types.Node, Types.Edge>>
export interface NavigationHistory {
  history: ReadonlyArray<{
    viewId: ViewId
    fromNode: NodeId | null
    viewport: Viewport
  }>
  currentIndex: number
}

export interface Input {
  view: DiagramView
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
  xystore: XYStoreApi
  zoomable: boolean
  pannable: boolean
  fitViewPadding: number
}

export interface Context extends Input {
  features: EnabledFeatures
  xyflow: ReactFlowInstance<Types.Node, Types.Edge> | null
  initialized: boolean
  viewport: Viewport
  viewportChangedManually: boolean
  lastOnNavigate: null | {
    fromView: ViewId
    toView: ViewId
    fromNode: NodeId | null
  }
  navigationHistory: NavigationHistory
  lastClickedNode: null | {
    id: NodeId
    clicks: number
    timestamp: number
  }
  focusedNode: NodeId | null
  viewportBeforeFocus: null | Viewport
}

export type Events =
  | HotKeyEvent
  | { type: 'xyflow.init'; instance: ReactFlowInstance<Types.Node, Types.Edge> }
  | { type: 'xyflow.applyNodeChages'; changes: NodeChange<Types.Node>[] }
  | { type: 'xyflow.applyEdgeChages'; changes: EdgeChange<Types.Edge>[] }
  | { type: 'xyflow.viewportMoved'; viewport: Viewport; manually: boolean }
  | { type: 'xyflow.nodeClick'; node: Types.Node }
  | { type: 'xyflow.edgeClick'; edge: Types.Edge }
  | { type: 'xyflow.paneClick' }
  | { type: 'xyflow.paneDblClick' }
  | { type: 'update.view'; view: DiagramView; xynodes: Types.Node[]; xyedges: Types.Edge[] }
  | { type: 'update.inputs'; inputs: Partial<Omit<Input, 'view'>> }
  | { type: 'update.features'; features: EnabledFeatures }
  | { type: 'fitDiagram'; duration?: number; bounds?: BBox }
  | { type: 'openElementDetails'; fqn: Fqn; fromNode?: NodeId }
  | { type: 'openRelationshipsBrowser'; fqn: Fqn }
  | { type: 'navigate.to'; viewId: ViewId; fromNode?: NodeId }
  | { type: 'navigate.back' }
  | { type: 'navigate.forward' }

export const likeC4ViewMachine = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    children: {} as {
      hotkey: 'hotkeyActor'
      relationshipsBrowser: 'relationshipsBrowserLogic'
    },
    events: {} as Events,
  },
  guards: {
    'enabled: FocusMode': ({ context }) => context.features.enableFocusMode,
    'enabled: Readonly': ({ context }) => context.features.enableReadOnly,
    'not readonly': ({ context }) => !context.features.enableReadOnly,
    'is another view': ({ context, event }) => {
      assertEvent(event, ['update.view', 'navigate.to'])
      if (event.type === 'update.view') {
        return context.view.id !== event.view.id
      }
      if (event.type === 'navigate.to') {
        return context.view.id !== event.viewId
      }
      nonexhaustive(event.type)
    },
    'click: selected node ': ({ event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      return event.node.selected === true
    },
    'click: same node': ({ context, event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      return context.lastClickedNode?.id === event.node.id
    },
    'click: focused node': ({ context, event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      return context.focusedNode === event.node.id
    },
  },
  actions: {
    'trigger:NavigateTo': (_, _params: { viewId: ViewId }) => {
      // navigate to view
    },
    'trigger:ChangeElementStyle': (_, _change: ViewChange.ChangeElementStyle) => {
    },
    'trigger:OpenSource': (_, _params: OpenSourceParams) => {
    },

    'xyflow:fitDiagram': ({ context }, params?: { duration?: number; bounds?: BBox }) => {
      const {
        bounds = context.view.bounds,
        duration = 450,
      } = params ?? {}
      const { width, height, panZoom, transform } = context.xystore.getState()

      const maxZoom = Math.max(1, transform[2])
      const viewport = getViewportForBounds(
        bounds,
        width,
        height,
        MinZoom,
        maxZoom,
        context.fitViewPadding,
      )
      viewport.x = Math.round(viewport.x)
      viewport.y = Math.round(viewport.y)
      panZoom?.setViewport(viewport, duration > 0 ? { duration } : undefined)
    },

    'xyflow:setViewportCenter': ({ context }, params: { x: number; y: number }) => {
      const { x, y } = params
      invariant(context.xyflow, 'xyflow is not initialized')
      const zoom = context.xyflow.getZoom()
      context.xyflow.setCenter(Math.round(x), Math.round(y), { zoom })
    },

    'xyflow:setViewport': ({ context }, params: { viewport: Viewport; duration?: number }) => {
      const {
        viewport,
        duration = 350,
      } = params
      const { panZoom } = context.xystore.getState()
      panZoom?.setViewport(viewport, duration > 0 ? { duration } : undefined)
    },

    'xyflow:alignNodeFromToAfterNavigate': ({ context }, params: { fromNode: NodeId; toPosition: XYPoint }) => {
      const xyflow = nonNullable(context.xyflow, 'xyflow is not initialized')
      const elFrom = xyflow.getInternalNode(params.fromNode)
      if (!elFrom) return
      const fromPos = xyflow.flowToScreenPosition({
          x: elFrom.internals.positionAbsolute.x, // + dimensions.width / 2,
          y: elFrom.internals.positionAbsolute.y, // + dimensions.height / 2
        }),
        toPos = xyflow.flowToScreenPosition(params.toPosition),
        diff = {
          x: Math.round(fromPos.x - toPos.x),
          y: Math.round(fromPos.y - toPos.y),
        }
      context.xystore.getState().panBy(diff)
    },
  },
  actors: {
    hotkeyActor: hotkeyActor,
    relationshipsBrowserLogic,
  },
}).createMachine({
  initial: 'initializing',
  context: ({ input }) => ({
    ...input,
    features: { ...AllDisabled },
    initialized: false,
    viewportChangedManually: false,
    lastOnNavigate: null,
    lastClickedNode: null,
    focusedNode: null,
    viewportBeforeFocus: null,
    navigationHistory: {
      currentIndex: 0,
      history: [],
    },
    viewport: { x: 0, y: 0, zoom: 1 },
    xyflow: null,
    overlayActorRef: null,
  }),
  states: {
    initializing: {
      on: {
        'xyflow.init': {
          actions: [
            assign({
              initialized: true,
              xyflow: ({ event }) => event.instance,
              navigationHistory: ({ context, event }) => ({
                currentIndex: 0,
                history: [{
                  viewId: context.view.id,
                  fromNode: null,
                  viewport: { ...event.instance.getViewport() },
                }],
              }),
            }),
            {
              type: 'xyflow:fitDiagram',
              params: { duration: 0 },
            },
          ],
          target: 'idle',
        },
      },
    },
    idle: {
      id: 'idle',
      on: {
        'xyflow.nodeClick': [
          {
            // TODO: xstate fails to infer the type of the guard
            guard: and([
              'enabled: FocusMode' as const,
              or([
                'click: same node' as const,
                'click: selected node ' as const,
              ]),
            ]) as any,
            actions: [
              assign({
                lastClickedNode,
                focusedNode: ({ event }) => event.node.id as NodeId,
              }),
            ],
            target: 'focused',
          },
          {
            actions: assign({
              lastClickedNode,
            }),
          },
        ],
        'xyflow.paneClick': {
          actions: [
            assign({
              lastClickedNode: null,
            }),
          ],
        },
        'xyflow.paneDblClick': {
          actions: 'xyflow:fitDiagram',
        },
      },
    },
    focused: {
      entry: [
        assign(s => ({
          ...focusNodesEdges(s),
          viewportBeforeFocus: { ...s.context.viewport },
        })),
        spawnChild('hotkeyActor', { id: 'hotkey' }),
        {
          type: 'xyflow:fitDiagram',
          params: focusedBounds,
        },
      ],
      on: {
        'xyflow.nodeClick': [
          {
            guard: 'click: focused node',
            target: '#idle',
          },
          {
            actions: [
              assign({
                lastClickedNode,
                focusedNode: ({ event }) => event.node.id as NodeId,
              }),
              assign(focusNodesEdges),
              {
                type: 'xyflow:fitDiagram',
                params: focusedBounds,
              },
            ],
          },
        ],
        'key.esc': {
          target: 'idle',
        },
        'xyflow.paneClick': {
          actions: assign({
            lastClickedNode: null,
          }),
          target: 'idle',
        },
      },
      exit: [
        stopChild('hotkey'),
        enqueueActions(({ enqueue, context }) => {
          if (context.viewportBeforeFocus) {
            enqueue({ type: 'xyflow:setViewport', params: { viewport: context.viewportBeforeFocus } })
          } else {
            enqueue({ type: 'xyflow:fitDiagram' })
          }
          enqueue.assign((s) => ({
            ...unfocusNodesEdges(s),
            viewportBeforeFocus: null,
            focusedNode: null,
          }))
        }),
      ],
    },
    overlay: {
      entry: spawnChild('hotkeyActor', { id: 'hotkey' }),
      initial: 'hole',
      states: {
        hole: {
          target: '#idle',
        },
        relationshipsBrowser: {
          invoke: {
            id: 'relationshipsBrowser',
            src: 'relationshipsBrowserLogic',
            input: ({ context, event }) => {
              assertEvent(event, 'openRelationshipsBrowser')
              return {
                subject: event.fqn,
                scope: context.view,
              }
            },
            onDone: {
              target: '#idle',
            },
          },
          on: {
            // Catch event and do nothing
            'openRelationshipsBrowser': {},
          },
        },
      },
      on: {
        'key.esc': {
          target: 'idle',
        },
      },
      exit: [
        stopChild('hotkey'),
      ],
    },
    // Navigating to a new view (after `navigateTo` event)
    navigating: {
      initial: 'pending',
      type: 'compound',
      states: {
        pending: {
          entry: {
            type: 'trigger:NavigateTo',
            params: ({ context }) => ({
              viewId: nonNullable(context.lastOnNavigate, 'Invalid state, lastOnNavigate is null').toView,
            }),
          },
          on: {
            'update.view': {
              actions: [
                enqueueActions(({ enqueue, context, event }) => {
                  const { fromNode, toNode } = findCorrespondingNode(context, event)
                  if (fromNode && toNode) {
                    enqueue({
                      type: 'xyflow:alignNodeFromToAfterNavigate',
                      params: {
                        fromNode: fromNode.id,
                        toPosition: {
                          x: toNode.position[0],
                          y: toNode.position[1],
                        },
                      },
                    })
                  } else {
                    enqueue({
                      type: 'xyflow:setViewportCenter',
                      params: getBBoxCenter(event.view.bounds),
                    })
                  }
                  enqueue.assign(updateNavigationHistory)
                  enqueue.assign(mergeUpdateViewEvent)
                  enqueue.assign({
                    lastOnNavigate: null,
                  })
                  enqueue.raise({ type: 'fitDiagram' }, { delay: 75 })
                }),
              ],
              target: 'done',
            },
          },
        },
        done: {
          type: 'final',
        },
      },
      onDone: {
        target: 'idle',
        actions: assign({
          lastOnNavigate: null,
        }),
      },
    },
  },
  on: {
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
    'xyflow.viewportMoved': {
      actions: assign({
        viewportChangedManually: (({ event }) => event.manually),
        viewport: (({ event }) => event.viewport),
      }),
    },
    'fitDiagram': {
      actions: {
        type: 'xyflow:fitDiagram',
        params: prop('event'),
      },
    },
    'navigate.to': {
      guard: 'is another view',
      actions: [
        assign({
          lastOnNavigate: ({ context, event }) => ({
            fromView: context.view.id,
            toView: event.viewId,
            fromNode: event.fromNode ?? null,
          }),
        }),
      ],
      target: '.navigating',
    },
    'navigate.back': {
      guard: ({ context }: { context: Context }) => context.navigationHistory.currentIndex > 0,
      actions: assign(navigateBack),
      target: '.navigating',
    },
    'navigate.forward': {
      guard: ({ context }: { context: Context }) =>
        context.navigationHistory.currentIndex < context.navigationHistory.history.length - 1,
      actions: assign(navigateForward),
      target: '.navigating',
    },
    'update.view': {
      actions: [
        assign(updateNavigationHistory),
        enqueueActions(({ enqueue, event, check, context }) => {
          const isAnotherView = check('is another view')
          if (isAnotherView) {
            const { fromNode, toNode } = findCorrespondingNode(context, event)
            if (fromNode && toNode) {
              enqueue({
                type: 'xyflow:alignNodeFromToAfterNavigate',
                params: {
                  fromNode: fromNode.id,
                  toPosition: {
                    x: toNode.position[0],
                    y: toNode.position[1],
                  },
                },
              })
            } else {
              enqueue({
                type: 'xyflow:setViewportCenter',
                params: getBBoxCenter(event.view.bounds),
              })
            }
          }
          if (isAnotherView || !context.viewportChangedManually) {
            enqueue.raise({ type: 'fitDiagram' }, { delay: 75 })
          }
          enqueue.assign(mergeUpdateViewEvent)
          enqueue.assign({
            lastOnNavigate: null,
          })
        }),
      ],
    },
    'update.inputs': {
      actions: assign(({ event }) => ({ ...event.inputs })),
    },
    'update.features': {
      actions: assign({
        features: ({ event }) => event.features,
      }),
    },
    // 'openElementDetails': {
    //   target: '.overlay',
    // },
    'openRelationshipsBrowser': {
      target: '.overlay.relationshipsBrowser',
    },
  },
  exit: log('exit'),
})

const nodeRef = (node: DiagramNode) => DiagramNode.modelRef(node) ?? DiagramNode.deploymentRef(node)
function findCorrespondingNode(context: Context, event: { view: DiagramView }) {
  const fromNodeId = context.lastOnNavigate?.fromNode
  const fromNode = fromNodeId && context.view.nodes.find(n => n.id === fromNodeId)
  const fromRef = fromNode && nodeRef(fromNode)
  const toNode = fromRef && event.view.nodes.find(n => nodeRef(n) === fromRef)
  return { fromNode, toNode }
}

export type Machine = typeof likeC4ViewMachine
export type MachineSnapshot = SnapshotFrom<Machine>
export type LikeC4ViewActorRef = ActorRefFromLogic<Machine>
