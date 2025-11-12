import { assign, stopChild } from 'xstate/actions'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import {
  updateEdgeData,
  updateNodeData,
} from './assign'
import {
  assignDynamicViewVariant,
  cancelFitDiagram,
  emitOnChange,
  emitOnLayoutTypeChange,
  ensureOverlaysActorState,
  ensureSearchActorState,
  stopSyncLayout,
  updateFeatures,
  updateInputs,
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
    viewportBefore: null,
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
    final: {
      type: 'final',
      entry: [
        stopSyncLayout(),
        cancelFitDiagram(),
        stopChild('hotkey'),
        stopChild('overlays'),
        stopChild('search'),
        stopChild('mediaPrint'),
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
    },
  },
  on: {
    'update.nodeData': {
      actions: assign(updateNodeData),
    },
    'update.edgeData': {
      actions: assign(updateEdgeData),
    },
    'switch.dynamicViewVariant': {
      actions: assignDynamicViewVariant(),
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
    'emit.onChange': {
      actions: emitOnChange(),
    },
    'emit.onLayoutTypeChange': {
      actions: emitOnLayoutTypeChange(),
    },
    'destroy': {
      target: '.final',
    },
  },
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
