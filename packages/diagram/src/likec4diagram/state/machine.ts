import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import type { ActorRef, SnapshotFrom, StateValueFrom } from 'xstate'
import { assign, stopChild } from 'xstate/actions'
import type { BaseEditorActorRef } from '../../editor/actor/setup'
import type { NavigationPanelActorRef } from '../../navigationpanel/actor'
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
  BaseDiagramMachineLogic,
  EmittedEvents as DiagramEmittedEvents,
  Events as DiagramEvents,
} from './machine.setup'
import {
  Context as DiagramContext,
  machine,
} from './machine.setup'
import { initializing, isReady } from './machine.state.initializing'
import { navigating } from './machine.state.navigating'
import { ready } from './machine.state.ready'

const _diagramMachine = machine.createMachine({
  initial: 'initializing',
  context: DiagramContext,
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
    'xyflow.applyChanges': {
      actions: assign(({ context, event }) => {
        return {
          xynodes: event.nodes ? applyNodeChanges(event.nodes, context.xynodes) : context.xynodes,
          xyedges: event.edges ? applyEdgeChanges(event.edges, context.xyedges) : context.xyedges,
        }
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

export interface DiagramMachineLogic extends
  BaseDiagramMachineLogic<
    {
      overlays: OverlaysActorRef | undefined
      search: SearchActorRef | undefined
      editor: BaseEditorActorRef | undefined
      navigationPanel: NavigationPanelActorRef | undefined
    },
    StateValueFrom<typeof _diagramMachine>
  > {}

/**
 * Here is a trick to reduce inference types
 */
export const diagramMachine: DiagramMachineLogic = _diagramMachine as any

export type DiagramMachineSnapshot = SnapshotFrom<DiagramMachineLogic>

export interface DiagramMachineRef extends ActorRef<DiagramMachineSnapshot, DiagramEvents, DiagramEmittedEvents> {}

export type {
  DiagramContext,
  DiagramEmittedEvents,
  DiagramEvents,
}
