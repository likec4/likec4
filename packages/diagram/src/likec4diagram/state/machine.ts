import type { ComputedStoryView } from '@likec4/core/types'
import { StoryFlow } from '@likec4/core/types'
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import type { ActorRef, SnapshotFrom, StateValueFrom } from 'xstate'
import { enqueueActions } from 'xstate'
import { assign, stopChild } from 'xstate/actions'
import type { BaseEditorActorRef } from '../../editor/actor/setup'
import type { NavigationPanelActorRef } from '../../navigationpanel/actor'
import type { OverlaysActorRef } from '../../overlays/overlaysActor'
import type { SearchActorRef } from '../../search/searchActor'
import type { StoryActorRef } from '../../story/actor'
import { convertToXYFlow } from '../convert-to-xyflow'
import {
  mergeXYNodesEdges,
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
  // Spawns the story cursor actor when the diagram is initially mounted on a
  // story view. Root-level `entry` only runs once (when the machine starts),
  // so this covers "opened directly on a story" but not navigating into a
  // story mid-session — that direction (and the reverse, leaving a story) is
  // `syncStoryActor` in `machine.state.navigating.ts`.
  entry: [
    enqueueActions(({ enqueue, context }) => {
      if (context.view._type !== 'story') {
        return
      }
      enqueue.spawnChild('story', {
        id: 'story',
        systemId: 'story',
        input: {
          // `StoryFlow.from` is typed for `ComputedStoryView`, but only ever
          // reads `.scenes` — identically typed on `ComputedStoryView` and
          // `LayoutedStoryView` (`ReadonlyArray<ComputedStoryScene<A>>` on
          // both). The cast only bridges the phantom `_stage` discriminant,
          // which `StoryFlow` never inspects.
          flow: StoryFlow.from(context.view as unknown as ComputedStoryView),
          // `context.resolve` is already the real, model-bound resolver by
          // the time this runs: `DiagramActorProvider.tsx` supplies it as
          // machine `input`, populated from `useOptionalResolveSceneView()`,
          // before this actor is even created. Only falls back to `() =>
          // null` (every scene reads as non-dynamic) for callers with no
          // model, e.g. this file's own test suites.
          resolve: context.resolve,
        },
      })
    }),
  ],
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
    // Distinct from `update.view`: intentionally does NOT push
    // `navigationHistory` (contrast with the history push in
    // `machine.state.navigating.ts:247-255`), so advancing a story scene never
    // pollutes browser back/forward. See RFC 0001, "Diagram integration", and
    // the JSDoc on this event in `machine.setup.ts`.
    'story.scene': {
      actions: assign(({ context, event }) => {
        const { view, xynodes, xyedges } = convertToXYFlow({
          currentViewId: context.view.id,
          dynamicViewVariant: context.dynamicViewVariant,
          view: event.view,
          where: context.where,
          collapsedSequenceFlows: context.collapsedSequenceFlows,
        })
        return {
          ...mergeXYNodesEdges(context, { view, xynodes, xyedges }),
          activeStoryCursor: event.cursor,
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
        stopChild('story'),
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
      story: StoryActorRef | undefined
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
