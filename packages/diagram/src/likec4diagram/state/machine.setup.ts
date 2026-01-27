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
  WhereOperator,
} from '@likec4/core/types'
import type { EdgeChange, NodeChange, Rect, Viewport } from '@xyflow/system'
import type { MouseEvent } from 'react'
import { isTruthy, mapValues } from 'remeda'
import type { PartialDeep } from 'type-fest'
import {
  assertEvent,
  setup,
} from 'xstate'
import type { EnabledFeatures, TogglableFeature } from '../../context/DiagramFeatures'
import { editorActorLogic } from '../../editor/editorActor.states'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import type { OpenSourceParams, ViewPaddings } from '../../LikeC4Diagram.props'
import { overlaysActorLogic } from '../../overlays/overlaysActor'
import { searchActorLogic } from '../../search/searchActor'
import type { Types } from '../types'
import type { AlignmentMode } from './aligners'
import { type HotKeyEvent, hotkeyActorLogic } from './hotkeyActor'
import { type MediaPrintEvent, mediaPrintActorLogic } from './mediaPrintActor'

/**
 * Navigation history entry represents a current view state,
 * including viewport, focused node, dynamic view variant, etc.
 */
export interface NavigationHistoryEntry {
  viewId: ViewId
  viewport: Viewport
  viewportChangedManually: boolean
  viewportBefore?: null | {
    wasChangedManually: boolean
    value: Viewport
  }
  // Focused node in the view, if any
  focusedNode?: NodeId | null
  // If Dynamic View
  dynamicViewVariant?: DynamicViewDisplayVariant | null
  // If there was an active walkthrough
  activeWalkthrough?: null | StepEdgeId
}

export interface NavigationHistory {
  history: ReadonlyArray<NavigationHistoryEntry>
  currentIndex: number
}

export interface Input {
  view: DiagramView
  xystore: XYStoreApi
  zoomable: boolean
  pannable: boolean
  nodesDraggable: boolean
  nodesSelectable: boolean
  fitViewPadding: ViewPaddings
  where: WhereOperator | null
  dynamicViewVariant?: DynamicViewDisplayVariant | undefined
}

export type ToggledFeatures = {
  [P in `enable${TogglableFeature}`]?: boolean
}

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
  /**
   * Viewport before entering focus mode, walkthrough or printing
   */
  viewportBefore: null | {
    wasChangedManually: boolean
    value: Viewport
  }

  viewportOnManualLayout: null | Viewport
  viewportOnAutoLayout: null | Viewport

  lastOnNavigate: null | {
    fromView: ViewId
    toView: ViewId
    fromNode: NodeId | null
    focusOnElement?: Fqn | null
  }
  navigationHistory: NavigationHistory
  lastClickedNode: null | {
    id: NodeId
    clicks: number
    timestamp: number
  }
  focusedNode: NodeId | null
  autoUnfocusTimer: boolean
  activeElementDetails: null | {
    fqn: Fqn
    fromNode: NodeId | null
    // internal xyflow node rect
    nodeRect?: Rect | null
    // in screen coordinates
    nodeRectScreen?: Rect | null
  }
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
  | MediaPrintEvent
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
  | { type: 'xyflow.fitDiagram'; duration?: number; bounds?: BBox }
  | { type: 'xyflow.setViewport'; duration?: number; viewport: Viewport }
  | { type: 'update.nodeData'; nodeId: NodeId; data: PartialDeep<Types.NodeData> }
  | { type: 'update.edgeData'; edgeId: EdgeId; data: PartialDeep<Types.EdgeData> }
  | {
    type: 'update.view'
    view: DiagramView
    source?: 'editor' | 'external'
  }
  | {
    // Same as 'update.view', but with XYFlow nodes and edges
    type: 'update.view'
    view: DiagramView
    source?: 'editor' | 'external'
    xynodes: Types.Node[]
    xyedges: Types.Edge[]
  }
  | { type: 'update.view-bounds'; bounds: BBox }
  | { type: 'update.inputs'; inputs: Partial<Omit<Input, 'view' | 'xystore' | 'dynamicViewVariant'>> }
  | { type: 'update.features'; features: EnabledFeatures }
  | ({ type: 'open.source' } & OpenSourceParams)
  | { type: 'open.elementDetails'; fqn: Fqn; fromNode?: NodeId | undefined }
  | { type: 'open.relationshipDetails'; params: { edgeId: EdgeId } | { source: Fqn; target: Fqn } }
  | { type: 'open.relationshipsBrowser'; fqn: Fqn }
  | { type: 'open.search'; search?: string }
  // | { type: 'close.overlay' }
  | { type: 'navigate.to'; viewId: ViewId; fromNode?: NodeId | undefined; focusOnElement?: Fqn | undefined }
  | { type: 'navigate.back' }
  | { type: 'navigate.forward' }
  | { type: 'layout.align'; mode: AlignmentMode }
  | { type: 'layout.resetEdgeControlPoints' }
  | { type: 'layout.resetManualLayout' }
  | { type: 'focus.node'; nodeId: NodeId; autoUnfocus?: boolean }
  | { type: 'focus.autoUnfocus' }
  | { type: 'switch.dynamicViewVariant'; variant: DynamicViewDisplayVariant }
  | { type: 'walkthrough.start'; stepId?: StepEdgeId }
  | { type: 'walkthrough.step'; direction: 'next' | 'previous' }
  | { type: 'walkthrough.end' }
  | { type: 'notations.highlight'; notation: ElementNotation; kind?: string }
  | { type: 'notations.unhighlight' }
  | { type: 'tag.highlight'; tag: string }
  | { type: 'tag.unhighlight' }
  | { type: 'toggle.feature'; feature: TogglableFeature; forceValue?: boolean }
  | { type: 'trigger.change'; change: ViewChange }
  | { type: 'emit.onLayoutTypeChange'; layoutType: LayoutType }
  | { type: 'destroy' }

export type EmittedEvents =
  | { type: 'initialized'; instance: XYFlowInstance }
  | { type: 'navigateTo'; viewId: ViewId }
  | { type: 'openSource'; params: OpenSourceParams }
  | { type: 'paneClick' }
  | { type: 'nodeClick'; node: DiagramNode; xynode: Types.Node }
  | { type: 'edgeClick'; edge: DiagramEdge; xyedge: Types.Edge }
  | { type: 'edgeMouseEnter'; edge: Types.Edge; event: MouseEvent }
  | { type: 'edgeMouseLeave'; edge: Types.Edge; event: MouseEvent }
  | { type: 'walkthroughStarted'; edge: Types.Edge }
  | { type: 'walkthroughStep'; edge: Types.Edge }
  | { type: 'walkthroughStopped' }
  | { type: 'onLayoutTypeChange'; layoutType: LayoutType }

export type ActionArg = { context: Context; event: Events }

export const deriveToggledFeatures = (context: Context): Required<ToggledFeatures> => {
  let toggledFeatures = context.toggledFeatures

  const hasActiveWalkthrough = isTruthy(context.activeWalkthrough)

  const enableCompareWithLatest = context.features.enableCompareWithLatest
    && (toggledFeatures.enableCompareWithLatest ?? false)
    && isTruthy(context.view._layout)
    // Compare with latest is disabled during active walkthrough
    && !hasActiveWalkthrough

  /**
   * Readonly mode is enabled when:
   * - Global `features.enableReadOnly` is true (even if toggled off at runtime)
   * OR
   * - Runtime feature `ReadOnly` is toggled on (default is off)
   * OR
   * - This is a dynamic view in 'sequence' variant
   * OR
   * - There is an active walkthrough
   */
  const enableReadOnly = context.features.enableReadOnly
    || (toggledFeatures.enableReadOnly ?? false)
    // Active walkthrough forces readonly
    || hasActiveWalkthrough
    // Compare with latest enforces readonly
    || (enableCompareWithLatest && context.view._layout === 'auto')

  return {
    enableCompareWithLatest,
    enableReadOnly,
  }
}

const isReadOnly = (context: Context) => deriveToggledFeatures(context).enableReadOnly

export const machine = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    children: {} as {
      hotkey: 'hotkeyActorLogic'
      overlays: 'overlaysActorLogic'
      search: 'searchActorLogic'
      mediaPrint: 'mediaPrintActorLogic'
      editor: 'editorActor'
    },
    events: {} as Events,
    emitted: {} as EmittedEvents,
  },
  actors: {
    hotkeyActorLogic,
    overlaysActorLogic,
    searchActorLogic,
    mediaPrintActorLogic,
    editorActor: editorActorLogic,
  },
  guards: {
    'isReady': ({ context }) => context.initialized.xydata && context.initialized.xyflow,
    'enabled: Editor': ({ context }) => context.features.enableEditor,
    'enabled: FitView': ({ context }) => context.features.enableFitView,
    'enabled: FocusMode': ({ context }) => context.features.enableFocusMode && isReadOnly(context),
    'enabled: Readonly': ({ context }) => isReadOnly(context),
    'enabled: RelationshipDetails': ({ context }) => context.features.enableRelationshipDetails,
    'enabled: Search': ({ context }) => context.features.enableSearch,
    'enabled: ElementDetails': ({ context }) => context.features.enableElementDetails,
    'enabled: OpenSource': ({ context }) => context.features.enableVscode,
    'enabled: DynamicViewWalkthrough': ({ context }) => context.features.enableDynamicViewWalkthrough,
    'focus.node: autoUnfocus': ({ event }) => {
      assertEvent(event, 'focus.node')
      return event.autoUnfocus === true
    },
    'enabled: Overlays': ({ context }) =>
      context.features.enableElementDetails ||
      context.features.enableRelationshipBrowser ||
      context.features.enableRelationshipDetails,
    'not readonly': ({ context }) => !isReadOnly(context),
    'is dynamic view': ({ context }) => context.view._type === 'dynamic',
    'is same view': ({ context, event }) => {
      assertEvent(event, ['update.view', 'navigate.to'])
      if (event.type === 'update.view') {
        return context.view.id === event.view.id
      }
      if (event.type === 'navigate.to') {
        return context.view.id === event.viewId
      }
      nonexhaustive(event.type)
    },
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
    'click: active walkthrough step': ({ context, event }) => {
      assertEvent(event, ['xyflow.edgeClick', 'xyflow.edgeDoubleClick'])
      if (!context.activeWalkthrough) {
        return false
      }
      const { stepId } = context.activeWalkthrough
      return event.edge.id === stepId
    },
  },
})

export const targetState = {
  idle: '#idle',
  focused: '#focused',
  walkthrough: '#walkthrough',
  printing: '#printing',
  navigating: '#navigating',
}

export const to = mapValues(targetState, (id) => ({ target: id }))
