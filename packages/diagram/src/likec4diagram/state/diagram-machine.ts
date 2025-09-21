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
  NodeId,
  NodeNotation as ElementNotation,
  StepEdgeId,
  ViewId,
  XYPoint,
} from '@likec4/core/types'
import {
  applyEdgeChanges,
  applyNodeChanges,
  getViewportForBounds,
} from '@xyflow/react'
import { type EdgeChange, type NodeChange, type Rect, type Viewport, nodeToRect } from '@xyflow/system'
import type { MouseEvent } from 'react'
import { clamp, first, hasAtLeast, prop } from 'remeda'
import type { PartialDeep } from 'type-fest'
import type {
  ActorLogicFrom,
  ActorRef,
  AnyEventObject,
  Snapshot,
} from 'xstate'
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
import { MinZoom } from '../../base/const'
import { Base } from '../../base/types'
import { type EnabledFeatures, type FeatureName, AllDisabled } from '../../context/DiagramFeatures'
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
  updateActiveWalkthrough,
  updateEdgeData,
  updateNavigationHistory,
  updateNodeData,
} from './assign'
import { type HotKeyEvent, hotkeyActorLogic } from './hotkeyActor'
import { DiagramToggledFeaturesPersistence } from './persistence'
import { type Events as SyncLayoutEvents, syncManualLayoutActorLogic } from './syncManualLayoutActor'
import { activeSequenceBounds, findDiagramEdge, findDiagramNode, focusedBounds, typedSystem } from './utils'

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
  nodesSelectable: boolean
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
  xyflow: XYFlowInstance | null

  syncLayoutActorRef: null | ActorRef<Snapshot<unknown>, SyncLayoutEvents, AnyEventObject>

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
  | { type: 'saveManualLayout.schedule' }
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

export type EmittedEvents =
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
      context.features.enableFocusMode &&
      (context.view._type !== 'dynamic' || context.dynamicViewVariant !== 'sequence'),
    'enabled: Readonly': ({ context }) => context.features.enableReadOnly,
    'enabled: RelationshipDetails': ({ context }) => context.features.enableRelationshipDetails,
    'enabled: Search': ({ context }) => context.features.enableSearch,
    'enabled: ElementDetails': ({ context }) => context.features.enableElementDetails,
    'not readonly': ({ context }) => !context.features.enableReadOnly,
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
      assertEvent(event, 'xyflow.edgeClick')
      return event.edge.selected === true || event.edge.data.active === true
    },
  },
  actions: {
    'trigger:NavigateTo': emit(({ context }) => ({
      type: 'navigateTo',
      viewId: nonNullable(context.lastOnNavigate, 'Invalid state, lastOnNavigate is null').toView,
    })),

    'trigger:OpenSource': emit((_, _params: OpenSourceParams) => ({
      type: 'openSource',
      params: _params,
    })),
    'assign lastClickedNode': assign(({ context, event }) => {
      assertEvent(event, 'xyflow.nodeClick')
      return {
        lastClickedNode: lastClickedNode({ context, event }),
      }
    }),
    'assign: focusedNode': assign(({ context, event }) => {
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

    'xyflow:fitDiagram': ({ context }, params?: { duration?: number; bounds?: BBox }) => {
      const {
        bounds = context.view.bounds,
        duration = 450,
      } = params ?? {}
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
      panZoom?.setViewport(viewport, duration > 0 ? { duration } : undefined)
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
      const panZoom = context.xystore?.getState().panZoom
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
      constraints.updateXYFlowNodes()
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
    'onEdgeMouseEnter': enqueueActions(({ enqueue, context, event }) => {
      assertEvent(event, 'xyflow.edgeMouseEnter')
      let edge = event.edge
      enqueue.assign({
        xyedges: context.xyedges.map(e => {
          if (e.id === event.edge.id) {
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
    'open element details': sendTo(
      ({ system }) => typedSystem(system).overlaysActorRef!,
      ({ context, event }, params?: { fqn: Fqn; fromNode?: NodeId | undefined }) => {
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
          invariant('modelFqn' in event.node.data && !!event.node.data.modelFqn, 'No modelFqn in event node data')
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
        return ({
          type: 'open.elementDetails' as const,
          subject,
          currentView: context.view,
          ...(initiatedFrom && { initiatedFrom }),
        })
      },
    ),
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
    'assign: dynamicViewVariant': assign(({ event }) => {
      assertEvent(event, 'switch.dynamicViewVariant')
      return {
        dynamicViewVariant: event.variant,
      }
    }),
  },
}).createMachine({
  initial: 'initializing',
  context: ({ input }): Context => ({
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
    dynamicViewVariant: input.dynamicViewVariant ?? (
      input.view._type === 'dynamic' ? input.view.variant : 'diagram'
    ) ?? 'diagram',
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
          guard: 'enabled: ElementDetails',
          actions: 'open element details',
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
          actions: 'onEdgeMouseEnter',
        },
        'xyflow.edgeMouseLeave': {
          actions: 'onEdgeMouseLeave',
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
                // TODO: xstate fails to infer the type of the guard
                guard: and([
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
                { type: 'trigger:OpenSource', params: ({ context }) => ({ view: context.view.id }) },
              ],
            },
            'focus.node': {
              guard: 'enabled: FocusMode',
              actions: 'assign: focusedNode',
              target: 'focused',
            },
            'xyflow.edgeClick': {
              guard: and([
                'is dynamic view',
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
          exit: enqueueActions(({ enqueue, context, event }) => {
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
          exit: enqueueActions(({ enqueue, context, event }) => {
            enqueue.stopChild('hotkey')
            if (context.viewportBeforeFocus) {
              enqueue({ type: 'xyflow:setViewport', params: { viewport: context.viewportBeforeFocus } })
            } else {
              enqueue('xyflow:fitDiagram')
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
    // Navigating to another view (after `navigateTo` event)
    navigating: {
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
                    x: toNode.data.position[0],
                    y: toNode.data.position[1],
                  },
                },
              })
            } else {
              enqueue({
                type: 'xyflow:setViewportCenter',
                params: BBox.center(event.view.bounds),
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
    'xyflow.paneClick': {
      actions: 'emit: paneClick',
    },
    'xyflow.nodeClick': {
      actions: 'emit: nodeClick',
    },
    'xyflow.edgeClick': {
      actions: 'emit: edgeClick',
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
        enqueueActions(({ enqueue, event, check, context }) => {
          const isAnotherView = check('is another view')
          if (isAnotherView) {
            enqueue('closeAllOverlays')
            enqueue('closeSearch')
            enqueue('stopSyncLayout')
            enqueue.assign({
              focusedNode: null,
            })
            const { fromNode, toNode } = findCorrespondingNode(context, event)
            if (fromNode && toNode) {
              enqueue({
                type: 'xyflow:alignNodeFromToAfterNavigate',
                params: {
                  fromNode: fromNode.id as NodeId,
                  toPosition: {
                    x: toNode.data.position[0],
                    y: toNode.data.position[1],
                  },
                },
              })
              enqueue.raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 80 })
            } else {
              enqueue({
                type: 'xyflow:setViewportCenter',
                params: BBox.center(event.view.bounds),
              })
              enqueue.raise({ type: 'fitDiagram', duration: 200 }, { id: 'fitDiagram', delay: 25 })
            }
          } else {
            // Check if dynamic view mode changed
            const nextView = event.view
            if (
              nextView._type === 'dynamic' &&
              context.view._type === 'dynamic' &&
              nextView.variant !== context.view.variant
            ) {
              enqueue({
                type: 'xyflow:setViewportCenter',
                params: BBox.center(nextView.bounds),
              })
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
      syncLayoutActorRef: null as any,
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
export interface DiagramMachine extends InferredDiagramMachine {}
export const diagramMachine: DiagramMachine = _diagramMachine
export interface DiagramMachineLogic extends ActorLogicFrom<DiagramMachine> {}
