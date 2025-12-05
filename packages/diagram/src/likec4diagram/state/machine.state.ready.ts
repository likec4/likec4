import { emit, sendTo, spawnChild, stopChild } from 'xstate/actions'
import { and } from 'xstate/guards'
import {
  assignLastClickedNode,
  assignToggledFeatures,
  cancelFitDiagram,
  closeAllOverlays,
  closeSearch,
  disableCompareWithLatest,
  emitEdgeClick,
  emitNodeClick,
  emitOpenSource,
  emitPaneClick,
  ensureOverlaysActor,
  ensureSearchActor,
  ensureSyncLayoutActor,
  fitDiagram,
  handleNavigate,
  layoutAlign,
  notationsHighlight,
  onEdgeDoubleClick,
  onEdgeMouseEnter,
  onEdgeMouseLeave,
  onNodeMouseEnter,
  onNodeMouseLeave,
  openOverlay,
  raiseFitDiagram,
  resetEdgesControlPoints,
  resetLastClickedNode,
  setViewport,
  startEditing,
  stopEditing,
  stopSyncLayout,
  tagHighlight,
  undimEverything,
  updateFeatures,
  updateView,
} from './machine.actions'
import { machine, targetState } from './machine.setup'
import { focused } from './machine.state.ready.focused'
import { idle } from './machine.state.ready.idle'
import { printing } from './machine.state.ready.printing'
import { walkthrough } from './machine.state.ready.walkthrough'
import { typedSystem } from './utils'

// Main ready state with all its substates and transitions
export const ready = machine.createStateConfig({
  initial: 'idle',
  entry: [
    spawnChild('mediaPrintActorLogic', { id: 'mediaPrint' }),
    ensureSyncLayoutActor(),
    ensureOverlaysActor(),
    ensureSearchActor(),
  ],
  exit: [
    cancelFitDiagram(),
    stopChild('mediaPrint'),
    closeAllOverlays(),
    closeSearch(),
    stopSyncLayout(),
  ],
  states: {
    idle,
    focused,
    walkthrough,
    printing,
  },
  on: {
    'navigate.*': {
      actions: handleNavigate(),
    },
    'layout.align': {
      guard: 'not readonly',
      actions: [
        startEditing('node'),
        layoutAlign(),
        stopEditing(true),
      ],
    },
    'layout.resetEdgeControlPoints': {
      guard: 'not readonly',
      actions: [
        startEditing('edge'),
        resetEdgesControlPoints(),
        stopEditing(true),
      ],
    },
    'layout.resetManualLayout': {
      guard: 'not readonly',
      actions: [
        stopSyncLayout(),
        disableCompareWithLatest(),
        emit({
          type: 'onChange',
          change: {
            op: 'reset-manual-layout',
          },
        }),
        ensureSyncLayoutActor(),
      ],
    },
    'xyflow.resized': {
      guard: ({ context }) => context.features.enableFitView && !context.viewportChangedManually,
      actions: [
        cancelFitDiagram(),
        raiseFitDiagram({ delay: 200 }),
      ],
    },
    'open.elementDetails': {
      actions: openOverlay(),
    },
    'open.relationshipsBrowser': {
      actions: openOverlay(),
    },
    'open.relationshipDetails': {
      actions: openOverlay(),
    },
    'open.source': {
      guard: 'enabled: OpenSource',
      actions: emitOpenSource(),
    },
    'walkthrough.start': {
      guard: 'is dynamic view',
      target: targetState.walkthrough,
    },
    'toggle.feature': {
      actions: [
        assignToggledFeatures(),
        ensureSyncLayoutActor(),
      ],
    },
    'update.features': {
      actions: [
        updateFeatures(),
        ensureOverlaysActor(),
        ensureSearchActor(),
        ensureSyncLayoutActor(),
      ],
    },
    'xyflow.nodeMouseEnter': {
      actions: onNodeMouseEnter(),
    },
    'xyflow.nodeMouseLeave': {
      actions: onNodeMouseLeave(),
    },
    'xyflow.edgeMouseEnter': {
      actions: onEdgeMouseEnter(),
    },
    'xyflow.edgeMouseLeave': {
      actions: onEdgeMouseLeave(),
    },
    'xyflow.edgeDoubleClick': {
      guard: and([
        'not readonly',
        ({ event }) => !!event.edge.data.controlPoints && event.edge.data.controlPoints.length > 0,
      ]),
      actions: [
        startEditing('edge'),
        onEdgeDoubleClick(),
        stopEditing(true),
      ],
    },
    'notations.highlight': {
      actions: notationsHighlight(),
    },
    'notations.unhighlight': {
      actions: undimEverything(),
    },
    'tag.highlight': {
      actions: tagHighlight(),
    },
    'tag.unhighlight': {
      actions: undimEverything(),
    },
    'open.search': {
      guard: 'enabled: Search',
      actions: sendTo(({ system }) => typedSystem(system).searchActorRef!, ({ event }) => ({
        type: 'open',
        search: event.search,
      })),
    },
    'xyflow.paneClick': {
      actions: [
        resetLastClickedNode(),
        emitPaneClick(),
      ],
    },
    'xyflow.nodeClick': {
      actions: [
        assignLastClickedNode(),
        emitNodeClick(),
      ],
    },
    'xyflow.edgeClick': {
      actions: [
        resetLastClickedNode(),
        emitEdgeClick(),
      ],
    },
    'xyflow.fitDiagram': {
      guard: 'enabled: FitView',
      actions: fitDiagram(),
    },
    'xyflow.setViewport': {
      actions: setViewport(),
    },
    'update.view': [
      // Redirect to navigating state if received another view
      {
        guard: 'is another view',
        target: targetState.navigating,
      },
      // Otherwise, just update the view in place
      {
        actions: updateView(),
      },
    ],
    'media.print.on': {
      target: targetState.printing,
    },
  },
})
