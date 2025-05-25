import {
  type BBox,
  type DiagramView,
  type EdgeId,
  type ElementNotation,
  type Fqn,
  type NodeId,
  type StepEdgeId,
  type ViewChange,
  type ViewId,
  type XYPoint,
  DiagramNode,
  getBBoxCenter,
  getParallelStepsPrefix,
  invariant,
  isStepEdgeId,
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
import type { PartialDeep } from 'type-fest'
import {
  type ActorLogicFrom,
  type ActorRef,
  type AnyEventObject,
  type Snapshot,
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
import { MinZoom } from '../base/const'
import { Base } from '../base/types'
import { type EnabledFeatures, type FeatureName, AllDisabled } from '../context/DiagramFeatures'
import type { OpenSourceParams, PaddingWithUnit } from '../LikeC4Diagram.props'
import type { Types } from '../likec4diagram/types'
import { createLayoutConstraints } from '../likec4diagram/useLayoutConstraints'
import { overlaysActorLogic } from '../overlays/overlaysActor'
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
import { type HotKeyEvent, hotkeyActorLogic } from './hotkeyActor'
import { DiagramToggledFeaturesPersistence } from './persistence'
import { type Events as SyncLayoutEvents, syncManualLayoutActorLogic } from './syncManualLayoutActor'
import { findDiagramNode, focusedBounds, typedSystem } from './utils'

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
  xystore: XYStoreApi
  zoomable: boolean
  pannable: boolean
  fitViewPadding: PaddingWithUnit
  nodesSelectable: boolean
}

export type ToggledFeatures = Partial<EnabledFeatures>

export interface Context extends Input {
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
  features: EnabledFeatures
  // This is used to override features from props
  toggledFeatures: ToggledFeatures
  initialized: {
    xydata: boolean
    xyflow: boolean
  }
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

  syncLayoutActorRef: null | ActorRef<Snapshot<unknown>, SyncLayoutEvents, AnyEventObject>

  // If Dynamic View
  activeWalkthrough: null | {
    stepId: StepEdgeId
    parallelPrefix: string | null
  }
}

export type Events =
  | HotKeyEvent
  | { type: 'xyflow.init'; instance: ReactFlowInstance<Types.Node, Types.Edge> }
  | { type: 'xyflow.applyNodeChanges'; changes: NodeChange<Types.Node>[] }
  | { type: 'xyflow.applyEdgeChanges'; changes: EdgeChange<Types.Edge>[] }
  | { type: 'xyflow.viewportMoved'; viewport: Viewport; manually: boolean }
  | { type: 'xyflow.nodeClick'; node: Types.Node }
  | { type: 'xyflow.edgeClick'; edge: Types.Edge }
  | { type: 'xyflow.paneClick' }
  | { type: 'xyflow.paneDblClick' }
  | { type: 'xyflow.resized' }
  | { type: 'xyflow.nodeMouseEnter'; node: Types.Node }
  | { type: 'xyflow.nodeMouseLeave'; node: Types.Node }
  | { type: 'xyflow.edgeMouseEnter'; edge: Types.Edge }
  | { type: 'xyflow.edgeMouseLeave'; edge: Types.Edge }
  | { type: 'update.nodeData'; nodeId: NodeId; data: PartialDeep<Types.NodeData> }
  | { type: 'update.edgeData'; edgeId: EdgeId; data: PartialDeep<Types.EdgeData> }
  | { type: 'update.view'; view: DiagramView; xynodes: Types.Node[]; xyedges: Types.Edge[] }
  | { type: 'update.inputs'; inputs: Partial<Omit<Input, 'view' | 'xystore'>> }
  | { type: 'update.features'; features: EnabledFeatures }
  | { type: 'fitDiagram'; duration?: number; bounds?: BBox }
  | ({ type: 'open.source' } & OpenSourceParams)
  | { type: 'open.elementDetails'; fqn: Fqn; fromNode?: NodeId | undefined }
  | { type: 'open.relationshipDetails'; params: { edgeId: EdgeId } | { source: Fqn; target: Fqn } }
  | { type: 'open.relationshipsBrowser'; fqn: Fqn }
  // | { type: 'close.overlay' }
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
  | { type: 'notations.highlight'; notation: ElementNotation; kind?: string }
  | { type: 'notations.unhighlight' }
  | { type: 'toggle.feature'; feature: FeatureName; forceValue?: boolean }

export type ActionArg = { context: Context; event: Events }

// TODO: naming convention for actors
const _diagramMachine = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    children: {} as {
      syncLayout: 'syncManualLayoutActorLogic'
      hotkey: 'hotkeyActorLogic'
      overlays: 'overlaysActorLogic'
    },
    events: {} as Events,
  },
  actors: {
    syncManualLayoutActorLogic,
    hotkeyActorLogic,
    overlaysActorLogic,
  },
  guards: {
    'isReady': ({ context }) => context.initialized.xydata && context.initialized.xyflow,
    'enabled: FitView': ({ context }) => context.features.enableFitView,
    'enabled: FocusMode': ({ context }) => context.features.enableFocusMode,
    'enabled: Readonly': ({ context }) => context.features.enableReadOnly,
    'enabled: RelationshipDetails': ({ context }) => context.features.enableRelationshipDetails,
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
    'click: selected node': ({ event }) => {
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
    'click: node has connections': ({ context, event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      return context.xyedges.some(e => e.source === event.node.id || e.target === event.node.id)
    },
    'click: selected edge': ({ event }) => {
      assertEvent(event, 'xyflow.edgeClick')
      return event.edge.selected === true || event.edge.data.active === true
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

    'assign lastClickedNode': assign(({ context, event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      return {
        lastClickedNode: lastClickedNode({ context, event }),
      }
    }),

    'open source of focused or last clicked node': enqueueActions(({ context, enqueue }) => {
      const nodeId = context.focusedNode ?? context.lastClickedNode?.id
      if (!nodeId || !context.features.enableVscode) return
      const diagramNode = findDiagramNode(context, nodeId)
      if (!diagramNode) return

      if (DiagramNode.deploymentRef(diagramNode)) {
        enqueue.raise({ type: 'open.source', deployment: DiagramNode.deploymentRef(diagramNode)! })
      } else if (DiagramNode.modelRef(diagramNode)) {
        enqueue.raise({ type: 'open.source', element: DiagramNode.modelRef(diagramNode)! })
      }
    }),

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

    'xyflow:fitFocusedBounds': ({ context }) => {
      const { bounds, duration = 450 } = focusedBounds({ context })
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

      const nodes = nodesToAlign.map(id => ({
        node: nonNullable(nodeLookup.get(id)),
        rect: nonNullable(constraints.rects.get(id)),
      }))
      aligner.computeLayout(nodes.map(({ node }) => toNodeRect(node)))

      for (const { rect, node } of nodes) {
        rect.positionAbsolute = {
          ...rect.positionAbsolute,
          ...aligner.applyPosition(toNodeRect(node)),
        }
      }
      constraints.updateXYFlowNodes()
    },

    'updateFeatures': enqueueActions(({ enqueue, system, event }) => {
      assertEvent(event, 'update.features')
      const { features } = event
      enqueue.assign({
        features: { ...features },
      })

      const enableOverlays = features.enableElementDetails || features.enableRelationshipDetails ||
        features.enableRelationshipBrowser
      const hasRunning = typedSystem(system).overlaysActorRef
      if (enableOverlays && !hasRunning) {
        enqueue.spawnChild('overlaysActorLogic', { id: 'overlays', systemId: 'overlays' })
        return
      }
      if (!enableOverlays && hasRunning) {
        enqueue.sendTo(hasRunning, {
          type: 'close.all',
        })
        enqueue.stopChild('overlays')
      }
    }),

    'closeAllOverlays': sendTo(
      ({ system }) => typedSystem(system).overlaysActorRef!,
      {
        type: 'close.all',
      },
    ),

    'startSyncLayout': assign(({ context, spawn, self }) => ({
      syncLayoutActorRef: spawn('syncManualLayoutActorLogic', {
        id: 'syncLayout',
        input: { parent: self, viewId: context.view.id },
      }),
    })),

    'stopSyncLayout': enqueueActions(({ context, enqueue }) => {
      enqueue.sendTo(context.syncLayoutActorRef!, { type: 'stop' })
      enqueue.stopChild(context.syncLayoutActorRef!)
      enqueue.assign({
        syncLayoutActorRef: null as any,
      })
    }),

    'onNodeMouseEnter': assign(({ context }, params: { node: Types.Node }) => {
      return {
        xynodes: context.xynodes.map(n => {
          if (n.id === params.node.id) {
            return Base.setHovered(n, true)
          }
          return n
        }),
      }
    }),
    'onNodeMouseLeave': assign(({ context }, params: { node: Types.Node }) => {
      return {
        xynodes: context.xynodes.map(n => {
          if (n.id === params.node.id) {
            return Base.setHovered(n, false)
          }
          return n
        }),
      }
    }),
    'onEdgeMouseEnter': assign(({ context }, params: { edge: Types.Edge }) => {
      return {
        xyedges: context.xyedges.map(e => {
          if (e.id === params.edge.id) {
            return Base.setHovered(e, true)
          }
          return e
        }),
      }
    }),
    'onEdgeMouseLeave': assign(({ context }, params: { edge: Types.Edge }) => {
      return {
        xyedges: context.xyedges.map(e => {
          if (e.id === params.edge.id) {
            return Base.setHovered(e, false)
          }
          return e
        }),
      }
    }),
    'notations.highlight': assign(({ context }, params: { notation: ElementNotation; kind?: string }) => {
      const kinds = params.kind ? [params.kind] : params.notation.kinds
      const xynodes = context.xynodes.map((n) => {
        const node = findDiagramNode(context, n.id)
        if (
          node &&
          node.notation === params.notation.title &&
          node.shape === params.notation.shape &&
          node.color === params.notation.color &&
          kinds.includes(node.kind)
        ) {
          return Base.setDimmed(n, false)
        }
        return Base.setDimmed(n, 'immediate')
      })
      return {
        xynodes,
        xyedges: context.xyedges.map(Base.setDimmed('immediate')),
      }
    }),
  },
}).createMachine({
  initial: 'initializing',
  context: ({ input, self, spawn }) => ({
    ...input,
    xyedges: [],
    xynodes: [],
    features: { ...AllDisabled },
    toggledFeatures: DiagramToggledFeaturesPersistence.read() ?? {
      enableReadOnly: true,
    },
    initialized: {
      xydata: false,
      xyflow: false,
    },
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
    syncLayoutActorRef: null,
    activeWalkthrough: null,
  }),
  // entry: ({ spawn }) => spawn(layoutActor, { id: 'layout', input: { parent: self } }),
  states: {
    initializing: {
      on: {
        'xyflow.init': {
          actions: assign(({ context, event }) => ({
            initialized: {
              ...context.initialized,
              xyflow: true,
            },
            xyflow: event.instance,
          })),
          target: 'isReady',
        },
        'update.view': {
          actions: assign(({ context, event, spawn, self }) => ({
            initialized: {
              ...context.initialized,
              xydata: true,
            },
            view: event.view,
            xynodes: event.xynodes,
            xyedges: event.xyedges,
          })),
          target: 'isReady',
        },
      },
    },
    'isReady': {
      always: [{
        guard: 'isReady',
        actions: [
          {
            type: 'xyflow:fitDiagram',
            params: { duration: 0 },
          },
          assign(({ context }) => ({
            navigationHistory: {
              currentIndex: 0,
              history: [{
                viewId: context.view.id,
                fromNode: null,
                viewport: { ...context.xyflow!.getViewport() },
              }],
            },
          })),
          'startSyncLayout',
        ],
        target: 'ready',
      }, {
        target: 'initializing',
      }],
    },
    ready: {
      initial: 'idle',
      on: {
        'navigate.to': {
          guard: 'is another view',
          actions: assign({
            lastOnNavigate: ({ context, event }) => ({
              fromView: context.view.id,
              toView: event.viewId,
              fromNode: event.fromNode ?? null,
            }),
          }),
          target: '#navigating',
        },
        'navigate.back': {
          guard: ({ context }: ActionArg) => context.navigationHistory.currentIndex > 0,
          actions: assign(navigateBack),
          target: '#navigating',
        },
        'navigate.forward': {
          guard: ({ context }: ActionArg) =>
            context.navigationHistory.currentIndex < context.navigationHistory.history.length - 1,
          actions: assign(navigateForward),
          target: '#navigating',
        },
        'layout.align': {
          guard: 'not readonly',
          actions: [
            {
              type: 'layout.align',
              params: ({ event }) => ({ mode: event.mode }),
            },
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
          guard: ({ context }: { context: Context }) =>
            context.features.enableFitView && !context.viewportChangedManually,
          actions: [
            cancel('fitDiagram'),
            raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 200 }),
          ],
        },
        'open.elementDetails': {
          actions: sendTo(({ system }) => typedSystem(system).overlaysActorRef!, ({ context, event }) => {
            let initiatedFrom = null as null | {
              node: NodeId
              clientRect: Rect
            }
            const fromNodeId = event.fromNode ?? context.view.nodes.find(n => DiagramNode.modelRef(n) === event.fqn)?.id
            const internalNode = fromNodeId ? context.xystore.getState().nodeLookup.get(fromNodeId) : null
            if (fromNodeId && internalNode) {
              const nodeRect = nodeToRect(internalNode)
              const zoom = context.xyflow!.getZoom()

              const clientRect = {
                ...context.xyflow!.flowToScreenPosition(nodeRect),
                width: nodeRect.width * zoom,
                height: nodeRect.height * zoom,
              }
              initiatedFrom = {
                node: fromNodeId,
                clientRect,
              }
            }
            return ({
              type: 'open.elementDetails' as const,
              subject: event.fqn,
              currentView: context.view,
              ...(initiatedFrom && { initiatedFrom }),
            })
          }),
        },
        'open.relationshipsBrowser': {
          actions: sendTo(({ system }) => typedSystem(system).overlaysActorRef!, ({ context, event }) => ({
            type: 'open.relationshipsBrowser',
            subject: event.fqn,
            viewId: context.view.id,
            scope: 'view' as const,
            closeable: true,
            enableChangeScope: true,
            enableSelectSubject: true,
          })),
        },
        'open.relationshipDetails': {
          actions: sendTo(({ system }) => typedSystem(system).overlaysActorRef!, ({ context, event }) => ({
            type: 'open.relationshipDetails',
            viewId: context.view.id,
            ...event.params,
          })),
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
        'toggle.feature': {
          actions: assign({
            toggledFeatures: ({ context, event }) => {
              return DiagramToggledFeaturesPersistence.write({
                ...context.toggledFeatures,
                [`enable${event.feature}`]: event.forceValue ??
                  !(context.toggledFeatures[`enable${event.feature}`] ?? context.features[`enable${event.feature}`]),
              })
            },
          }),
        },
        'xyflow.nodeMouseEnter': {
          actions: {
            type: 'onNodeMouseEnter',
            params: prop('event'),
          },
        },
        'xyflow.nodeMouseLeave': {
          actions: {
            type: 'onNodeMouseLeave',
            params: prop('event'),
          },
        },
        'xyflow.edgeMouseEnter': {
          actions: {
            type: 'onEdgeMouseEnter',
            params: prop('event'),
          },
        },
        'xyflow.edgeMouseLeave': {
          actions: {
            type: 'onEdgeMouseLeave',
            params: prop('event'),
          },
        },
        'notations.highlight': {
          actions: {
            type: 'notations.highlight',
            params: prop('event'),
          },
        },
        'notations.unhighlight': {
          actions: assign(({ context }) => ({
            xynodes: context.xynodes.map(Base.setDimmed(false)),
            xyedges: context.xyedges.map(Base.setDimmed(false)),
          })),
        },
        'saveManualLayout.*': {
          guard: 'not readonly',
          actions: sendTo((c) => c.context.syncLayoutActorRef!, ({ event }) => {
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
        cancel('fitDiagram'),
      ],
      states: {
        idle: {
          id: 'idle',
          on: {
            'xyflow.nodeClick': [
              {
                // TODO: xstate fails to infer the type of the guard
                guard: and([
                  'enabled: FocusMode',
                  'click: node has connections',
                  or([
                    'click: same node',
                    'click: selected node',
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
                actions: [
                  'assign lastClickedNode',
                  'open source of focused or last clicked node',
                ],
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
            'focus.node': {
              guard: 'enabled: FocusMode',
              actions: assign({
                focusedNode: ({ event }) => event.nodeId as NodeId,
              }),
              target: 'focused',
            },
            'xyflow.edgeClick': [{
              guard: and([
                'is dynamic view',
                'click: selected edge',
              ]) as any,
              actions: raise(({ event }) => ({
                type: 'walkthrough.start',
                stepId: event.edge.id as StepEdgeId,
              })),
            }, {
              guard: and([
                'enabled: RelationshipDetails',
                'click: selected edge',
              ]) as any,
              actions: sendTo(({ system }) => typedSystem(system).overlaysActorRef!, ({ context, event }) => ({
                type: 'open.relationshipDetails',
                viewId: context.view.id,
                edgeId: event.edge.id as EdgeId,
              })),
            }],
          },
        },
        focused: {
          entry: [
            assign(s => ({
              ...focusNodesEdges(s),
              viewportBeforeFocus: { ...s.context.viewport },
            })),
            'open source of focused or last clicked node',
            spawnChild('hotkeyActorLogic', { id: 'hotkey' }),
            'xyflow:fitFocusedBounds',
          ],
          exit: enqueueActions(({ enqueue, context, event }) => {
            enqueue.stopChild('hotkey')
            if (context.viewportBeforeFocus) {
              enqueue({ type: 'xyflow:setViewport', params: { viewport: context.viewportBeforeFocus } })
            } else {
              enqueue({ type: 'xyflow:fitDiagram' })
            }
            enqueue.assign({
              ...unfocusNodesEdges({ context, event }),
              viewportBeforeFocus: null,
              focusedNode: null,
            })
          }),
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
                  }),
                  raise(({ event }) => ({
                    type: 'focus.node',
                    nodeId: event.node.id as NodeId,
                  })),
                ],
              },
            ],
            'focus.node': {
              actions: [
                assign({
                  focusedNode: ({ event }) => event.nodeId,
                }),
                assign(focusNodesEdges),
                'open source of focused or last clicked node',
                'xyflow:fitFocusedBounds',
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
            'notations.unhighlight': {
              actions: assign(s => ({
                ...focusNodesEdges(s),
              })),
            },
          },
        },
        walkthrough: {
          entry: [
            spawnChild('hotkeyActorLogic', { id: 'hotkey' }),
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
            'xyflow:fitFocusedBounds',
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
                enqueue('xyflow:fitFocusedBounds')
              }),
            },
            'xyflow.edgeClick': {
              actions: [
                assign(({ event, context }) => {
                  if (!isStepEdgeId(event.edge.id) || event.edge.id === context.activeWalkthrough?.stepId) {
                    return {}
                  }
                  return {
                    activeWalkthrough: {
                      stepId: event.edge.id,
                      parallelPrefix: getParallelStepsPrefix(event.edge.id),
                    },
                  }
                }),
                assign(updateActiveWalkthrough),
                'xyflow:fitFocusedBounds',
              ],
            },
            'notations.unhighlight': {
              actions: assign(s => ({
                ...updateActiveWalkthrough(s),
              })),
            },
            'walkthrough.end': {
              target: 'idle',
            },
            'xyflow.paneDblClick': {
              target: 'idle',
            },
            // We received another view, close overlay and process event again
            'update.view': {
              guard: 'is another view',
              actions: raise(({ event }) => event, { delay: 50 }),
              target: 'idle',
            },
          },
          exit: enqueueActions(({ enqueue, context, event }) => {
            enqueue.stopChild('hotkey')
            if (context.viewportBeforeFocus) {
              enqueue({ type: 'xyflow:setViewport', params: { viewport: context.viewportBeforeFocus } })
            } else {
              enqueue({ type: 'xyflow:fitDiagram' })
            }
            enqueue.assign({
              activeWalkthrough: null,
              ...unfocusNodesEdges({ context, event }),
              viewportBeforeFocus: null,
            })
          }),
        },
      },
    },
    // Navigating to another view (after `navigateTo` event)
    navigating: {
      id: 'navigating',
      entry: [
        'closeAllOverlays',
        'stopSyncLayout',
        {
          type: 'trigger:NavigateTo',
          params: ({ context }) => ({
            viewId: nonNullable(context.lastOnNavigate, 'Invalid state, lastOnNavigate is null').toView,
          }),
        },
      ],
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
            enqueue.assign({
              ...mergeXYNodesEdges({ context, event }),
              lastOnNavigate: null,
            })
            enqueue('startSyncLayout')
            enqueue.raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 25 })
          }),
          target: '#idle',
        },
      },
    },
  },
  on: {
    'xyflow.applyNodeChanges': {
      actions: assign({
        xynodes: ({ context, event }) => applyNodeChanges(event.changes, context.xynodes),
      }),
    },
    'xyflow.applyEdgeChanges': {
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
    'update.nodeData': {
      actions: assign(updateNodeData),
    },
    'update.edgeData': {
      actions: assign(updateEdgeData),
    },
    'update.view': {
      actions: [
        assign(updateNavigationHistory),
        enqueueActions(({ enqueue, event, check, context }) => {
          const isAnotherView = check('is another view')
          if (isAnotherView) {
            enqueue('closeAllOverlays')
            enqueue('stopSyncLayout')
            enqueue.assign({
              focusedNode: null,
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
              enqueue.raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 80 })
            } else {
              enqueue({
                type: 'xyflow:setViewportCenter',
                params: getBBoxCenter(event.view.bounds),
              })
              enqueue.raise({ type: 'fitDiagram', duration: 200 }, { id: 'fitDiagram', delay: 25 })
            }
          }
          enqueue.assign({
            ...mergeXYNodesEdges({ context, event }),
            lastOnNavigate: null,
          })
          if (isAnotherView) {
            enqueue('startSyncLayout')
          } else {
            enqueue.sendTo(c => c.context.syncLayoutActorRef!, { type: 'synced' })
            if (!context.viewportChangedManually) {
              enqueue.raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 50 })
            }
          }
        }),
      ],
    },
    'update.inputs': {
      actions: assign(({ event }) => ({ ...event.inputs })),
    },
    'update.features': {
      actions: 'updateFeatures',
    },
  },
  exit: [
    'stopSyncLayout',
    cancel('fitDiagram'),
    stopChild('hotkey'),
    assign({
      xyflow: null,
      xystore: null as any,
      xyedges: [],
      xynodes: [],
      initialized: {
        xydata: false,
        xyflow: false,
      },
      syncLayoutActorRef: null as any,
    }),
  ],
})

const nodeRef = (node: DiagramNode) => DiagramNode.modelRef(node) ?? DiagramNode.deploymentRef(node)
function findCorrespondingNode(context: Context, event: { view: DiagramView }) {
  const fromNodeId = context.lastOnNavigate?.fromNode
  const fromNode = fromNodeId && context.view.nodes.find(n => n.id === fromNodeId)
  const fromRef = fromNode && nodeRef(fromNode)
  const toNode = fromRef && event.view.nodes.find(n => nodeRef(n) === fromRef)
  return { fromNode, toNode }
}

/**
 * Here is a trick to reduce inference types
 */
type InferredDiagramMachine = typeof _diagramMachine
export interface DiagramMachine extends InferredDiagramMachine {}
export const diagramMachine: DiagramMachine = _diagramMachine
export interface DiagramMachineLogic extends ActorLogicFrom<DiagramMachine> {}
