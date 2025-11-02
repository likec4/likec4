// oxlint-disable no-floating-promises
import {
  BBox,
  getParallelStepsPrefix,
  invariant,
  isStepEdgeId,
  nonexhaustive,
  nonNullable,
} from '@likec4/core'
import type {
  DiagramEdge,
  DiagramNode,
  DiagramView,
  DynamicViewDisplayVariant,
  EdgeId,
  Fqn,
  LayoutType,
  NodeId,
  NodeNotation as ElementNotation,
  StepEdgeId,
  ViewChange,
  ViewId,
  XYPoint,
} from '@likec4/core/types'
import {
  applyEdgeChanges,
  applyNodeChanges,
  getViewportForBounds,
} from '@xyflow/react'
import { type EdgeChange, type NodeChange, type Rect, type Viewport, nodeToRect } from '@xyflow/system'
import { produce } from 'immer'
import type { MouseEvent } from 'react'
import { clamp, first, hasAtLeast, omit, prop } from 'remeda'
import type { PartialDeep } from 'type-fest'
import {
  and,
  assertEvent,
  assign,
  cancel,
  emit,
  enqueueActions,
  or,
  raise,
  sendTo,
  setup,
  spawnChild,
  stopChild,
} from 'xstate'
import { Base, MinZoom } from '../../base'
import { type EnabledFeatures, type FeatureName, DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import type { OpenSourceParams, ViewPadding } from '../../LikeC4Diagram.props'
import { overlaysActorLogic } from '../../overlays/overlaysActor'
import { searchActorLogic } from '../../search/searchActor'
import type { Types } from '../types'
import { createLayoutConstraints } from '../useLayoutConstraints'
import { SeqParallelAreaColor } from '../xyflow-sequence/const'
import { type AlignmentMode, getAligner, toNodeRect } from './aligners'
import {
  focusNodesEdges,
  lastClickedNode,
  mergeXYNodesEdges,
  navigateBack,
  navigateForward,
  resetEdgeControlPoints,
  resetEdgesControlPoints,
  updateActiveWalkthrough,
  updateEdgeData,
  updateNavigationHistory,
  updateNodeData,
} from './assign'
import { type HotKeyEvent, hotkeyActorLogic } from './hotkeyActor'
import { DiagramToggledFeaturesPersistence } from './persistence'
import { syncManualLayoutActorLogic } from './syncManualLayoutActor'
import {
  activeSequenceBounds,
  createViewChange,
  findDiagramEdge,
  findDiagramNode,
  focusedBounds,
  typedSystem,
} from './utils'

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
  fitViewPadding: ViewPadding
  dynamicViewVariant?: DynamicViewDisplayVariant | undefined
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
  viewportOnManualLayout: null | Viewport
  viewportOnAutoLayout: null | Viewport
  xyflow: XYFlowInstance | null

  // If Dynamic View
  dynamicViewVariant: DynamicViewDisplayVariant
  activeWalkthrough: null | {
    stepId: StepEdgeId
    parallelPrefix: string | null
  }
}

export type Events =
  | HotKeyEvent
  | { type: 'xyflow.init'; instance: XYFlowInstance }
  | { type: 'xyflow.applyNodeChanges'; changes: NodeChange<Types.Node>[] }
  | { type: 'xyflow.applyEdgeChanges'; changes: EdgeChange<Types.Edge>[] }
  | { type: 'xyflow.viewportMoved'; viewport: Viewport; manually: boolean }
  | { type: 'xyflow.nodeClick'; node: Types.Node }
  | { type: 'xyflow.edgeClick'; edge: Types.Edge }
  | { type: 'xyflow.edgeDoubleClick'; edge: Types.Edge }
  | { type: 'xyflow.paneClick' }
  | { type: 'xyflow.paneDblClick' }
  | { type: 'xyflow.resized' }
  | { type: 'xyflow.nodeMouseEnter'; node: Types.Node }
  | { type: 'xyflow.nodeMouseLeave'; node: Types.Node }
  | { type: 'xyflow.edgeMouseEnter'; edge: Types.Edge; event: MouseEvent }
  | { type: 'xyflow.edgeMouseLeave'; edge: Types.Edge; event: MouseEvent }
  | { type: 'xyflow.edgeEditingStarted'; edge: Types.EdgeData }
  | { type: 'update.nodeData'; nodeId: NodeId; data: PartialDeep<Types.NodeData> }
  | { type: 'update.edgeData'; edgeId: EdgeId; data: PartialDeep<Types.EdgeData> }
  | { type: 'update.view'; view: DiagramView; xynodes: Types.Node[]; xyedges: Types.Edge[] }
  | { type: 'update.inputs'; inputs: Partial<Omit<Input, 'view' | 'xystore' | 'dynamicViewVariant'>> }
  | { type: 'update.features'; features: EnabledFeatures }
  | { type: 'fitDiagram'; duration?: number; bounds?: BBox }
  | ({ type: 'open.source' } & OpenSourceParams)
  | { type: 'open.elementDetails'; fqn: Fqn; fromNode?: NodeId | undefined }
  | { type: 'open.relationshipDetails'; params: { edgeId: EdgeId } | { source: Fqn; target: Fqn } }
  | { type: 'open.relationshipsBrowser'; fqn: Fqn }
  | { type: 'open.search'; search?: string }
  // | { type: 'close.overlay' }
  | { type: 'navigate.to'; viewId: ViewId; fromNode?: NodeId | undefined }
  | { type: 'navigate.back' }
  | { type: 'navigate.forward' }
  | { type: 'layout.align'; mode: AlignmentMode }
  | { type: 'layout.resetEdgeControlPoints' }
  | { type: 'layout.resetManualLayout' }
  | { type: 'saveManualLayout.schedule' }
  // | { type: 'saveManualLayout.force' }
  | { type: 'saveManualLayout.pause' }
  | { type: 'saveManualLayout.resume' }
  | { type: 'saveManualLayout.cancel' }
  | { type: 'focus.node'; nodeId: NodeId }
  | { type: 'switch.dynamicViewVariant'; variant: DynamicViewDisplayVariant }
  | { type: 'walkthrough.start'; stepId?: StepEdgeId }
  | { type: 'walkthrough.step'; direction: 'next' | 'previous' }
  | { type: 'walkthrough.end' }
  | { type: 'notations.highlight'; notation: ElementNotation; kind?: string }
  | { type: 'notations.unhighlight' }
  | { type: 'tag.highlight'; tag: string }
  | { type: 'tag.unhighlight' }
  | { type: 'toggle.feature'; feature: FeatureName; forceValue?: boolean }
  | { type: 'emit.onChange'; change: ViewChange }
  | { type: 'emit.onLayoutTypeChange'; layoutType: LayoutType }

export type EmittedEvents =
  | { type: 'initialized'; instance: XYFlowInstance }
  | { type: 'navigateTo'; viewId: ViewId }
  | { type: 'openSource'; params: OpenSourceParams }
  | { type: 'paneClick' }
  | { type: 'nodeClick'; node: DiagramNode; xynode: Types.Node }
  | { type: 'edgeClick'; edge: DiagramEdge; xyedge: Types.Edge }
  | { type: 'edgeMouseEnter'; edge: Types.Edge; event: MouseEvent }
  | { type: 'edgeMouseLeave'; edge: Types.Edge; event: MouseEvent }
  | { type: 'edgeEditingStarted'; edge: Types.Edge }
  | { type: 'walkthroughStarted'; edge: Types.Edge }
  | { type: 'walkthroughStep'; edge: Types.Edge }
  | { type: 'walkthroughStopped' }
  | { type: 'onChange'; change: ViewChange }
  | { type: 'onLayoutTypeChange'; layoutType: LayoutType }

export type ActionArg = { context: Context; event: Events }

const isReadOnly = (context: Context) =>
  (context.features.enableReadOnly || context.toggledFeatures.enableReadOnly === true) &&
  (context.view._type !== 'dynamic' || context.dynamicViewVariant !== 'sequence')

// TODO: naming convention for actors
const machine = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    children: {} as {
      syncLayout: 'syncManualLayoutActorLogic'
      hotkey: 'hotkeyActorLogic'
      overlays: 'overlaysActorLogic'
      search: 'searchActorLogic'
    },
    events: {} as Events,
    emitted: {} as EmittedEvents,
  },
  actors: {
    syncManualLayoutActorLogic,
    hotkeyActorLogic,
    overlaysActorLogic,
    searchActorLogic,
  },
  guards: {
    'isReady': ({ context }) => context.initialized.xydata && context.initialized.xyflow,
    'enabled: FitView': ({ context }) => context.features.enableFitView,
    'enabled: FocusMode': ({ context }) =>
      ((context.toggledFeatures.enableFocusMode ?? context.features.enableFocusMode) === true) &&
      isReadOnly(context),
    'enabled: Readonly': ({ context }) => isReadOnly(context),
    'enabled: RelationshipDetails': ({ context }) => context.features.enableRelationshipDetails,
    'enabled: Search': ({ context }) => context.features.enableSearch,
    'enabled: ElementDetails': ({ context }) => context.features.enableElementDetails,
    'enabled: DynamicViewWalkthrough': ({ context }) =>
      isReadOnly(context) && context.features.enableDynamicViewWalkthrough,
    'not readonly': ({ context }) => !isReadOnly(context),
    'is dynamic view': ({ context }) => context.view._type === 'dynamic',
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
    'click: node has modelFqn': ({ event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      return 'modelFqn' in event.node.data
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
      assertEvent(event, ['xyflow.edgeClick', 'xyflow.edgeDoubleClick'])
      return event.edge.selected === true || event.edge.data.active === true
    },
  },
  actions: {
    'trigger:NavigateTo': emit(({ context }) => ({
      type: 'navigateTo',
      viewId: nonNullable(context.lastOnNavigate, 'Invalid state, lastOnNavigate is null').toView,
    })),
    'assign lastClickedNode': assign(({ context, event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      return {
        lastClickedNode: lastClickedNode({ context, event }),
      }
    }),
    'assign: focusedNode': assign(({ event }) => {
      let focusedNode
      switch (event.type) {
        case 'xyflow.nodeClick':
          focusedNode = event.node.data.id
          break
        case 'focus.node':
          focusedNode = event.nodeId
          break
        default:
          throw new Error(`Unexpected event type: ${event.type} in action 'assign: focusedNode'`)
      }
      return {
        focusedNode,
      }
    }),
    'reset lastClickedNode': assign(() => ({
      lastClickedNode: null,
    })),

    'open source of focused or last clicked node': enqueueActions(({ context, enqueue }) => {
      const nodeId = context.focusedNode ?? context.lastClickedNode?.id
      if (!nodeId || !context.features.enableVscode) return
      const diagramNode = findDiagramNode(context, nodeId)
      if (!diagramNode) return

      if (diagramNode.deploymentRef) {
        enqueue.raise({ type: 'open.source', deployment: diagramNode.deploymentRef })
      } else if (diagramNode.modelRef) {
        enqueue.raise({ type: 'open.source', element: diagramNode.modelRef })
      }
    }),

    'xyflow:fitDiagram': ({ context, event }, params?: { duration?: number; bounds?: BBox }) => {
      params ??= event.type === 'fitDiagram' ? event : {}
      const {
        bounds = context.view.bounds,
        duration = 450,
      } = params
      const { width, height, panZoom, transform } = nonNullable(context.xystore).getState()

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
      panZoom?.setViewport(viewport, duration > 0 ? { duration, interpolate: 'smooth' } : undefined).catch(
        console.error,
      )
    },

    'xyflow:fitFocusedBounds': ({ context }) => {
      const isActiveSequenceWalkthrough = !!context.activeWalkthrough && context.dynamicViewVariant === 'sequence'
      const { bounds, duration = 450 } = isActiveSequenceWalkthrough
        ? activeSequenceBounds({ context })
        : focusedBounds({ context })
      const { width, height, panZoom, transform } = nonNullable(context.xystore).getState()

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
      panZoom?.setViewport(viewport, duration > 0 ? { duration, interpolate: 'smooth' } : undefined)
    },

    'xyflow:setViewportCenter': ({ context, event }, params?: { x: number; y: number }) => {
      let center: XYPoint
      if (params) {
        center = params
      } else {
        assertEvent(event, 'update.view')
        center = BBox.center(event.view.bounds)
      }
      invariant(context.xyflow, 'xyflow is not initialized')
      const zoom = context.xyflow.getZoom()
      context.xyflow.setCenter(Math.round(center.x), Math.round(center.y), { zoom })
    },

    'xyflow:setViewport': ({ context }, params: { viewport: Viewport; duration?: number }) => {
      const {
        viewport,
        duration = 350,
      } = params
      const panZoom = context.xystore?.getState().panZoom
      panZoom?.setViewport(viewport, duration > 0 ? { duration, interpolate: 'smooth' } : undefined)
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
      context.xystore!.getState().panBy(diff)
    },

    'layout.align': ({ context }, params: { mode: AlignmentMode }) => {
      const { mode } = params
      const xystore = nonNullable(context.xystore, 'xystore is not initialized')
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
      constraints.updateXYFlow()
    },
    'ensure overlays actor state': enqueueActions(({ enqueue, context: { features }, system }) => {
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
    'ensure search actor state': enqueueActions(({ enqueue, context: { features: { enableSearch } }, system }) => {
      const hasRunning = typedSystem(system).searchActorRef
      if (enableSearch && !hasRunning) {
        enqueue.spawnChild('searchActorLogic', { id: 'search', systemId: 'search' })
        return
      }
      if (!enableSearch && hasRunning) {
        enqueue.sendTo(hasRunning, {
          type: 'close',
        })
        enqueue.stopChild('search')
      }
    }),
    'updateFeatures': assign(({ event }) => {
      assertEvent(event, 'update.features')
      return {
        features: { ...event.features },
      }
    }),
    'updateInputs': assign(({ event }) => {
      assertEvent(event, 'update.inputs')
      return { ...event.inputs }
    }),
    'update XYNodesEdges': assign(({ context, event }) => {
      assertEvent(event, 'update.view')

      return {
        ...mergeXYNodesEdges({ context, event }),
        lastClickedNode: null,
      }
    }),
    'closeSearch': sendTo(
      ({ system }) => typedSystem(system).searchActorRef!,
      {
        type: 'close',
      },
    ),
    'closeAllOverlays': sendTo(
      ({ system }) => typedSystem(system).overlaysActorRef!,
      {
        type: 'close.all',
      },
    ),

    'stopSyncLayout': enqueueActions(({ enqueue, system }) => {
      const syncLayoutActor = typedSystem(system).syncLayoutActorRef
      if (!syncLayoutActor) return
      enqueue.stopChild(syncLayoutActor)
    }),

    'startSyncLayout': enqueueActions(({ context, enqueue, system, self }) => {
      const syncLayoutActor = typedSystem(system).syncLayoutActorRef
      if (syncLayoutActor) {
        enqueue.stopChild(syncLayoutActor)
      }
      enqueue.spawnChild('syncManualLayoutActorLogic', {
        id: 'syncLayout',
        systemId: 'syncLayout',
        input: {
          parent: self,
          viewId: context.view.id,
        },
        syncSnapshot: true,
      })
    }),

    'delegate to syncLayoutActor': enqueueActions(({ system, enqueue, event }) => {
      const syncLayoutActor = typedSystem(system).syncLayoutActorRef
      if (!syncLayoutActor) {
        console.warn('syncLayoutActor is not running')
        return
      }
      switch (event.type) {
        case 'saveManualLayout.schedule': {
          enqueue.sendTo(syncLayoutActor, { type: 'sync' })
          break
        }
        case 'saveManualLayout.pause': {
          enqueue.sendTo(syncLayoutActor, { type: 'pause' })
          break
        }
        case 'saveManualLayout.resume': {
          enqueue.sendTo(syncLayoutActor, { type: 'resume' })
          break
        }
        case 'saveManualLayout.cancel': {
          enqueue.sendTo(syncLayoutActor, { type: 'cancel' })
          break
        }
        default: {
          console.warn(`Unexpected event type: ${event.type} in action 'delegate to syncLayoutActor'`)
          break
        }
      }
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
    'onEdgeMouseEnter': enqueueActions(({ enqueue, context, event }) => {
      assertEvent(event, 'xyflow.edgeMouseEnter')
      let edge = event.edge
      enqueue.assign({
        xyedges: context.xyedges.map(e => {
          if (e.id === event.edge.id) {
            // Set hovered state (will be used in emitted event)
            edge = Base.setHovered(e, true)
            return edge
          }
          return e
        }),
      })
      enqueue.emit({
        type: 'edgeMouseEnter',
        edge,
        event: event.event,
      })
    }),
    'onEdgeMouseLeave': enqueueActions(({ enqueue, context, event }) => {
      assertEvent(event, 'xyflow.edgeMouseLeave')
      let edge = event.edge
      enqueue.assign({
        xyedges: context.xyedges.map(e => {
          if (e.id === event.edge.id) {
            edge = Base.setHovered(e, false)
            return edge
          }
          return e
        }),
      })
      enqueue.emit({
        type: 'edgeMouseLeave',
        edge,
        event: event.event,
      })
    }),
    'focus on nodes and edges': assign(focusNodesEdges),
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
    'tag.highlight': assign(({ context, event }) => {
      assertEvent(event, 'tag.highlight')
      return {
        xynodes: context.xynodes.map((n) => {
          if (n.data.tags?.includes(event.tag)) {
            return Base.setDimmed(n, false)
          }
          return Base.setDimmed(n, true)
        }),
      }
    }),
    'undim everything': assign(({ context }) => ({
      xynodes: context.xynodes.map(Base.setDimmed(false)),
      xyedges: context.xyedges.map(Base.setData({
        dimmed: false,
        active: false,
      })),
    })),
    'update active walkthrough': assign(updateActiveWalkthrough),
    'open element details': enqueueActions(
      ({ context, event, self, enqueue, system }, params?: { fqn: Fqn; fromNode?: NodeId | undefined }) => {
        // sendTo(
        //   ({ system }) => typedSystem(system).overlaysActorRef!,
        //   ({ context, event, self }, params?: { fqn: Fqn; fromNode?: NodeId | undefined }) => {
        let initiatedFrom = null as null | {
          node: NodeId
          clientRect: Rect
        }
        let fromNodeId: NodeId | undefined, subject: Fqn
        // Use from params if available
        if (params) {
          subject = params.fqn
          fromNodeId = params.fromNode ?? context.view.nodes.find(n => n.modelRef === params.fqn)?.id
        }
        // Use from event if available
        else if (event.type === 'xyflow.nodeClick') {
          if (!('modelFqn' in event.node.data) || !event.node.data.modelFqn) {
            console.warn('No modelFqn in clicked node data')
            return
          }
          subject = event.node.data.modelFqn
          fromNodeId = event.node.data.id
        }
        else if (event.type === 'open.elementDetails') {
          subject = event.fqn
          fromNodeId = event.fromNode
        }
        // Use from lastClickedNode if available
        else {
          invariant(context.lastClickedNode, 'No last clicked node')
          fromNodeId = nonNullable(context.lastClickedNode).id
          const node = nonNullable(context.xynodes.find(n => n.id === fromNodeId))
          invariant('modelFqn' in node.data && !!node.data.modelFqn, 'No modelFqn in last clicked node')
          subject = node.data.modelFqn
        }

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

        enqueue.sendTo(
          typedSystem(system).overlaysActorRef!,
          {
            type: 'open.elementDetails' as const,
            subject,
            currentView: context.view,
            ...(initiatedFrom && { initiatedFrom }),
            openSourceActor: self,
          },
        )
      },
    ),
    'toggle feature': assign(({ context, event }) => {
      assertEvent(event, 'toggle.feature')
      const currentValue = context.toggledFeatures[`enable${event.feature}`] ??
        context.features[`enable${event.feature}`]
      const nextValue = event.forceValue ?? !currentValue

      return {
        toggledFeatures: {
          ...context.toggledFeatures,
          [`enable${event.feature}`]: nextValue,
        },
      }
    }),
    'emit: walkthroughStarted': emit(({ context }) => {
      const edge = context.xyedges.find(x => x.id === context.activeWalkthrough?.stepId)
      invariant(edge, 'Invalid walkthrough state')
      return {
        type: 'walkthroughStarted',
        edge,
      }
    }),
    'emit: walkthroughStep': emit(({ context }) => {
      const edge = context.xyedges.find(x => x.id === context.activeWalkthrough?.stepId)
      invariant(edge, 'Invalid walkthrough state')
      return {
        type: 'walkthroughStep',
        edge,
      }
    }),
    'emit: walkthroughStopped': emit(() => ({
      type: 'walkthroughStopped',
    })),
    'emit: edgeEditingStarted': emit(({ context, event }) => {
      assertEvent(event, 'xyflow.edgeEditingStarted')
      const edge = nonNullable(context.xyedges.find(x => x.id === event.edge.id), `Edge ${event.edge.id} not found`)
      return ({
        type: 'edgeEditingStarted',
        edge,
      })
    }),
    'emit: paneClick': emit(() => ({
      type: 'paneClick',
    })),
    'emit: nodeClick': emit(({ context, event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      const node = nonNullable(findDiagramNode(context, event.node.id), `Node ${event.node.id} not found in diagram`)
      return {
        type: 'nodeClick',
        node,
        xynode: event.node,
      }
    }),
    'emit: edgeClick': emit(({ context, event }) => {
      assertEvent(event, 'xyflow.edgeClick')
      const edge = nonNullable(findDiagramEdge(context, event.edge.id), `Edge ${event.edge.id} not found in diagram`)
      return {
        type: 'edgeClick',
        edge,
        xyedge: event.edge,
      }
    }),
    'emit: initialized': emit(({ context }) => {
      invariant(context.xyflow, 'XYFlow instance not found')
      return {
        type: 'initialized',
        instance: context.xyflow,
      }
    }),
    'emit: openSource': emit((_, _params: OpenSourceParams) => ({
      type: 'openSource',
      params: _params,
    })),
    'assign: dynamicViewVariant': assign(({ event }) => {
      assertEvent(event, 'switch.dynamicViewVariant')
      return {
        dynamicViewVariant: event.variant,
      }
    }),
  },
})

const initializing = machine.createStateConfig({
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
      actions: assign(({ context, event }) => ({
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
})

const disableCompareWithLatest = machine.createAction(
  assign(({ context }) => {
    return {
      toggledFeatures: context.toggledFeatures.enableCompareWithLatest
        ? omit(context.toggledFeatures, ['enableCompareWithLatest'])
        : context.toggledFeatures,
      viewportOnAutoLayout: null,
      viewportOnManualLayout: null,
    }
  }),
)

// Navigating to another view (after `navigateTo` event)
const navigating = machine.createStateConfig({
  id: 'navigating',
  entry: [
    'closeAllOverlays',
    'closeSearch',
    'stopSyncLayout',
    'trigger:NavigateTo',
  ],
  on: {
    'update.view': {
      actions: enqueueActions(({ enqueue, context, event }) => {
        const { fromNode, toNode } = findCorrespondingNode(context, event)
        if (fromNode && toNode) {
          enqueue({
            type: 'xyflow:alignNodeFromToAfterNavigate',
            params: {
              fromNode: fromNode.id as NodeId,
              toPosition: {
                x: toNode.data.x,
                y: toNode.data.y,
              },
            },
          })
        } else {
          enqueue('xyflow:setViewportCenter')
        }
        enqueue.assign(updateNavigationHistory)
        enqueue(disableCompareWithLatest)
        enqueue('update XYNodesEdges')
        enqueue('startSyncLayout')
        enqueue.raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 25 })
      }),
      target: '#idle',
    },
  },
})

const onEdgeDoubleClick = machine.createAction(
  assign(({ context, event }) => {
    assertEvent(event, 'xyflow.edgeDoubleClick')
    if (!event.edge.data.controlPoints) {
      return {}
    }
    const { nodeLookup } = context.xystore.getState()
    return {
      xyedges: context.xyedges.map(e => {
        if (e.id === event.edge.id) {
          return produce(e, draft => {
            const cp = resetEdgeControlPoints(nodeLookup, e)
            draft.data.controlPoints = cp
            if (hasAtLeast(cp, 1) && draft.data.labelBBox) {
              draft.data.labelBBox.x = cp[0].x
              draft.data.labelBBox.y = cp[0].y
              draft.data.labelXY = cp[0]
            }
          })
        }
        return e
      }),
    }
  }),
)

const emitOnChange = machine.createAction(
  enqueueActions(({ event, enqueue }) => {
    assertEvent(event, 'emit.onChange')
    enqueue.assign({
      viewportChangedManually: true,
    })
    enqueue.emit({
      type: 'onChange',
      change: event.change,
    })
  }),
)

const emitOnLayoutTypeChange = machine.createAction(
  enqueueActions(({ event, system, context, enqueue }) => {
    if (!context.features.enableCompareWithLatest) {
      console.warn('Layout type cannot be changed while CompareWithLatest feature is disabled')
      return
    }
    let layoutType = context.view._layout ?? 'auto'
    if (event.type === 'emit.onLayoutTypeChange') {
      layoutType = event.layoutType
    } else {
      // toggle
      layoutType = layoutType === 'auto' ? 'manual' : 'auto'
    }

    // Check if we are switching from manual to auto layout while a sync is pending
    if (context.view._layout === 'manual' && layoutType === 'auto') {
      const syncLayoutActor = typedSystem(system).syncLayoutActorRef
      const syncState = syncLayoutActor?.getSnapshot().value
      const isPending = syncLayoutActor && (syncState === 'pending' || syncState === 'paused')
      if (isPending) {
        enqueue.sendTo(syncLayoutActor, { type: 'cancel' })
        enqueue.emit({
          type: 'onChange',
          change: createViewChange(context),
        })
      }
    }

    if (context.toggledFeatures.enableCompareWithLatest === true) {
      const currentViewport = context.viewport
      if (context.view._layout === 'auto') {
        enqueue.assign({
          viewportOnAutoLayout: currentViewport,
        })
      }
      if (context.view._layout === 'manual') {
        enqueue.assign({
          viewportOnManualLayout: currentViewport,
        })
      }
    }

    enqueue.emit({
      type: 'onLayoutTypeChange',
      layoutType,
    })
  }),
)

const updateView = machine.createAction(
  enqueueActions(({ enqueue, event, check, context, system }) => {
    assertEvent(event, 'update.view')
    const isAnotherView = check('is another view')
    enqueue.cancel('fitDiagram')
    if (isAnotherView) {
      enqueue('stopSyncLayout')
      enqueue('closeAllOverlays')
      enqueue('closeSearch')
      enqueue.assign({
        focusedNode: null,
      })
      enqueue(disableCompareWithLatest)
      const { fromNode, toNode } = findCorrespondingNode(context, event)
      if (fromNode && toNode) {
        enqueue({
          type: 'xyflow:alignNodeFromToAfterNavigate',
          params: {
            fromNode: fromNode.id as NodeId,
            toPosition: {
              x: toNode.data.x,
              y: toNode.data.y,
            },
          },
        })
        enqueue.raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 80 })
      } else {
        enqueue('xyflow:setViewportCenter')
        enqueue.raise({ type: 'fitDiagram', duration: 200 }, { id: 'fitDiagram', delay: 25 })
      }
      enqueue('update XYNodesEdges')
      enqueue('startSyncLayout')
      return
    }

    enqueue('update XYNodesEdges')
    enqueue.sendTo(typedSystem(system).syncLayoutActorRef!, { type: 'synced', viewId: event.view.id })

    const nextView = event.view

    if (context.toggledFeatures.enableCompareWithLatest === true && context.view._layout !== nextView._layout) {
      if (nextView._layout === 'auto' && context.viewportOnAutoLayout) {
        enqueue({
          type: 'xyflow:setViewport',
          params: {
            viewport: context.viewportOnAutoLayout,
            duration: 0,
          },
        })
        return
      }
      if (nextView._layout === 'manual' && context.viewportOnManualLayout) {
        enqueue({
          type: 'xyflow:setViewport',
          params: {
            viewport: context.viewportOnManualLayout,
            duration: 0,
          },
        })
        return
      }
    }

    let recenter = !context.viewportChangedManually

    // Check if dynamic view mode changed
    recenter = recenter || (
      nextView._type === 'dynamic' &&
      context.view._type === 'dynamic' &&
      nextView.variant !== context.view.variant
    )

    // Check if comparing layouts is enabled and layout changed
    recenter = recenter || (
      context.toggledFeatures.enableCompareWithLatest === true &&
      !!nextView._layout &&
      context.view._layout !== nextView._layout
    )

    if (recenter) {
      enqueue({
        type: 'xyflow:setViewportCenter',
        params: BBox.center(nextView.bounds),
      })
      enqueue.raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 50 })
    }
  }),
)

const _diagramMachine = machine.createMachine({
  initial: 'initializing',
  context: ({ input }): Context => ({
    ...input,
    xyedges: [],
    xynodes: [],
    features: { ...DefaultFeatures },
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
    viewportOnManualLayout: null,
    viewportOnAutoLayout: null,
    navigationHistory: {
      currentIndex: 0,
      history: [],
    },
    viewport: { x: 0, y: 0, zoom: 1 },
    xyflow: null,
    dynamicViewVariant: input.dynamicViewVariant ?? (
      input.view._type === 'dynamic' ? input.view.variant : 'diagram'
    ) ?? 'diagram',
    activeWalkthrough: null,
  }),
  states: {
    initializing,
    isReady: {
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
          'emit: initialized',
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
            assign(resetEdgesControlPoints),
            raise({ type: 'saveManualLayout.schedule' }),
          ],
        },
        'layout.resetManualLayout': {
          guard: 'not readonly',
          actions: [
            raise({ type: 'saveManualLayout.cancel' }),
            disableCompareWithLatest,
            emit({
              type: 'onChange',
              change: {
                op: 'reset-manual-layout',
              },
            }),
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
          guard: 'enabled: ElementDetails',
          actions: 'open element details',
        },
        'open.relationshipsBrowser': {
          actions: sendTo(({ system }) => typedSystem(system).overlaysActorRef!, ({ context, event, self }) => ({
            type: 'open.relationshipsBrowser',
            subject: event.fqn,
            viewId: context.view.id,
            scope: 'view' as const,
            closeable: true,
            enableChangeScope: true,
            enableSelectSubject: true,
            openSourceActor: self,
          })),
        },
        'open.relationshipDetails': {
          actions: sendTo(({ system }) => typedSystem(system).overlaysActorRef!, ({ context, event, self }) => ({
            type: 'open.relationshipDetails',
            viewId: context.view.id,
            openSourceActor: self,
            ...event.params,
          })),
        },
        'open.source': {
          actions: {
            type: 'emit: openSource',
            params: prop('event'),
          },
        },
        'walkthrough.start': {
          guard: 'is dynamic view',
          target: '.walkthrough',
        },
        'toggle.feature': {
          actions: 'toggle feature',
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
          actions: 'onEdgeMouseEnter',
        },
        'xyflow.edgeMouseLeave': {
          actions: 'onEdgeMouseLeave',
        },
        'xyflow.edgeDoubleClick': {
          guard: 'not readonly',
          actions: [onEdgeDoubleClick],
        },
        'notations.highlight': {
          actions: {
            type: 'notations.highlight',
            params: prop('event'),
          },
        },
        'notations.unhighlight': {
          actions: 'undim everything',
        },
        'tag.highlight': {
          actions: 'tag.highlight',
        },
        'tag.unhighlight': {
          actions: 'undim everything',
        },
        'saveManualLayout.*': {
          actions: 'delegate to syncLayoutActor',
        },
        'open.search': {
          guard: 'enabled: Search',
          actions: sendTo(({ system }) => typedSystem(system).searchActorRef!, ({ event }) => ({
            type: 'open',
            search: event.search,
          })),
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
                  'assign lastClickedNode',
                  'assign: focusedNode',
                  'emit: nodeClick',
                ],
                target: 'focused',
              },
              {
                guard: and([
                  'enabled: Readonly',
                  'enabled: ElementDetails',
                  'click: node has modelFqn',
                  or([
                    'click: same node',
                    'click: selected node',
                  ]),
                ]) as any,
                actions: [
                  'assign lastClickedNode',
                  'open source of focused or last clicked node',
                  'open element details',
                  'emit: nodeClick',
                ],
              },
              {
                actions: [
                  'assign lastClickedNode',
                  'open source of focused or last clicked node',
                  'emit: nodeClick',
                ],
              },
            ],
            'xyflow.paneClick': {
              actions: [
                'reset lastClickedNode',
                'emit: paneClick',
              ],
            },
            'xyflow.paneDblClick': {
              actions: [
                'reset lastClickedNode',
                'xyflow:fitDiagram',
                { type: 'emit: openSource', params: ({ context }) => ({ view: context.view.id }) },
              ],
            },
            'focus.node': {
              guard: 'enabled: FocusMode',
              actions: 'assign: focusedNode',
              target: 'focused',
            },
            'xyflow.edgeClick': {
              guard: and([
                'enabled: Readonly',
                'is dynamic view',
                'enabled: DynamicViewWalkthrough',
                'click: selected edge',
              ]) as any,
              actions: [
                raise(({ event }) => ({
                  type: 'walkthrough.start',
                  stepId: event.edge.id as StepEdgeId,
                })),
                'emit: edgeClick',
              ],
            },
          },
        },
        focused: {
          entry: [
            'focus on nodes and edges',
            assign(s => ({
              viewportBeforeFocus: { ...s.context.viewport },
            })),
            'open source of focused or last clicked node',
            spawnChild('hotkeyActorLogic', { id: 'hotkey' }),
            'xyflow:fitFocusedBounds',
          ],
          exit: enqueueActions(({ enqueue, context }) => {
            enqueue.stopChild('hotkey')
            if (context.viewportBeforeFocus) {
              enqueue({ type: 'xyflow:setViewport', params: { viewport: context.viewportBeforeFocus } })
            } else {
              enqueue('xyflow:fitDiagram')
            }
            enqueue('undim everything')
            enqueue.assign({
              viewportBeforeFocus: null,
              focusedNode: null,
            })
          }),
          on: {
            'xyflow.nodeClick': [
              {
                guard: and([
                  'click: focused node',
                  'click: node has modelFqn',
                ]) as any,
                actions: [
                  'open element details',
                  'emit: nodeClick',
                ],
              },
              {
                guard: 'click: focused node',
                actions: 'emit: nodeClick',
                target: '#idle',
              },
              {
                actions: [
                  'assign lastClickedNode',
                  raise(({ event }) => ({
                    type: 'focus.node',
                    nodeId: event.node.id as NodeId,
                  })),
                  'emit: nodeClick',
                ],
              },
            ],
            'focus.node': {
              actions: [
                'assign: focusedNode',
                'focus on nodes and edges',
                'open source of focused or last clicked node',
                'xyflow:fitFocusedBounds',
              ],
            },
            'key.esc': {
              target: 'idle',
            },
            'xyflow.paneClick': {
              actions: [
                'reset lastClickedNode',
                'emit: paneClick',
              ],
              target: 'idle',
            },
            'notations.unhighlight': {
              actions: 'focus on nodes and edges',
            },
            'tag.unhighlight': {
              actions: 'focus on nodes and edges',
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
            'update active walkthrough',
            'xyflow:fitFocusedBounds',
            'emit: walkthroughStarted',
          ],
          exit: enqueueActions(({ enqueue, context }) => {
            enqueue.stopChild('hotkey')
            if (context.viewportBeforeFocus) {
              enqueue({ type: 'xyflow:setViewport', params: { viewport: context.viewportBeforeFocus } })
            } else {
              enqueue.raise({ type: 'fitDiagram' }, { delay: 10 })
            }
            // Disable parallel areas highlight
            if (context.dynamicViewVariant === 'sequence' && context.activeWalkthrough?.parallelPrefix) {
              enqueue.assign({
                xynodes: context.xynodes.map(n => {
                  if (n.type === 'seq-parallel') {
                    return Base.setData(n, {
                      color: SeqParallelAreaColor.default,
                    })
                  }
                  return n
                }),
              })
            }
            enqueue('undim everything')
            enqueue.assign({
              activeWalkthrough: null,
              viewportBeforeFocus: null,
            })

            enqueue('emit: walkthroughStopped')
          }),
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
              actions: [
                assign(({ context, event }) => {
                  const { stepId } = context.activeWalkthrough!
                  const stepIndex = context.xyedges.findIndex(e => e.id === stepId)
                  const nextStepIndex = clamp(event.direction === 'next' ? stepIndex + 1 : stepIndex - 1, {
                    min: 0,
                    max: context.xyedges.length - 1,
                  })
                  if (nextStepIndex === stepIndex) {
                    return {}
                  }
                  const nextStepId = context.xyedges[nextStepIndex]!.id as StepEdgeId
                  return {
                    activeWalkthrough: {
                      stepId: nextStepId,
                      parallelPrefix: getParallelStepsPrefix(nextStepId),
                    },
                  }
                }),
                'update active walkthrough',
                'xyflow:fitFocusedBounds',
                'emit: walkthroughStep',
              ],
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
                'update active walkthrough',
                'xyflow:fitFocusedBounds',
                'emit: edgeClick',
                'emit: walkthroughStep',
              ],
            },
            'notations.unhighlight': {
              actions: 'update active walkthrough',
            },
            'tag.unhighlight': {
              actions: 'update active walkthrough',
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
        },
      },
    },
    navigating,
  },
  on: {
    'xyflow.paneClick': {
      actions: [
        'reset lastClickedNode',
        'emit: paneClick',
      ],
    },
    'xyflow.nodeClick': {
      actions: [
        'assign lastClickedNode',
        'emit: nodeClick',
      ],
    },
    'xyflow.edgeClick': {
      actions: [
        'reset lastClickedNode',
        'emit: edgeClick',
      ],
    },
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
    'xyflow.edgeEditingStarted': {
      actions: 'emit: edgeEditingStarted',
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
        updateView,
      ],
    },
    'update.inputs': {
      actions: 'updateInputs',
    },
    'update.features': {
      actions: [
        'updateFeatures',
        'ensure overlays actor state',
        'ensure search actor state',
      ],
    },
    'switch.dynamicViewVariant': {
      actions: 'assign: dynamicViewVariant',
    },
    'emit.onChange': {
      actions: emitOnChange,
    },
    'emit.onLayoutTypeChange': {
      actions: emitOnLayoutTypeChange,
    },
  },
  exit: [
    'stopSyncLayout',
    cancel('fitDiagram'),
    stopChild('hotkey'),
    stopChild('overlays'),
    stopChild('search'),
    assign({
      xyflow: null,
      xystore: null as any,
      xyedges: [],
      xynodes: [],
      initialized: {
        xydata: false,
        xyflow: false,
      },
    }),
  ],
})

function nodeRef(node: Types.Node) {
  switch (node.type) {
    case 'element':
    case 'compound-element':
    case 'seq-actor':
      return node.data.modelFqn
    case 'deployment':
    case 'compound-deployment':
      return node.data.modelFqn ?? node.data.deploymentFqn
    case 'seq-parallel':
    case 'view-group':
      return null
    default:
      nonexhaustive(node)
  }
}
function findCorrespondingNode(context: Context, event: { view: DiagramView; xynodes: Types.Node[] }) {
  const fromNodeId = context.lastOnNavigate?.fromNode
  const fromNode = fromNodeId && context.xynodes.find(n => n.id === fromNodeId)
  const fromRef = fromNode && nodeRef(fromNode)
  const toNode = fromRef && event.xynodes.find(n => nodeRef(n) === fromRef)
  return { fromNode, toNode }
}

/**
 * Here is a trick to reduce inference types
 */
type InferredDiagramMachine = typeof _diagramMachine
export interface DiagramMachineLogic extends InferredDiagramMachine {}
export const diagramMachine: DiagramMachineLogic = _diagramMachine as any
