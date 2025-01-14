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
import { getHotkeyHandler } from '@mantine/hooks'
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
  type AnyEventObject,
  type NonReducibleUnknown,
  type SnapshotFrom,
  and,
  assertEvent,
  assign,
  enqueueActions,
  fromCallback,
  or,
  setup,
  stopChild,
} from 'xstate'
import { MinZoom } from '../../base/const'
import type { EnabledFeatures } from '../../context'
import { AllDisabled } from '../../context/DiagramFeatures'
import type { OpenSourceParams } from '../../LikeC4Diagram.props'
import type { Types } from '../types'
import { focusNodesEdges, lastClickedNode, mergeUpdateViewEvent, unfocusNodesEdges } from './assign'
import { focusedBounds } from './utils'

type StoreApi = ReturnType<typeof useStoreApi<Types.Node, Types.Edge>>

type ViewToXYNodesEdges = (view: DiagramView) => { xynodes: Types.Node[]; xyedges: Types.Edge[] }

export type Input = {
  view: DiagramView
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
  xystore: StoreApi
  zoomable: boolean
  pannable: boolean
  fitViewPadding: number
}

export type Context = Readonly<
  Input & {
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
    lastClickedNode: null | {
      id: NodeId
      clicks: number
    }
    focusedNode: NodeId | null
    viewportBeforeFocus: null | Viewport
    // hotkeyActor?: ActorRefFromLogic<typeof hotkeyListener> | null
  }
>

type HotKeyEvent = { type: 'key.esc' | `key.arrow.${'left' | 'right'}` }
const hotkeyListener = fromCallback<AnyEventObject, NonReducibleUnknown, HotKeyEvent>(({ sendBack }: {
  sendBack: (event: HotKeyEvent) => void
}) => {
  const handler = getHotkeyHandler([
    ['Escape', () => sendBack({ type: 'key.esc' }), {
      preventDefault: true,
    }],
    ['ArrowLeft', () => sendBack({ type: 'key.arrow.left' })],
    ['ArrowRight', () => sendBack({ type: 'key.arrow.right' })],
  ])
  document.body.addEventListener('keydown', handler, { capture: true })

  return () => {
    document.body.removeEventListener('keydown', handler, { capture: true })
  }
})

// const xyflowActor = (ctx: { context: Context }) => ctx.context.xyflow!

const nodeRef = (node: DiagramNode) => DiagramNode.modelRef(node) ?? DiagramNode.deploymentRef(node)

export const likeC4ViewMachine = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    children: {} as {
      hotkey: 'hotkeyListener'
      // xyflow: 'xyflowMachine'
    },
    events: {} as
      | HotKeyEvent
      | { type: 'xyflow.init'; instance: ReactFlowInstance<Types.Node, Types.Edge> }
      | { type: 'xyflow.applyNodeChages'; changes: NodeChange<Types.Node>[] }
      | { type: 'xyflow.applyEdgeChages'; changes: EdgeChange<Types.Edge>[] }
      | { type: 'xyflow.viewportMoved'; viewport: Viewport; manually: boolean }
      | { type: 'xyflow.nodeClick'; node: Types.Node }
      | { type: 'xyflow.paneClick' }
      | { type: 'xyflow.paneDblClick' }
      | { type: 'update.view'; view: DiagramView; xynodes: Types.Node[]; xyedges: Types.Edge[] }
      | { type: 'update.inputs'; inputs: Partial<Omit<Input, 'view'>> }
      | { type: 'update.features'; features: EnabledFeatures }
      | { type: 'fitDiagram'; duration?: number; bounds?: BBox }
      | { type: 'openElementDetails'; fqn: Fqn; fromNode?: NodeId }
      | { type: 'navigateTo'; viewId: ViewId; fromNode?: NodeId },
  },
  actions: {
    triggerNavigateTo: (_, _params: { viewId: ViewId }) => {
      // navigate to view
    },
    triggerChangeElementStyle: (_, _change: ViewChange.ChangeElementStyle) => {
    },
    triggerOpenSource: (_, _params: OpenSourceParams) => {
    },

    fitDiagram: ({ context }, params?: { duration?: number; bounds?: BBox }) => {
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

    setViewportCenter: ({ context }, params: { x: number; y: number }) => {
      const { x, y } = params
      invariant(context.xyflow, 'xyflow is not initialized')
      const zoom = context.xyflow.getZoom()
      context.xyflow.setCenter(x, y, { zoom })
    },

    setViewport: ({ context }, params: { viewport: Viewport; duration?: number }) => {
      const {
        viewport,
        duration = 350,
      } = params
      const { panZoom } = context.xystore.getState()
      panZoom?.setViewport(viewport, duration > 0 ? { duration } : undefined)
    },
    alignNodeFromToAfterNavigate: ({ context }, params: { fromNode: NodeId; toPosition: XYPoint }) => {
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
    // updateNodesEdgesFromView: enqueueActions(({ enqueue, context }, params: { view: DiagramView }) => {
    //   enqueue.assign(mergeNodesEdges(context, {
    //     ...context.viewToXYNodesEdges(params.view),
    //     view: params.view,
    //   }))
    // }),
  },
  guards: {
    hasLastOnNavigate: ({ context }) => context.lastOnNavigate !== null,
    enabledFocusMode: ({ context }) => context.features.enableFocusMode,
    isViewportMoved: ({ context }) => context.viewportChangedManually,
    isAnotherView: ({ context, event }) => {
      assertEvent(event, ['update.view', 'navigateTo'])
      if (event.type === 'update.view') {
        return context.view.id !== event.view.id
      }
      if (event.type === 'navigateTo') {
        return context.view.id !== event.viewId
      }
      nonexhaustive(event.type)
    },
    isClickOnSelectedNode: ({ event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      return event.node.selected === true
    },
    isClickOnSameNode: ({ context, event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      return context.lastClickedNode?.id === event.node.id
    },
    isClickOnFocusedNode: ({ context, event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      return context.focusedNode === event.node.id
    },
  },
  actors: {
    hotkeyListener,
    // xyflowMachine: xyflowMachine as ActorLogicFrom<typeof xyflowMachine>,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAYgA8BPAMwBsB7AdwDp0AHVmigOTojAGFs6GLADaABgC6iUKzqxcAF1x18MkGUQB2AEwBGJjoBsAVhMBOLeIAc48zvE6ANCAqI9Npia3W9AZmsjHQAWczCtYIBfSJc0LDxCUkpaRhZ2TgBRaAEhEQlpJBA5BWVVdU0EXR0mPWsI3XE9Iz89MJc3BD0daNiMHAJicmp6ZgA3XDAGOQAnRQBZOlHIfPVipRU1QoqtP2rjM3Ngk12jI3E-dvc9EyMmKxaQ62tzWtMekDj+xJIqJQARXDCaboVArQprUqbUDbHY1LS1Ex6YLBBxnEyXBDmZpeYJGazBLTNF51d6fBKDfDocZQdCKMAAFToYNk8nWZS22i0GJ8JjutXhOj8lh8ei0pL65NIAFdWBBaWAmONJsyiqzIeVtEZzExxBF9OJzq1mkYMR4zjUQuZAsZgq9zOL4gMiEwCOt0DRcAAvAhQIYpZiuxQqiEbDUIPywvxGeFBbwvV4YnQRJimIJWYLWHS+cQ3B1fYguiA0MB+kZMfC8AQezAAa2DatDHPDkejTR0cb0CdciBMOmqcasmczQr8URiHwlTsLxdLqQrfH41bregKLJKjeh7lH2rMuK1-j8JkcGN7tyMKP5R9xQusecl05LyTLrHQhEXuFr9fX7M3nWCuqYcwIyOMJzEaI8Lm7BBgj8cQdXPcQMzqLEx16R1EgfWdmBfQg-gAIxod9PykVYGx-DQt3MXlrBvRooyCJ5ggxPwWKYDMLA8dtcX-bpxzJKcqDoTApVgSAsPLSsiLrEjwTIqEKMxUVDFCQ4sVMFEMSMVoam8fEtV1EdeLQ-NnUE4TRIgcT5yrD9l1XVVv3kioEKYJ4kzqGxmkaJioIjODBWRJEnijRE9DvAShJEsSazACgmDgTAvzZJzEBeLRlLCUJThMDSoNObVTB8CMrXxGijHCjCzKiyyn1SHCbOI+yQ3IiowPSy1VOy3KOgaHSfB0MCtW8W0KoLSlqVpH0SAgVQFVgRR5SYfiMPG3AaWUfAoCS9UmzajLOvU5woJ8dr+WuWMo2MUbnVW9afSYVgwHwCApplOU6UVCYGG2jcFLOAwtPhDNTi6UGMVsYJALxKwwKRflePHaz4EKZbiFIxywwG006h0tNdBUsITGul18DdD1vU29HkrDLQuV8zs7lHCN-Dxfk-GJ3AizAKmdt-OHeRKkIPEOf7rE0rNDAcE4uixIUib4ydKsiiyed+ip-H81NrlCXUrxPdsoeQ2CMyTK6FfQsaqTWybKdkjGmxaAqtDUy9bWjHyeqU3E6muEUIy04nbptqAHqel7bbXamHejFNnZBuocqaCJwZzHVdVp7XzzqdnzZM8srbuzamBmwhVZa7RESYIUczOWCwhzD3EEzdrvFpw8L0OMdoiAA */
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
    viewport: { x: 0, y: 0, zoom: 1 },
    xyflow: null,
  }),
  states: {
    initializing: {
      on: {
        'xyflow.init': {
          actions: [
            assign({
              initialized: true,
              xyflow: ({ event }) => event.instance,
            }),
            {
              type: 'fitDiagram',
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
              'enabledFocusMode',
              or(['isClickOnSameNode', 'isClickOnSelectedNode']),
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
          actions: 'fitDiagram',
        },
      },
    },
    focused: {
      entry: [
        assign(s => ({
          ...focusNodesEdges(s),
          hotkeyActor: s.spawn('hotkeyListener', { id: 'hotkey' }),
          viewportBeforeFocus: s.context.viewportBeforeFocus ?? { ...s.context.viewport },
        })),
        {
          type: 'fitDiagram',
          params: focusedBounds,
        },
      ],
      on: {
        'xyflow.nodeClick': [
          {
            guard: 'isClickOnFocusedNode',
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
                type: 'fitDiagram',
                params: focusedBounds,
              },
            ],
          },
        ],
        'key.esc': {
          target: 'idle',
        },
        'xyflow.paneClick': {
          target: 'idle',
        },
      },
      exit: [
        stopChild('hotkey'),
        enqueueActions(({ enqueue, context }) => {
          if (context.viewportBeforeFocus) {
            enqueue({ type: 'setViewport', params: { viewport: context.viewportBeforeFocus } })
          } else {
            enqueue({ type: 'fitDiagram' })
          }
        }),
        assign((s) => ({
          ...unfocusNodesEdges(s),
          hotkeyActor: null,
          focusedNode: null,
          lastClickedNode: null,
        })),
      ],
    },
    // Navigating to a new view (after `navigateTo` event)
    navigating: {
      initial: 'pending',
      type: 'compound',
      states: {
        pending: {
          entry: {
            type: 'triggerNavigateTo',
            params: ({ context }) => ({
              viewId: nonNullable(context.lastOnNavigate, 'Invalid state, lastOnNavigate is null').toView,
            }),
          },
          on: {
            'update.view': {
              actions: enqueueActions(({ enqueue, context, system, event }) => {
                const fromNodeId = context.lastOnNavigate?.fromNode
                const fromNode = fromNodeId && context.view.nodes.find(n => n.id === fromNodeId)
                const fromRef = fromNode && nodeRef(fromNode)
                const toNode = fromRef && event.view.nodes.find(n => nodeRef(n) === fromRef)
                if (fromNode && toNode) {
                  system._logger('alignNodeFromToAfterNavigate', { fromNode, toNode })
                  enqueue({
                    type: 'alignNodeFromToAfterNavigate',
                    params: {
                      fromNode: fromNodeId,
                      toPosition: {
                        x: toNode.position[0],
                        y: toNode.position[1],
                      },
                    },
                  })
                } else {
                  system._logger('setViewportCenter')
                  enqueue({
                    type: 'setViewportCenter',
                    params: getBBoxCenter(event.view.bounds),
                  })
                }
                enqueue.assign(mergeUpdateViewEvent)
                enqueue.assign({
                  lastOnNavigate: null,
                })
                enqueue.raise({ type: 'fitDiagram' }, { delay: 75 })
              }),
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
        type: 'fitDiagram',
        params: prop('event'),
      },
    },
    'navigateTo': {
      guard: 'isAnotherView',
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
    'update.view': {
      actions: enqueueActions(({ enqueue, context, event }) => {
        const isSameView = context.view.id === event.view.id
        enqueue.assign(mergeUpdateViewEvent)
        if (isSameView && context.viewportChangedManually) {
          return
        }
        if (!isSameView) {
          enqueue({
            type: 'setViewportCenter',
            params: getBBoxCenter(event.view.bounds),
          })
        }
        enqueue.raise({ type: 'fitDiagram' }, { delay: 75 })
      }),
    },
    'update.inputs': {
      actions: assign(({ event }) => ({ ...event.inputs })),
    },
    'update.features': {
      actions: assign({
        features: ({ event }) => event.features,
      }),
    },
  },
})

export type Logic = typeof likeC4ViewMachine
export type State = SnapshotFrom<typeof likeC4ViewMachine>
