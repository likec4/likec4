import { BBox } from '@likec4/core'
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
  openElementDetails,
  raiseFitDiagram,
  resetEdgesControlPoints,
  resetLastClickedNode,
  sendSynced,
  setViewport,
  startEditing,
  stopEditing,
  stopSyncLayout,
  tagHighlight,
  undimEverything,
  updateFeatures,
  updateXYNodesEdges,
} from './machine.actions'
import { machine, targetState } from './machine.setup'
import { focused } from './machine.state.ready.focused'
import { idle } from './machine.state.ready.idle'
import { printing } from './machine.state.ready.printing'
import { walkthrough } from './machine.state.ready.walkthrough'
import { calcViewportForBounds, typedSystem } from './utils'

const updateView = () =>
  machine.enqueueActions(
    ({ enqueue, event, context, self }) => {
      if (event.type !== 'update.view') {
        console.warn(`Ignoring unexpected event type: ${event.type} in action 'update.view'`)
        return
      }
      const nextView = event.view
      const isAnotherView = nextView.id !== context.view.id

      if (isAnotherView) {
        console.warn('updateView called for another view - ignoring', { event })
        return
      }

      enqueue(updateXYNodesEdges())

      if (event.source === 'internal') {
        return
      }

      enqueue(sendSynced())

      let recenter = !context.viewportChangedManually

      if (context.toggledFeatures.enableCompareWithLatest === true && context.view._layout !== nextView._layout) {
        if (nextView._layout === 'auto' && context.viewportOnAutoLayout) {
          enqueue(
            setViewport({
              viewport: context.viewportOnAutoLayout,
              duration: 0,
            }),
          )
          return
        }
        // If switching to manual layout, restore previous manual layout viewport
        if (nextView._layout === 'manual' && context.viewportOnManualLayout) {
          enqueue(
            setViewport({
              viewport: context.viewportOnManualLayout,
              duration: 0,
            }),
          )
          return
        }
      }

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
        enqueue(cancelFitDiagram())
        const nextViewport = calcViewportForBounds(
          context,
          event.view.bounds,
        )
        let zoom = Math.min(nextViewport.zoom, context.viewport.zoom)
        const center = BBox.center(event.view.bounds)
        context.xyflow!.setCenter(
          Math.round(center.x),
          Math.round(center.y),
          { zoom },
        )
        enqueue(raiseFitDiagram())
      }
    },
  )

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
      guard: 'enabled: ElementDetails',
      actions: openElementDetails(),
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
