import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import type { ActorRef, MachineSnapshot, StateMachine } from 'xstate'
import { assign, stopChild } from 'xstate/actions'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import type { EditorActorRef } from '../../editor/editorActor.states'
import type { OverlaysActorRef } from '../../overlays/overlaysActor'
import type { SearchActorRef } from '../../search/searchActor'
import {
  updateEdgeData,
  updateNodeData,
} from './assign'
import {
  assignDynamicViewVariant,
  cancelFitDiagram,
  emitOnLayoutTypeChange,
  raiseUpdateView,
  stopEditorActor,
  triggerChange,
  updateFeatures,
  updateInputs,
} from './machine.actions'
import type {
  Context as DiagramContext,
  EmittedEvents as DiagramEmittedEvents,
  Events as DiagramEvents,
  Input,
} from './machine.setup'
import { machine } from './machine.setup'
import { initializing, isReady } from './machine.state.initializing'
import { navigating } from './machine.state.navigating'
import { ready } from './machine.state.ready'
import { DiagramToggledFeaturesPersistence } from './persistence'

const _diagramMachine = machine.createMachine({
  initial: 'initializing',
  context: ({ input }): DiagramContext => ({
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
    autoUnfocusTimer: false,
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
      guard: ({ context, event }) => context.dynamicViewVariant !== event.variant,
      actions: [
        assignDynamicViewVariant(),
        assign({
          viewportChangedManually: false,
        }),
        raiseUpdateView(),
      ],
    },
    'update.inputs': {
      actions: updateInputs(),
    },
    'update.view-bounds': {
      actions: assign(({ context, event }) => {
        return {
          view: {
            ...context.view,
            bounds: event.bounds,
          },
        }
      }),
    },
    'update.features': {
      actions: updateFeatures(),
    },
    'trigger.change': {
      actions: triggerChange(),
    },
    'emit.onLayoutTypeChange': {
      actions: emitOnLayoutTypeChange(),
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
      actions: assign(({ event, context }) => ({
        viewportChangedManually: context.viewportChangedManually || event.manually,
        viewport: event.viewport,
      })),
    },
    'destroy': {
      target: '.final',
      actions: [
        stopEditorActor(),
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
})

/**
 * Here is a trick to reduce inference types
 */
// type InferredDiagramMachine = typeof _diagramMachine
// export interface DiagramMachineLogic extends InferredDiagramMachine {}
export interface DiagramMachineLogic extends
  StateMachine<
    DiagramContext,
    DiagramEvents,
    {
      overlays: OverlaysActorRef | undefined
      search: SearchActorRef | undefined
      editor: EditorActorRef | undefined
    },
    any,
    any,
    any,
    any,
    any,
    any,
    Input,
    any,
    any,
    any,
    any
  >
{
}

export const diagramMachine: DiagramMachineLogic = _diagramMachine as any

export type DiagramMachineSnapshot = MachineSnapshot<
  DiagramContext,
  DiagramEvents,
  {
    overlays: OverlaysActorRef | undefined
    search: SearchActorRef | undefined
    editor: EditorActorRef | undefined
  },
  any,
  any,
  any,
  {},
  {}
>

export interface DiagramMachineRef extends ActorRef<DiagramMachineSnapshot, DiagramEvents, DiagramEmittedEvents> {}

export type {
  DiagramContext,
  DiagramEmittedEvents,
  DiagramEvents,
}
