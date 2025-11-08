// oxlint-disable triple-slash-reference
// oxlint-disable no-floating-promises
/// <reference path="../../../node_modules/xstate/dist/declarations/src/guards.d.ts" />
import {
  BBox,
  nonexhaustive,
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
} from '@likec4/core/types'
import type { EdgeChange, NodeChange, Rect, Viewport } from '@xyflow/system'
import type { MouseEvent } from 'react'
import type { PartialDeep } from 'type-fest'
import {
  assertEvent,
  setup,
} from 'xstate'
import type { EnabledFeatures, FeatureName } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import type { OpenSourceParams, ViewPadding } from '../../LikeC4Diagram.props'
import { overlaysActorLogic } from '../../overlays/overlaysActor'
import { searchActorLogic } from '../../search/searchActor'
import type { Types } from '../types'
import type { AlignmentMode } from './aligners'
import { type HotKeyEvent, hotkeyActorLogic } from './hotkeyActor'
import { syncManualLayoutActorLogic } from './syncManualLayoutActor'

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

export const machine = setup({
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
})
