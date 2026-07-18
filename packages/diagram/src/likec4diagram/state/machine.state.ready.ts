import { assign, sendTo, spawnChild, stopChild } from 'xstate/actions'
import { and } from 'xstate/guards'
import {
  assignLastClickedNode,
  assignToggledFeatures,
  cancelEditing,
  cancelFitDiagram,
  centerOnNodeOrEdge,
  closeAllOverlays,
  collapseOrExpandSequenceFlow,
  disableCompareWithLatest,
  emitEdgeClick,
  emitNodeClick,
  emitOpenSource,
  emitOpenSourceOfView,
  emitPaneClick,
  ensureAllActors,
  ensureEditorActor,
  ensureOverlaysActor,
  ensureSearchActor,
  fitDiagram,
  handleNavigate,
  highlightNodeOrEdge,
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
  tagHighlight,
  triggerChange,
  undimEverything,
  updateFeatures,
  updateView,
} from './machine.actions'
import { machine, to } from './machine.setup'
import { focused } from './machine.state.ready.focused'
import { idle } from './machine.state.ready.idle'
import { printing } from './machine.state.ready.printing'
import { walkthrough } from './machine.state.ready.walkthrough'
import { typedSystem } from './utils'

// Main ready state with all its substates and transitions
export const ready = machine.createStateConfig({
  initial: 'idle',
  entry: [
    spawnChild('mediaPrint', { id: 'mediaPrint' }),
    ensureAllActors(),
  ],
  exit: [
    cancelFitDiagram(),
    closeAllOverlays(),
    stopChild('mediaPrint'),
    stopChild(typedSystem.overlaysActor),
    stopChild(typedSystem.editorActor),
    stopChild(typedSystem.searchActor),
    // WE don't stop navigation actor - otherwise
    // UI will be re-rendered and panel will be closed
    // stopChild(typedSystem.navigationActor),
  ],
  states: {
    idle,
    focused,
    walkthrough,
    printing,
  },
  on: {
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
        cancelEditing(),
        disableCompareWithLatest(),
        triggerChange({
          op: 'reset-manual-layout',
        }),
      ],
    },
    'media.print.on': {
      ...to.printing,
    },
    'navigate.*': {
      actions: handleNavigate(),
    },
    'notations.highlight': {
      actions: notationsHighlight(),
    },
    'notations.unhighlight': {
      actions: undimEverything(),
    },
    'highlight.*': {
      actions: highlightNodeOrEdge(),
    },
    'unhighlight.all': {
      actions: undimEverything(),
    },
    'open.elementDetails': {
      actions: openOverlay(),
    },
    'open.relationshipDetails': {
      actions: openOverlay(),
    },
    'open.relationshipsBrowser': {
      actions: openOverlay(),
    },
    'open.search': {
      guard: 'enabled: Search',
      actions: sendTo(typedSystem.searchActor, ({ event }) => ({
        type: 'open',
        search: event.search,
      })),
    },
    'open.source': {
      guard: 'enabled: OpenSource',
      actions: emitOpenSource(),
    },
    'tag.highlight': {
      actions: tagHighlight(),
    },
    'tag.unhighlight': {
      actions: undimEverything(),
    },
    'toggle.feature': {
      actions: assignToggledFeatures(),
    },
    'update.features': {
      actions: [
        updateFeatures(),
        ensureOverlaysActor(),
        ensureSearchActor(),
        ensureEditorActor(),
      ],
    },
    'update.view': [
      // Redirect to navigating state if received another view
      {
        guard: 'is another view',
        ...to.navigating,
      },
      // Otherwise, just update the view in place
      {
        actions: updateView(),
      },
    ],
    'walkthrough.start': {
      guard: 'is dynamic view',
      ...to.walkthrough,
    },
    'sequence.flow.*': {
      guard: 'is dynamic view',
      actions: [
        collapseOrExpandSequenceFlow(),
        resetLastClickedNode(),
      ],
    },
    'xyflow.edgeClick': {
      actions: [
        resetLastClickedNode(),
        emitEdgeClick(),
      ],
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
    'xyflow.edgeMouseEnter': {
      actions: onEdgeMouseEnter(),
    },
    'xyflow.edgeMouseLeave': {
      actions: onEdgeMouseLeave(),
    },
    'xyflow.centerViewport': {
      actions: centerOnNodeOrEdge(),
    },
    'xyflow.fitDiagram': {
      guard: 'enabled: FitView',
      actions: [
        assign({
          viewportChangedManually: false,
        }),
        fitDiagram(),
      ],
    },
    'xyflow.nodeClick': {
      actions: [
        assignLastClickedNode(),
        emitNodeClick(),
      ],
    },
    'xyflow.nodeMouseEnter': {
      actions: onNodeMouseEnter(),
    },
    'xyflow.nodeMouseLeave': {
      actions: onNodeMouseLeave(),
    },
    'xyflow.paneClick': {
      actions: [
        resetLastClickedNode(),
        emitPaneClick(),
      ],
    },
    'xyflow.resetSelection': {
      actions: ({ context }) => {
        context.xystore?.getState().resetSelectedElements()
      },
    },
    'xyflow.paneDblClick': {
      actions: [
        resetLastClickedNode(),
        cancelFitDiagram(),
        raiseFitDiagram(),
        emitOpenSourceOfView(),
        emitPaneClick(),
      ],
    },
    'xyflow.resized': {
      guard: ({ context }) => context.features.enableFitView && !context.viewportChangedManually,
      actions: [
        cancelFitDiagram(),
        raiseFitDiagram({ delay: 150 }),
      ],
    },
    'xyflow.setViewport': {
      actions: setViewport(),
    },
  },
})
