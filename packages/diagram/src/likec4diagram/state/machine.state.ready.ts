import { type NodeId, type StepEdgeId, getParallelStepsPrefix, isStepEdgeId } from '@likec4/core'
import { clamp, first } from 'remeda'
import { assertEvent } from 'xstate'
import { assign, emit, enqueueActions, raise, sendTo, spawnChild } from 'xstate/actions'
import { and, or } from 'xstate/guards'
import { Base } from '../../base'
import { SeqParallelAreaColor } from '../xyflow-sequence/const'
import { navigateBack, navigateForward, resetEdgesControlPoints } from './assign'
import {
  assignFocusedNode,
  assignLastClickedNode,
  cancelFitDiagram,
  disableCompareWithLatest,
  emitEdgeClick,
  emitNodeClick,
  emitOpenSource,
  emitPaneClick,
  emitWalkthroughStarted,
  emitWalkthroughStep,
  emitWalkthroughStopped,
  focusOnNodesAndEdges,
  layoutAlign,
  notationsHighlight,
  onEdgeDoubleClick,
  onEdgeMouseEnter,
  onEdgeMouseLeave,
  onNodeMouseEnter,
  onNodeMouseLeave,
  openElementDetails,
  openSourceOfFocusedOrLastClickedNode,
  raiseFitDiagram,
  resetLastClickedNode,
  scheduleSyncLayout,
  startSyncLayout,
  stopSyncLayout,
  tagHighlight,
  toggleFeature,
  undimEverything,
  updateActiveWalkthroughState,
  xyflow,
} from './machine.actions'
import { machine } from './machine.setup'
import { typedSystem } from './utils'

const navigating = '#navigating'

export const idle = machine.createStateConfig({
  id: 'idle',
  on: {
    'xyflow.nodeClick': [
      {
        guard: and([
          'enabled: FocusMode',
          'click: node has connections',
          or([
            'click: same node',
            'click: selected node',
          ]),
        ]),
        actions: [
          assignLastClickedNode(),
          assignFocusedNode(),
          emitNodeClick(),
        ],
        target: 'focused',
      },
      {
        guard: and([
          'enabled: Readonly',
          'enabled: ElementDetails',
          'click: node has modelFqn',
          or([
            'click: same node',
            'click: selected node',
          ]),
        ]),
        actions: [
          assignLastClickedNode(),
          openSourceOfFocusedOrLastClickedNode(),
          openElementDetails(),
          emitNodeClick(),
        ],
      },
      {
        actions: [
          assignLastClickedNode(),
          openSourceOfFocusedOrLastClickedNode(),
          emitNodeClick(),
        ],
      },
    ],
    'xyflow.paneClick': {
      actions: [
        resetLastClickedNode(),
        emitPaneClick(),
      ],
    },
    'xyflow.paneDblClick': {
      actions: [
        resetLastClickedNode(),
        xyflow.fitDiagram(),
        ({ context }) => emitOpenSource({ view: context.view.id }),
      ],
    },
    'focus.node': {
      guard: 'enabled: FocusMode',
      actions: assignFocusedNode(),
      target: 'focused',
    },
    'xyflow.edgeClick': {
      guard: and([
        'enabled: Readonly',
        'is dynamic view',
        'enabled: DynamicViewWalkthrough',
        'click: selected edge',
      ]),
      actions: [
        raise(({ event }) => ({
          type: 'walkthrough.start',
          stepId: event.edge.id as StepEdgeId,
        })),
        emitEdgeClick(),
      ],
    },
  },
})

export const focused = machine.createStateConfig({
  entry: [
    focusOnNodesAndEdges(),
    assign(s => ({
      viewportBeforeFocus: { ...s.context.viewport },
    })),
    openSourceOfFocusedOrLastClickedNode(),
    spawnChild('hotkeyActorLogic', { id: 'hotkey' }),
    xyflow.fitFocusedBounds(),
  ],
  exit: enqueueActions(({ enqueue, context }) => {
    enqueue.stopChild('hotkey')
    if (context.viewportBeforeFocus) {
      enqueue(xyflow.setViewport({ viewport: context.viewportBeforeFocus }))
    } else {
      enqueue.raise({ type: 'fitDiagram' }, { id: 'fitDiagram', delay: 20 })
    }
    enqueue(undimEverything())
    enqueue.assign({
      viewportBeforeFocus: null,
      focusedNode: null,
    })
  }),
  on: {
    'xyflow.nodeClick': [
      {
        guard: and([
          'click: focused node',
          'click: node has modelFqn',
        ]),
        actions: [
          openElementDetails(),
          emitNodeClick(),
        ],
      },
      {
        guard: 'click: focused node',
        actions: emitNodeClick(),
        target: '#idle',
      },
      {
        actions: [
          assignLastClickedNode(),
          raise(({ event }) => ({
            type: 'focus.node',
            nodeId: event.node.id as NodeId,
          })),
          emitNodeClick(),
        ],
      },
    ],
    'focus.node': {
      actions: [
        assignFocusedNode(),
        focusOnNodesAndEdges(),
        openSourceOfFocusedOrLastClickedNode(),
        xyflow.fitFocusedBounds(),
      ],
    },
    'key.esc': {
      target: 'idle',
    },
    'xyflow.paneClick': {
      actions: [
        resetLastClickedNode(),
        emitPaneClick(),
      ],
      target: 'idle',
    },
    'notations.unhighlight': {
      actions: focusOnNodesAndEdges(),
    },
    'tag.unhighlight': {
      actions: focusOnNodesAndEdges(),
    },
  },
})

export const walkthrough = machine.createStateConfig({
  entry: [
    spawnChild('hotkeyActorLogic', { id: 'hotkey' }),
    assign({
      viewportBeforeFocus: ({ context }) => context.viewport,
      activeWalkthrough: ({ context, event }) => {
        assertEvent(event, 'walkthrough.start')
        const stepId = event.stepId ?? first(context.xyedges)!.id as StepEdgeId
        return {
          stepId,
          parallelPrefix: getParallelStepsPrefix(stepId),
        }
      },
    }),
    updateActiveWalkthroughState(),
    xyflow.fitFocusedBounds(),
    emitWalkthroughStarted(),
  ],
  exit: enqueueActions(({ enqueue, context }) => {
    enqueue.stopChild('hotkey')
    if (context.viewportBeforeFocus) {
      enqueue(xyflow.setViewport({ viewport: context.viewportBeforeFocus }))
    } else {
      enqueue(raiseFitDiagram({ delay: 10 }))
    }
    // Disable parallel areas highlight
    if (context.dynamicViewVariant === 'sequence' && context.activeWalkthrough?.parallelPrefix) {
      enqueue.assign({
        xynodes: context.xynodes.map(n => {
          if (n.type === 'seq-parallel') {
            return Base.setData(n, {
              color: SeqParallelAreaColor.default,
            })
          }
          return n
        }),
      })
    }
    enqueue(undimEverything())
    enqueue.assign({
      activeWalkthrough: null,
      viewportBeforeFocus: null,
    })

    enqueue(emitWalkthroughStopped())
  }),
  on: {
    'key.esc': {
      target: 'idle',
    },
    'key.arrow.left': {
      actions: raise({ type: 'walkthrough.step', direction: 'previous' }),
    },
    'key.arrow.right': {
      actions: raise({ type: 'walkthrough.step', direction: 'next' }),
    },
    'walkthrough.step': {
      actions: [
        assign(({ context, event }) => {
          const { stepId } = context.activeWalkthrough!
          const stepIndex = context.xyedges.findIndex(e => e.id === stepId)
          const nextStepIndex = clamp(event.direction === 'next' ? stepIndex + 1 : stepIndex - 1, {
            min: 0,
            max: context.xyedges.length - 1,
          })
          if (nextStepIndex === stepIndex) {
            return {}
          }
          const nextStepId = context.xyedges[nextStepIndex]!.id as StepEdgeId
          return {
            activeWalkthrough: {
              stepId: nextStepId,
              parallelPrefix: getParallelStepsPrefix(nextStepId),
            },
          }
        }),
        updateActiveWalkthroughState(),
        xyflow.fitFocusedBounds(),
        emitWalkthroughStep(),
      ],
    },
    'xyflow.edgeClick': {
      actions: [
        assign(({ event, context }) => {
          if (!isStepEdgeId(event.edge.id) || event.edge.id === context.activeWalkthrough?.stepId) {
            return {}
          }
          return {
            activeWalkthrough: {
              stepId: event.edge.id,
              parallelPrefix: getParallelStepsPrefix(event.edge.id),
            },
          }
        }),
        updateActiveWalkthroughState(),
        xyflow.fitFocusedBounds(),
        emitEdgeClick(),
        emitWalkthroughStep(),
      ],
    },
    'notations.unhighlight': {
      actions: updateActiveWalkthroughState(),
    },
    'tag.unhighlight': {
      actions: updateActiveWalkthroughState(),
    },
    'walkthrough.end': {
      target: 'idle',
    },
    'xyflow.paneDblClick': {
      target: 'idle',
    },
    // We received another view, close overlay and process event again
    'update.view': {
      guard: 'is another view',
      actions: raise(({ event }) => event, { delay: 50 }),
      target: 'idle',
    },
  },
})

// Navigating to another view (after `navigateTo` event)
export const ready = machine.createStateConfig({
  initial: 'idle',
  on: {
    'navigate.to': {
      guard: 'is another view',
      actions: assign({
        lastOnNavigate: ({ context, event }) => ({
          fromView: context.view.id,
          toView: event.viewId,
          fromNode: event.fromNode ?? null,
        }),
      }),
      target: navigating,
    },
    'navigate.back': {
      guard: ({ context }) => context.navigationHistory.currentIndex > 0,
      actions: assign(navigateBack),
      target: navigating,
    },
    'navigate.forward': {
      guard: ({ context }) => context.navigationHistory.currentIndex < context.navigationHistory.history.length - 1,
      actions: assign(navigateForward),
      target: navigating,
    },
    'layout.align': {
      guard: 'not readonly',
      actions: [
        layoutAlign(),
        scheduleSyncLayout(),
      ],
    },
    'layout.resetEdgeControlPoints': {
      guard: 'not readonly',
      actions: [
        assign(resetEdgesControlPoints),
        scheduleSyncLayout(),
      ],
    },
    'layout.resetManualLayout': {
      guard: 'not readonly',
      actions: [
        stopSyncLayout(),
        disableCompareWithLatest(),
        startSyncLayout(),
        emit({
          type: 'onChange',
          change: {
            op: 'reset-manual-layout',
          },
        }),
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
      actions: emitOpenSource(),
    },
    'walkthrough.start': {
      guard: 'is dynamic view',
      target: '.walkthrough',
    },
    'toggle.feature': {
      actions: toggleFeature(),
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
      guard: 'not readonly',
      actions: onEdgeDoubleClick(),
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
  },
  exit: [
    cancelFitDiagram(),
  ],
  states: {
    idle,
    focused,
    walkthrough,
  },
})
