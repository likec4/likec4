import {
  invariant,
  nonNullable,
} from '@likec4/core'
import {
  type StepPath,
  dynamicViewFlow,
  isDynamicView,
  isStepPath,
  parentFlow,
} from '@likec4/core/types'
import { clamp, find } from 'remeda'
import { assertEvent } from 'xstate'
import { assign, raise } from 'xstate/actions'
import { Base } from '../../base'
import type { Types } from '../types'
import {
  assignViewportBefore,
  cancelEditing,
  cancelFitDiagram,
  emitEdgeClick,
  fitFocusedBounds,
  returnViewportBefore,
  startHotKeyActor,
  stopHotKeyActor,
  updateView,
} from './machine.actions'
import { machine, targetState } from './machine.setup'

const byId = (id: string) => (e: Types.AnyEdge): e is Types.SequenceStepEdge =>
  e.type === 'seq-step' && e.data.id === id

const updateActiveWalkthroughState = () =>
  machine.enqueueActions(({ context, enqueue }) => {
    const { activeWalkthrough } = context
    if (!activeWalkthrough) {
      console.warn('Active walkthrough is null')
      enqueue.raise({ type: 'walkthrough.end' })
      return
    }
    const { stepId, activeFlow } = activeWalkthrough
    const step = context.xyedges.find(byId(stepId))
    if (!step) {
      console.warn('Invalid walkthrough stepId:', stepId)
      enqueue.raise({ type: 'walkthrough.end' })
      return
    }
    invariant(isDynamicView(context.view))
    let processedSteps
    if (step.data.index > 0) {
      const flowOps = dynamicViewFlow(context.view)
      processedSteps = new Set(flowOps.stepsBefore(stepId))
    } else {
      processedSteps = new Set()
    }

    enqueue.assign({
      xyedges: context.xyedges.map(edge => {
        if (edge.data.id === step.data.id) {
          return Base.setData(edge, {
            active: true,
            state: 'active',
            dimmed: false,
          })
        }
        if (processedSteps.has(edge.data.id)) {
          return Base.setData(edge, {
            active: false,
            state: 'processed',
            dimmed: false,
          })
        }
        if (edge.data.index <= step.data.index) {
          return Base.setData(edge, {
            active: false,
            state: 'skipped',
            dimmed: true,
          })
        }
        return Base.setData(edge, {
          active: false,
          state: 'pending',
          dimmed: true,
        })
      }),
      xynodes: context.xynodes.map(node => {
        const dimmed = step.source !== node.id && step.target !== node.id
        if (node.type === 'seq-subflow') {
          if (activeFlow?.startsWith(node.data.flowId)) {
            return Base.setData(node, {
              activeBranch: activeFlow,
              dimmed: false,
            })
          }

          return Base.setData(node, {
            activeBranch: undefined,
            dimmed: true,
          })
        }
        return Base.setDimmed(node, dimmed)
      }),
    })
  })

const clearWalkthroughState = () =>
  machine.assign(({ context }) => ({
    activeWalkthrough: null,
    xynodes: context.xynodes.map(n => {
      if (n.type === 'seq-subflow') {
        return Base.setData(n, {
          activeBranch: undefined,
          dimmed: false,
        })
      }
      return Base.setDimmed(n, false)
    }),
    xyedges: context.xyedges.map(e => {
      if (e.type === 'seq-step') {
        return Base.setData(e, {
          state: undefined,
          dimmed: false,
          active: false,
        })
      }
      return Base.setData(e, {
        dimmed: false,
        active: false,
      })
    }),
  }))

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
    assign({
      activeWalkthrough: ({ context, event }) => {
        assertEvent(event, 'walkthrough.start')
        const stepId = event.stepId
          // or just take first
          ?? find(context.xyedges, e => e.type === 'seq-step')?.data.id

        return stepId
          ? {
            stepId,
            activeFlow: parentFlow(stepId),
          }
          : null
      },
    }),
    assignViewportBefore(),
    updateActiveWalkthroughState(),
    fitFocusedBounds(),
    emitWalkthroughStarted(),
  ],
  exit: [
    stopHotKeyActor(),
    returnViewportBefore(),
    clearWalkthroughState(),
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
          const { stepId } = nonNullable(context.activeWalkthrough, 'walkthrough.step: activeWalkthrough is null')
          const stepIndex = context.xyedges.findIndex(e => e.data.id === stepId)
          const nextStepIndex = clamp(event.direction === 'next' ? stepIndex + 1 : stepIndex - 1, {
            min: 0,
            max: context.xyedges.length - 1,
          })
          if (nextStepIndex === stepIndex) {
            return {}
          }
          const nextStep = nonNullable(context.xyedges[nextStepIndex])
          invariant(nextStep.type === 'seq-step')
          return {
            activeWalkthrough: {
              stepId: nextStep.data.id,
              activeFlow: parentFlow(nextStep.data.id),
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
          assign(({ context, event }) => {
            const stepId = event.edge.data.id
            invariant(context.xyedges.find(e => e.data.id === stepId) && isStepPath(stepId))
            return {
              activeWalkthrough: {
                stepId,
                activeFlow: parentFlow(stepId),
              },
            }
          }),
          updateActiveWalkthroughState(),
          fitFocusedBounds({ duration: 600 }),
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
