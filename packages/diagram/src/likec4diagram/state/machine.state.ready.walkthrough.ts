import {
  type StepEdgeId,
  getParallelStepsPrefix,
  invariant,
  isStepEdgeId,
  nonNullable,
} from '@likec4/core'
import { clamp, first } from 'remeda'
import { assertEvent } from 'xstate'
import { assign, enqueueActions, raise } from 'xstate/actions'
import { Base } from '../../base'
import { SeqParallelAreaColor } from '../xyflow-sequence/const'
import {
  assignViewportBefore,
  cancelEditing,
  cancelFitDiagram,
  emitEdgeClick,
  fitFocusedBounds,
  returnViewportBefore,
  startHotKeyActor,
  stopHotKeyActor,
  undimEverything,
  updateView,
} from './machine.actions'
import { machine, targetState } from './machine.setup'

const updateActiveWalkthroughState = () =>
  machine.enqueueActions(({ context, enqueue }) => {
    const { activeWalkthrough } = context
    if (!activeWalkthrough) {
      console.warn('Active walkthrough is null')
      enqueue.raise({ type: 'walkthrough.end' })
      return
    }
    const { stepId, parallelPrefix } = activeWalkthrough
    const step = context.xyedges.find(x => x.id === stepId)
    if (!step) {
      console.warn('Invalid walkthrough stepId:', stepId)
      enqueue.raise({ type: 'walkthrough.end' })
      return
    }

    enqueue.assign({
      xyedges: context.xyedges.map(edge => {
        const active = stepId === edge.id || (!!parallelPrefix && edge.id.startsWith(parallelPrefix))
        return Base.setData(edge, {
          active,
          dimmed: stepId !== edge.id,
        })
      }),
      xynodes: context.xynodes.map(node => {
        const dimmed = step.source !== node.id && step.target !== node.id
        if (node.type === 'seq-parallel') {
          return Base.setData(node, {
            color: parallelPrefix === node.data.parallelPrefix
              ? SeqParallelAreaColor.active
              : SeqParallelAreaColor.default,
            dimmed,
          })
        }
        return Base.setDimmed(node, dimmed)
      }),
    })
  })

const emitWalkthroughStarted = () =>
  machine.emit(({ context }) => {
    const edge = context.xyedges.find(x => x.id === context.activeWalkthrough?.stepId)
    invariant(edge, 'Invalid walkthrough state')
    return {
      type: 'walkthroughStarted',
      edge,
    }
  })

// Emit actions that don't depend on other actions
const emitWalkthroughStopped = () =>
  machine.emit(() => ({
    type: 'walkthroughStopped',
  }))

const emitWalkthroughStep = () =>
  machine.emit(({ context }) => {
    const edge = context.xyedges.find(x => x.id === context.activeWalkthrough?.stepId)
    invariant(edge, 'Invalid walkthrough state')
    return {
      type: 'walkthroughStep',
      edge,
    }
  })

export const walkthrough = machine.createStateConfig({
  id: targetState.walkthrough.slice(1),
  entry: [
    startHotKeyActor(),
    cancelEditing(),
    cancelFitDiagram(),
    assignViewportBefore(),
    assign({
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
    fitFocusedBounds(),
    emitWalkthroughStarted(),
  ],
  exit: [
    stopHotKeyActor(),
    enqueueActions(({ enqueue, context }) => {
      enqueue.assign({
        activeWalkthrough: null,
      })
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
    }),
    undimEverything(),
    returnViewportBefore(),
    emitWalkthroughStopped(),
  ],
  on: {
    'key.esc': {
      target: targetState.idle,
    },
    'key.arrow.left': {
      actions: raise({ type: 'walkthrough.step', direction: 'previous' }),
    },
    'key.arrow.up': {
      actions: raise({ type: 'walkthrough.step', direction: 'previous' }),
    },
    'key.arrow.right': {
      actions: raise({ type: 'walkthrough.step', direction: 'next' }),
    },
    'key.arrow.down': {
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
          const nextStepId = nonNullable(context.xyedges[nextStepIndex]).id as StepEdgeId
          return {
            activeWalkthrough: {
              stepId: nextStepId,
              parallelPrefix: getParallelStepsPrefix(nextStepId),
            },
          }
        }),
        updateActiveWalkthroughState(),
        fitFocusedBounds(),
        emitWalkthroughStep(),
      ],
    },
    'xyflow.edgeClick': [
      {
        guard: 'click: active walkthrough step',
        actions: [
          fitFocusedBounds(),
          emitEdgeClick(),
        ],
      },
      {
        actions: [
          assign(({ event }) => {
            const stepId = event.edge.id
            invariant(isStepEdgeId(stepId))
            return {
              activeWalkthrough: {
                stepId,
                parallelPrefix: getParallelStepsPrefix(stepId),
              },
            }
          }),
          updateActiveWalkthroughState(),
          fitFocusedBounds(),
          emitEdgeClick(),
          emitWalkthroughStep(),
        ],
      },
    ],
    'notations.unhighlight': {
      actions: updateActiveWalkthroughState(),
    },
    'tag.unhighlight': {
      actions: updateActiveWalkthroughState(),
    },
    'update.view': {
      guard: 'is same view',
      actions: [
        updateView(),
        updateActiveWalkthroughState(),
      ],
    },
    'walkthrough.end': {
      target: targetState.idle,
    },
    'xyflow.paneDblClick': {
      target: targetState.idle,
    },
  },
})
