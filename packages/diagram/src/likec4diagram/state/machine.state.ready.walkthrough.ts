import {
  invariant,
  nonNullable,
} from '@likec4/core'
import {
  type Predicate,
  dynamicViewFlow,
  flowHelpers,
  isDynamicView,
  isStepPath,
  parentFlow,
} from '@likec4/core/types'
import { clamp, firstBy, isNumber } from 'remeda'
import { assertEvent, enqueueActions } from 'xstate'
import { assign, raise } from 'xstate/actions'
import { Base } from '../../base'
import { roundDpr } from '../../utils'
import type { Types } from '../types'
import {
  assignLastClickedNode,
  assignViewportBefore,
  cancelEditing,
  cancelFitDiagram,
  emitEdgeClick,
  emitPaneClick,
  fitFocusedBounds,
  resetLastClickedNode,
  resetSelection,
  returnViewportBefore,
  startHotKeyActor,
  stopHotKeyActor,
  updateView,
} from './machine.actions'
import { type Context, machine, targetState, to } from './machine.setup'

const byId = (id: string) => <E extends Types.AnyEdge>(e: E): e is E & { data: { stepnum: number } } =>
  e.data.id === id && isNumber(e.data.stepnum)

const outlinePanelWidth = ({ activeWalkthrough, xystore }: Pick<Context, 'activeWalkthrough' | 'xystore'>) => {
  if (activeWalkthrough) {
    return activeWalkthrough.outlinePanelWidth
  }
  const { width } = xystore.getState()
  return clamp(roundDpr(width * 0.3), {
    min: 180,
    max: 400,
  })
}

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
    if (context.view.flow && context.dynamicViewVariant == 'sequence') {
      const flow = dynamicViewFlow(context.view)
      processedSteps = new Set(flow.stepPathsBefore(stepId))
    } else {
      processedSteps = new Set()
    }

    const hasActive = activeFlow ? flowHelpers.includes(stepId) : () => false

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
        if (isNumber(edge.data.stepnum) && edge.data.stepnum <= step.data.stepnum) {
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
          if (hasActive(node.data.flowId)) {
            return Base.setData(node, {
              activePath: activeFlow!,
              dimmed: false,
            })
          }
          if (processedSteps.has(node.data.flowId)) {
            return Base.setData(node, {
              activePath: null,
              dimmed: false,
            })
          }
          return Base.setData(node, {
            activePath: null,
            dimmed: true,
          })
        }
        return Base.setDimmed(node, dimmed)
      }),
    })
    enqueue(resetSelection())
  })

const clearWalkthroughState = () =>
  machine.assign(({ context }) => {
    return ({
      activeWalkthrough: null,
      xynodes: context.xynodes.map(n => {
        if (n.type === 'seq-subflow') {
          return Base.setData(n, {
            activePath: null,
            dimmed: false,
          })
        }
        return Base.setDimmed(n, false)
      }),
      xyedges: context.xyedges.map(Base.setData({
        state: null,
        dimmed: false,
        active: false,
      })),
    })
  })

const emitWalkthroughStarted = () =>
  machine.emit(({ context }) => {
    const edge = nonNullable(
      context.xyedges.find(x => x.data.id === context.activeWalkthrough?.stepId),
      'Walkthrough step not found',
    )
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
    const stepId = nonNullable(context.activeWalkthrough?.stepId)
    const edge = nonNullable(
      context.xyedges.find(x => x.data.id === stepId),
      `Walkthrough step edge ${stepId} not found`,
    )
    return {
      type: 'walkthroughStep',
      edge,
      stepId,
    }
  })

export const walkthrough = machine.createStateConfig({
  id: targetState.walkthrough.slice(1),
  entry: [
    cancelEditing(),
    cancelFitDiagram(),
    assignViewportBefore(),
    assign(({ context, event }) => {
      assertEvent(event, 'walkthrough.start')
      const stepId = event.stepId
        // or just take first
        ?? firstBy(context.xyedges, (e) => isStepPath(e.data.id))?.data.id

      return {
        activeWalkthrough: isStepPath(stepId)
          ? {
            stepId,
            activeFlow: parentFlow(stepId),
            outlinePanelWidth: outlinePanelWidth(context),
          }
          : null,
      }
    }),
    updateActiveWalkthroughState(),
    fitFocusedBounds(),
    emitWalkthroughStarted(),
    startHotKeyActor(),
  ],
  exit: [
    stopHotKeyActor(),
    cancelFitDiagram(),
    clearWalkthroughState(),
    resetSelection(),
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
        enqueueActions(({ enqueue, context, event }) => {
          let predicate: Predicate<Types.AnyEdge>
          if (event.direction) {
            const { stepId } = nonNullable(context.activeWalkthrough, 'walkthrough.step: activeWalkthrough is null')
            const step = nonNullable(context.xyedges.find(byId(stepId)))
            const nextStepNum = step.data.stepnum + (event.direction === 'next' ? 1 : -1)
            predicate = (edge) => edge.data.stepnum === nextStepNum
          } else {
            predicate = (edge) => edge.data.id === event.stepId
          }
          const nextStepId = context.xyedges.find(predicate)?.data.id
          if (!isStepPath(nextStepId) || context.activeWalkthrough?.stepId === nextStepId) {
            return
          }
          enqueue.assign({
            activeWalkthrough: {
              stepId: nextStepId,
              activeFlow: parentFlow(nextStepId),
              outlinePanelWidth: outlinePanelWidth(context),
            },
          })
          enqueue(updateActiveWalkthroughState())
          enqueue(fitFocusedBounds())
          enqueue(emitWalkthroughStep())
        }),
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
          assign(({ event, context }) => {
            invariant(event.edge.type === 'seq-step', `Expected seq-step edge, but got "${event.edge.type}"`)
            const stepId = event.edge.data.id
            return {
              activeWalkthrough: {
                stepId,
                activeFlow: parentFlow(stepId),
                outlinePanelWidth: outlinePanelWidth(context),
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
    'xyflow.nodeClick': {
      guard: ({ event: { node } }) => node.type === 'seq-subflow',
      actions: [
        enqueueActions(({ enqueue, event: { node }, context }) => {
          invariant(node.type === 'seq-subflow')
          invariant(isDynamicView(context.view))
          const flow = dynamicViewFlow(context.view)
          const nextStepId = flow.firstStep(node.data.flowId) ?? flow.firstStep()
          if (nextStepId !== context.activeWalkthrough?.stepId) {
            enqueue.raise({
              type: 'walkthrough.step',
              stepId: nextStepId,
            })
            return
          }
          if (context.lastClickedNode?.id === node.id && context.lastClickedNode.clicks > 2) {
            enqueue.raise({
              type: 'walkthrough.end',
            })
          }
        }),
        assignLastClickedNode(),
      ],
    },
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
      ...to.idle,
    },
    'xyflow.paneDblClick': {
      actions: [
        resetLastClickedNode(),
        emitPaneClick(),
      ],
      ...to.idle,
    },
  },
})
