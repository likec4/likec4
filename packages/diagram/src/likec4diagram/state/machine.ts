import {
  type BBox,
  type DiagramView,
  type EdgeId,
  type Fqn,
  type NodeId,
  type RelationId,
  type StepEdgeId,
  type ViewChange,
  type ViewId,
  type XYPoint,
  DiagramNode,
  getBBoxCenter,
  getParallelStepsPrefix,
  invariant,
  nonexhaustive,
  nonNullable,
} from '@likec4/core'
import {
  type ReactFlowInstance,
  applyEdgeChanges,
  applyNodeChanges,
  getViewportForBounds,
  useStoreApi,
} from '@xyflow/react'
import { type EdgeChange, type NodeChange, type Rect, type Viewport, nodeToRect } from '@xyflow/system'
import { clamp, first, hasAtLeast, prop } from 'remeda'
import {
  type ActorRefFromLogic,
  type SnapshotFrom,
  and,
  assertEvent,
  assign,
  cancel,
  enqueueActions,
  or,
  raise,
  sendTo,
  setup,
  spawnChild,
  stopChild,
} from 'xstate'
import { MinZoom } from '../../base/const'
import type { EnabledFeatures } from '../../context'
import { AllDisabled } from '../../context/DiagramFeatures'
import type { OpenSourceParams } from '../../LikeC4Diagram.props'
import { relationshipDetailsActor } from '../../overlays/relationship-details/actor'
import { relationshipsBrowserActor } from '../../overlays/relationships-browser/actor'
import type { Types } from '../types'
import { createLayoutConstraints } from '../useLayoutConstraints'
import { type AlignmentMode, getAligner, toNodeRect } from './aligners'
import {
  focusNodesEdges,
  lastClickedNode,
  mergeXYNodesEdges,
  navigateBack,
  navigateForward,
  resetEdgeControlPoints,
  unfocusNodesEdges,
  updateActiveWalkthrough,
  updateEdgeData,
  updateNavigationHistory,
  updateNodeData,
} from './assign'
import { type HotKeyEvent, hotkeyActor } from './hotkeyActor'
import { syncManualLayoutActor } from './syncManualLayoutActor'
import { focusedBounds } from './utils'

type XYStoreApi = ReturnType<typeof useStoreApi<Types.Node, Types.Edge>>

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

export interface DiagramContext extends Input {
  features: EnabledFeatures
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
  activeElementDetails: null | {
    fqn: Fqn
    fromNode: NodeId | null
    // internal xyflow node rect
    nodeRect?: Rect | null
    // in screen coordinates
    nodeRectScreen?: Rect | null
  }
  viewportBeforeFocus: null | Viewport
  xyflow: ReactFlowInstance<Types.Node, Types.Edge> | null
  syncLayoutActorRef: ActorRefFromLogic<typeof syncManualLayoutActor>

  // If Dynamic View
  activeWalkthrough: null | {
    stepId: StepEdgeId
    parallelPrefix: string | null
  }
}

export namespace DiagramContext {
  export function findDiagramNode(ctx: DiagramContext, xynodeId: string) {
    return ctx.view.nodes.find(n => n.id === xynodeId) ?? null
  }

  export function findDiagramEdge(ctx: DiagramContext, xyedgeId: string) {
    return ctx.view.edges.find(e => e.id === xyedgeId) ?? null
  }
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
  | { type: 'xyflow.resized' }
  | { type: 'update.nodeData'; nodeId: NodeId; data: Partial<Types.NodeData> }
  | { type: 'update.edgeData'; edgeId: EdgeId; data: Partial<Types.Edge['data']> }
  | { type: 'update.view'; view: DiagramView; xynodes: Types.Node[]; xyedges: Types.Edge[] }
  | { type: 'update.inputs'; inputs: Partial<Omit<Input, 'view'>> }
  | { type: 'update.features'; features: EnabledFeatures }
  | { type: 'fitDiagram'; duration?: number; bounds?: BBox }
  | ({ type: 'open.source' } & OpenSourceParams)
  | { type: 'open.elementDetails'; fqn: Fqn; fromNode?: NodeId | undefined }
  | { type: 'open.relationshipDetails'; edgeId: EdgeId }
  | { type: 'open.relationshipsBrowser'; fqn: Fqn }
  | { type: 'close.overlay' }
  | { type: 'navigate.to'; viewId: ViewId; fromNode?: NodeId | undefined }
  | { type: 'navigate.back' }
  | { type: 'navigate.forward' }
  | { type: 'layout.align'; mode: AlignmentMode }
  | { type: 'layout.resetEdgeControlPoints' }
  | { type: 'saveManualLayout.schedule' }
  | { type: 'saveManualLayout.cancel' }
  | { type: 'focus.node'; nodeId: NodeId }
  | { type: 'walkthrough.start'; stepId?: StepEdgeId }
  | { type: 'walkthrough.step'; direction: 'next' | 'previous' }
  | { type: 'walkthrough.end' }

export type ActionArg = { context: DiagramContext; event: Events }

// TODO: naming convention for actors
export const diagramMachine = setup({
  types: {
    context: {} as DiagramContext,
    input: {} as Input,
    children: {} as {
      hotkey: 'hotkeyActor'
      syncLayout: 'syncManualLayoutActor'
      relationshipDetails: 'relationshipDetailsActor'
      relationshipsBrowser: 'relationshipsBrowserActor'
    },
    events: {} as Events,
  },
  actors: {
    hotkeyActor,
    syncManualLayoutActor,
    relationshipsBrowserActor,
    relationshipDetailsActor,
  },
  guards: {
    'enabled: FitView': ({ context }) => context.features.enableFitView,
    'enabled: FocusMode': ({ context }) => context.features.enableFocusMode,
    'enabled: Readonly': ({ context }) => context.features.enableReadOnly,
    'not readonly': ({ context }) => !context.features.enableReadOnly,
    'is dynamic view': ({ context }) => context.view.__ === 'dynamic',
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
    'trigger:OnChange': (_, _params: { change: ViewChange }) => {
      // apply change
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

    'layout.align': ({ context }, params: { mode: AlignmentMode }) => {
      const { mode } = params
      const { xystore } = context
      const { nodeLookup, parentLookup } = xystore.getState()

      const selectedNodes = new Set(nodeLookup.values().filter(n => n.selected).map(n => n.id))
      const nodesToAlign = [...selectedNodes.difference(new Set(parentLookup.keys()))]

      if (!hasAtLeast(nodesToAlign, 2)) {
        console.warn('At least 2 nodes must be selected to align')
        return
      }
      const constraints = createLayoutConstraints(xystore, nodesToAlign)

      const aligner = getAligner(mode)

      constraints.onMove(nodes => {
        aligner.computeLayout(nodes.map(({ node }) => toNodeRect(node)))

        nodes.forEach(({ rect, node }) => {
          rect.positionAbsolute = {
            ...rect.positionAbsolute,
            ...aligner.applyPosition(toNodeRect(node)),
          }
        })
      })
    },
  },
}).createMachine({
  initial: 'initializing',
  context: ({ input, self, spawn }) => ({
    ...input,
    features: { ...AllDisabled },
    initialized: false,
    viewportChangedManually: false,
    lastOnNavigate: null,
    lastClickedNode: null,
    focusedNode: null,
    activeElementDetails: null,
    viewportBeforeFocus: null,
    navigationHistory: {
      currentIndex: 0,
      history: [],
    },
    viewport: { x: 0, y: 0, zoom: 1 },
    xyflow: null,
    syncLayoutActorRef: spawn('syncManualLayoutActor', {
      id: 'syncLayout',
      input: { parent: self, viewId: input.view.id },
    }),
    activeWalkthrough: null,
  }),
  // entry: ({ spawn }) => spawn(layoutActor, { id: 'layout', input: { parent: self } }),
  states: {
    initializing: {
      on: {
        'xyflow.init': {
          actions: enqueueActions(({ enqueue, check }) => {
            enqueue.assign({
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
            })
            if (check('enabled: FitView')) {
              enqueue({
                type: 'xyflow:fitDiagram',
                params: { duration: 0 },
              })
            }
          }),
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
          actions: [
            { type: 'xyflow:fitDiagram' },
            { type: 'trigger:OpenSource', params: ({ context }) => ({ view: context.view.id }) },
          ],
        },
        'saveManualLayout.*': {
          guard: 'not readonly',
          actions: sendTo((c) => c.context.syncLayoutActorRef, ({ event }) => {
            if (event.type === 'saveManualLayout.schedule') {
              return { type: 'sync' }
            }
            if (event.type === 'saveManualLayout.cancel') {
              return { type: 'cancel' }
            }
            nonexhaustive(event)
          }),
        },
        'focus.node': {
          guard: 'enabled: FocusMode',
          actions: assign({
            focusedNode: ({ event }) => event.nodeId as NodeId,
          }),
          target: 'focused',
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
        'focus.node': {
          actions: [
            assign({
              focusedNode: ({ event }) => event.nodeId,
            }),
            assign(focusNodesEdges),
            {
              type: 'xyflow:fitDiagram',
              params: focusedBounds,
            },
          ],
        },
        'key.esc': {
          target: 'idle',
        },
        'xyflow.paneClick': {
          actions: assign({
            lastClickedNode: null,
          }),
          target: 'idle',
        },
        'saveManualLayout.*': {
          guard: 'not readonly',
          actions: sendTo(c => c.context.syncLayoutActorRef, ({ event }) => {
            if (event.type === 'saveManualLayout.schedule') {
              return { type: 'sync' }
            }
            if (event.type === 'saveManualLayout.cancel') {
              return { type: 'cancel' }
            }
            nonexhaustive(event)
          }),
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
        elementDetails: {
          guard: ({ context }: { context: DiagramContext }) => context.activeElementDetails !== null,
          entry: assign({
            activeElementDetails: ({ context }) => {
              const fqn = context.activeElementDetails!.fqn
              const fromNode = context.activeElementDetails!.fromNode
              if (fromNode) {
                const internalNode = nonNullable(
                  context.xystore.getState().nodeLookup.get(fromNode),
                  'XY Internal Node not found',
                )
                const nodeRect = nodeToRect(internalNode)
                const zoom = context.xyflow!.getZoom()

                const nodeRectScreen = {
                  ...context.xyflow!.flowToScreenPosition(nodeRect),
                  width: nodeRect.width * zoom,
                  height: nodeRect.height * zoom,
                }

                return { fqn, fromNode, nodeRect, nodeRectScreen }
              } else {
                return { fqn, fromNode }
              }
            },
          }),
          on: {
            // Catch event and do nothing
            'open.elementDetails': {
              actions: assign({
                activeElementDetails: ({ event, context }) => ({
                  ...context.activeElementDetails,
                  fqn: event.fqn,
                  fromNode: context.activeElementDetails?.fromNode ?? null,
                }),
              }),
            },
            'close.overlay': {
              target: '#idle',
            },
            'key.esc': {
              target: '#idle',
            },
          },
          exit: assign({
            activeElementDetails: null,
          }),
        },
        relationshipsBrowser: {
          invoke: {
            id: 'relationshipsBrowser',
            src: 'relationshipsBrowserActor',
            input: ({ context, event }) => {
              assertEvent(event, 'open.relationshipsBrowser')
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
            'open.relationshipsBrowser': {
              actions: sendTo('relationshipsBrowser', ({ event }) => ({
                type: 'navigate.to',
                subject: event.fqn,
              })),
            },
            'close.overlay': {
              actions: sendTo('relationshipsBrowser', { type: 'close' }),
            },
            'key.esc': {
              actions: sendTo('relationshipsBrowser', { type: 'close' }),
            },
          },
        },
        relationshipDetails: {
          invoke: {
            id: 'relationshipDetails',
            src: 'relationshipDetailsActor',
            input: ({ event, context }) => {
              assertEvent(event, 'open.relationshipDetails')
              return {
                edgeId: event.edgeId,
                view: context.view,
              }
            },
            onDone: {
              target: '#idle',
            },
          },
          on: {
            'close.overlay': {
              actions: sendTo('relationshipDetails', { type: 'close' }),
            },
            'key.esc': {
              actions: sendTo('relationshipDetails', { type: 'close' }),
            },
          },
        },
      },
      on: {
        // We received another view, close overlay and process event again
        'update.view': {
          guard: 'is another view',
          actions: raise(({ event }) => event, { delay: 50 }),
          target: '#idle',
        },
      },
      exit: [
        stopChild('hotkey'),
      ],
    },
    // Navigating to another view (after `navigateTo` event)
    navigating: {
      initial: 'pending',
      type: 'compound',
      states: {
        pending: {
          entry: enqueueActions(({ enqueue }) => {
            enqueue.sendTo(c => c.context.syncLayoutActorRef, { type: 'stop' })
            enqueue.stopChild('layout')
            enqueue({
              type: 'trigger:NavigateTo',
              params: ({ context }) => ({
                viewId: nonNullable(context.lastOnNavigate, 'Invalid state, lastOnNavigate is null').toView,
              }),
            })
          }),
          on: {
            'update.view': {
              actions: enqueueActions(({ enqueue, context, event }) => {
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
                enqueue.assign(mergeXYNodesEdges)
                enqueue.raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 75 })
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
      },
      exit: assign({
        syncLayoutActorRef: ({ self, context, spawn }) =>
          spawn('syncManualLayoutActor', { id: 'syncLayout', input: { parent: self, viewId: context.view.id } }),
        lastOnNavigate: null,
      }),
    },
    walkthrough: {
      entry: [
        spawnChild('hotkeyActor', { id: 'hotkey' }),
        assign({
          viewportBeforeFocus: ({ context }) => context.viewport,
          activeWalkthrough: ({ context, event }) => {
            assertEvent(event, 'walkthrough.start')
            const stepId = event.stepId ?? first(context.xyedges)!.id as StepEdgeId
            return {
              stepId,
              parallelPrefix: getParallelStepsPrefix(stepId),
            }
          },
        }),
        assign(updateActiveWalkthrough),
        {
          type: 'xyflow:fitDiagram',
          params: focusedBounds,
        },
      ],
      on: {
        'key.esc': {
          target: 'idle',
        },
        'key.arrow.left': {
          actions: raise({ type: 'walkthrough.step', direction: 'previous' }),
        },
        'key.arrow.right': {
          actions: raise({ type: 'walkthrough.step', direction: 'next' }),
        },
        'walkthrough.step': {
          actions: enqueueActions(({ enqueue, context, event }) => {
            const { stepId } = context.activeWalkthrough!
            const stepIndex = context.xyedges.findIndex(e => e.id === stepId)
            const nextStepIndex = clamp(event.direction === 'next' ? stepIndex + 1 : stepIndex - 1, {
              min: 0,
              max: context.xyedges.length - 1,
            })
            if (nextStepIndex === stepIndex) {
              return
            }
            const nextStepId = context.xyedges[nextStepIndex]!.id as StepEdgeId
            enqueue.assign({
              activeWalkthrough: {
                stepId: nextStepId,
                parallelPrefix: getParallelStepsPrefix(nextStepId),
              },
            })
            enqueue.assign(updateActiveWalkthrough)
            enqueue({
              type: 'xyflow:fitDiagram',
              params: focusedBounds,
            })
          }),
        },
        'walkthrough.end': {
          target: 'idle',
        },
        // We received another view, close overlay and process event again
        'update.view': {
          guard: 'is another view',
          actions: raise(({ event }) => event, { delay: 50 }),
          target: 'idle',
        },
      },
      exit: enqueueActions(({ enqueue, context }) => {
        enqueue.stopChild('hotkey')
        if (context.viewportBeforeFocus) {
          enqueue({ type: 'xyflow:setViewport', params: { viewport: context.viewportBeforeFocus } })
        } else {
          enqueue({ type: 'xyflow:fitDiagram' })
        }
        enqueue.assign((s) => ({
          activeWalkthrough: null,
          ...unfocusNodesEdges(s),
          viewportBeforeFocus: null,
        }))
      }),
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
      guard: 'enabled: FitView',
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
      guard: ({ context }: ActionArg) => context.navigationHistory.currentIndex > 0,
      actions: assign(navigateBack),
      target: '.navigating',
    },
    'navigate.forward': {
      guard: ({ context }: ActionArg) =>
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
            const viewId = event.view.id
            enqueue.sendTo(c => c.context.syncLayoutActorRef, { type: 'stop' })
            enqueue.stopChild('layout')
            enqueue.assign({
              focusedNode: null,
              syncLayoutActorRef: ({ self, spawn }) =>
                spawn('syncManualLayoutActor', { id: 'syncLayout', input: { parent: self, viewId } }),
            })
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
          } else {
            enqueue.sendTo(c => c.context.syncLayoutActorRef, { type: 'synced' })
          }
          if (isAnotherView || !context.viewportChangedManually) {
            enqueue.raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 90 })
          }
          enqueue.assign(mergeXYNodesEdges)
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
    'update.nodeData': {
      actions: assign(updateNodeData),
    },
    'update.edgeData': {
      actions: assign(updateEdgeData),
    },
    'layout.align': {
      guard: 'not readonly',
      actions: [
        { type: 'layout.align', params: ({ event }) => ({ mode: event.mode }) },
        raise({ type: 'saveManualLayout.schedule' }),
      ],
    },
    'layout.resetEdgeControlPoints': {
      guard: 'not readonly',
      actions: [
        assign(resetEdgeControlPoints),
        raise({ type: 'saveManualLayout.schedule' }),
      ],
    },
    'xyflow.resized': {
      guard: ({ context }: { context: DiagramContext }) =>
        context.features.enableFitView && !context.viewportChangedManually,
      actions: [
        cancel('fitDiagram'),
        raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 200 }),
      ],
    },
    'open.elementDetails': {
      actions: assign({
        activeElementDetails: ({ event, context }) => ({
          fqn: event.fqn,
          fromNode: event.fromNode ?? context.lastClickedNode?.id ?? null,
          fromNodeScreenPosition: null,
        }),
      }),
      target: '.overlay.elementDetails',
    },
    'open.relationshipDetails': {
      target: '.overlay.relationshipDetails',
    },
    'open.relationshipsBrowser': {
      target: '.overlay.relationshipsBrowser',
    },
    'open.source': {
      actions: {
        type: 'trigger:OpenSource',
        params: prop('event'),
      },
    },
    'walkthrough.start': {
      guard: 'is dynamic view',
      target: '.walkthrough',
    },
  },
  exit: [
    stopChild('layout'),
    stopChild('hotkey'),
    assign({
      xyflow: null,
      xystore: null as any,
      initialized: false,
      syncLayoutActorRef: null as any,
    }),
  ],
})

const nodeRef = (node: DiagramNode) => DiagramNode.modelRef(node) ?? DiagramNode.deploymentRef(node)
function findCorrespondingNode(context: DiagramContext, event: { view: DiagramView }) {
  const fromNodeId = context.lastOnNavigate?.fromNode
  const fromNode = fromNodeId && context.view.nodes.find(n => n.id === fromNodeId)
  const fromRef = fromNode && nodeRef(fromNode)
  const toNode = fromRef && event.view.nodes.find(n => nodeRef(n) === fromRef)
  return { fromNode, toNode }
}

export type Machine = typeof diagramMachine
export type MachineSnapshot = SnapshotFrom<Machine>
export type LikeC4ViewActorRef = ActorRefFromLogic<Machine>
