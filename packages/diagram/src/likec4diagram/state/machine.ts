import {
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react'
import { assign, stopChild } from 'xstate/actions'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import {
  updateEdgeData,
  updateNavigationHistory,
  updateNodeData,
} from './assign'
import {
  assignDynamicViewVariant,
  assignLastClickedNode,
  cancelFitDiagram,
  emitEdgeClick,
  emitEdgeEditingStarted,
  emitNodeClick,
  emitOnChange,
  emitOnLayoutTypeChange,
  emitPaneClick,
  ensureOverlaysActorState,
  ensureSearchActorState,
  resetLastClickedNode,
  stopSyncLayout,
  updateFeatures,
  updateInputs,
  updateView,
  xyflow,
} from './machine.actions'
import { type Context, machine } from './machine.setup'
import { initializing, isReady } from './machine.state.initializing'
import { navigating } from './machine.state.navigating'
import { ready } from './machine.state.ready'
import { DiagramToggledFeaturesPersistence } from './persistence'

const _diagramMachine = machine.createMachine({
  initial: 'initializing',
  context: ({ input }): Context => ({
    ...input,
    xyedges: [],
    xynodes: [],
    features: { ...DefaultFeatures },
    toggledFeatures: DiagramToggledFeaturesPersistence.read() ?? {
      enableReadOnly: true,
      enableCompareWithLatest: false,
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
    isReady,
    ready,
    navigating,
  },
  on: {
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
      actions: emitEdgeEditingStarted(),
    },
    'fitDiagram': {
      guard: 'enabled: FitView',
      actions: xyflow.fitDiagram(),
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
        updateView(),
      ],
    },
    'update.inputs': {
      actions: updateInputs(),
    },
    'update.features': {
      actions: [
        updateFeatures(),
        ensureOverlaysActorState(),
        ensureSearchActorState(),
      ],
    },
    'switch.dynamicViewVariant': {
      actions: assignDynamicViewVariant(),
    },
    'emit.onChange': {
      actions: emitOnChange(),
    },
    'emit.onLayoutTypeChange': {
      actions: emitOnLayoutTypeChange(),
    },
  },
  exit: [
    stopSyncLayout(),
    cancelFitDiagram(),
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

export type {
  Context as DiagramContext,
  EmittedEvents as DiagramEmittedEvents,
} from './machine.setup'

/**
 * Here is a trick to reduce inference types
 */
type InferredDiagramMachine = typeof _diagramMachine
export interface DiagramMachineLogic extends InferredDiagramMachine {}
export const diagramMachine: DiagramMachineLogic = _diagramMachine as any
