import { type NodeId, BBox } from '@likec4/core/types'
import { invariant, nonNullable } from '@likec4/core/utils'
import { assertEvent, enqueueActions } from 'xstate'
import { mergeXYNodesEdges } from './assign'
import {
  cancelFitDiagram,
  disableCompareWithLatest,
  raiseFitDiagram,
} from './machine.actions'
import { machine, targetState } from './machine.setup'
import { calcViewportForBounds, findCorrespondingNode, nodeRef } from './utils'

const handleBrowserForwardBackward = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, 'update.view')
    let {
      lastOnNavigate,
      navigationHistory: {
        currentIndex,
        history,
      },
    } = context
    const stepCurrent = history[currentIndex]
    if (!stepCurrent || stepCurrent.viewId === event.view.id || !!lastOnNavigate) {
      return {}
    }
    const stepBack = currentIndex > 0 ? nonNullable(history[currentIndex - 1]) : null
    if (stepBack && stepBack.viewId === event.view.id) {
      return {
        navigationHistory: {
          currentIndex: currentIndex - 1,
          history,
        },
        lastOnNavigate: null,
      }
    }
    const stepForward = currentIndex < history.length - 1 ? nonNullable(history[currentIndex + 1]) : null
    if (stepForward && stepForward.viewId === event.view.id) {
      return {
        navigationHistory: {
          currentIndex: currentIndex + 1,
          history,
        },
        lastOnNavigate: null,
      }
    }

    if (event.view._type === 'element' && event.view.viewOf) {
      const toRef = event.view.viewOf
      const existingNode = context.xynodes.find(n => nodeRef(n) === toRef)
      if (existingNode) {
        return {
          lastOnNavigate: {
            fromView: context.view.id,
            toView: event.view.id,
            fromNode: existingNode.id as NodeId,
          },
        }
      }
    }
    return {}
  })

/**
 * State for handling navigation to a different view.
 * Closes overlays and search, stops sync layout and fit diagram actions,
 * then processes the view update and transitions back to idle state.
 */
export const navigating = machine.createStateConfig({
  id: targetState.navigating.slice(1),
  always: {
    target: targetState.idle,
    actions: [
      cancelFitDiagram(),
      handleBrowserForwardBackward(),
      disableCompareWithLatest(),
      enqueueActions(({ enqueue, context, event }) => {
        assertEvent(event, 'update.view')
        const {
          fitViewPadding,
          xyflow,
          xystore,
          navigationHistory: {
            currentIndex,
            history,
          },
        } = context

        invariant(xyflow, 'xyflow is not initialized')

        const fromHistory = history[currentIndex]
        if (fromHistory && fromHistory.viewId === event.view.id) {
          enqueue.assign({
            ...mergeXYNodesEdges(context, event),
          })
          xyflow.setViewport(fromHistory.viewport)
          return
        }

        const viewport = xyflow.getViewport()
        const nextViewport = calcViewportForBounds(
          context,
          event.view.bounds,
        )

        const { fromNode, toNode } = findCorrespondingNode(context, event)
        if (fromNode && toNode) {
          const elFrom = xyflow.getInternalNode(fromNode.id)!
          const fromPoint = xyflow.flowToScreenPosition({
            x: elFrom.internals.positionAbsolute.x,
            y: elFrom.internals.positionAbsolute.y,
          })
          const toPoint = xyflow.flowToScreenPosition({
            x: toNode.data.x,
            y: toNode.data.y,
          })

          xystore.getState().panBy({
            x: Math.round(fromPoint.x - toPoint.x),
            y: Math.round(fromPoint.y - toPoint.y),
          })
        } else {
          // Make 70% zoom step towards the target viewport if zooming out,
          // and 30% if zooming in, to make the transition smoother
          const coef = nextViewport.zoom < viewport.zoom ? 0.7 : 0.3
          const zoom = viewport.zoom + (nextViewport.zoom - viewport.zoom) * coef
          const center = BBox.center(event.view.bounds)
          xyflow.setCenter(
            center.x,
            center.y,
            { zoom, duration: 0 },
          )
        }

        const updatedHistory = currentIndex < history.length - 1 ? history.slice(0, currentIndex + 1) : [...history]
        updatedHistory.push({
          viewId: event.view.id,
          viewport: { ...nextViewport },
        })

        enqueue.assign({
          ...mergeXYNodesEdges(context, event),
          lastOnNavigate: null,
          navigationHistory: {
            currentIndex: updatedHistory.length - 1,
            history: updatedHistory,
          },
        })

        enqueue(raiseFitDiagram({
          delay: 100,
        }))
      }),
    ],
  },
})
