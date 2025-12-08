import { type NodeId, BBox } from '@likec4/core/types'
import { invariant, nonNullable } from '@likec4/core/utils'
import type { Viewport } from '@xyflow/system'
import { isTruthy } from 'remeda'
import { assertEvent, enqueueActions } from 'xstate'
import { convertToXYFlow } from '../convert-to-xyflow'
import { mergeXYNodesEdges } from './assign'
import {
  cancelFitDiagram,
  disableCompareWithLatest,
  raiseFitDiagram,
  raiseSetViewport,
} from './machine.actions'
import { machine, targetState } from './machine.setup'
import { calcViewportForBounds, findCorrespondingNode, findNodeByModelFqn, nodeRef } from './utils'

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
          xyflow,
          xystore,
          navigationHistory: {
            currentIndex,
            history,
          },
        } = context

        const eventWithXYData = 'xynodes' in event ? event : {
          ...event,
          ...convertToXYFlow({
            dynamicViewVariant: context.dynamicViewVariant,
            view: event.view,
            where: context.where,
          }),
        }

        invariant(xyflow, 'xyflow is not initialized')

        // Make 80% zoom step towards the target viewport if zooming out,
        // and 40% if zooming in, to make the transition smoother
        const calcZoomTowardsNextViewport = (nextViewport: Viewport) => {
          const zoom = xyflow.getZoom()
          const coef = nextViewport.zoom < zoom ? 0.8 : 0.4
          return zoom + (nextViewport.zoom - zoom) * coef
        }

        const fromHistory = history[currentIndex]
        if (fromHistory && fromHistory.viewId === event.view.id) {
          enqueue.assign({
            ...mergeXYNodesEdges(context, eventWithXYData),
            dynamicViewVariant: fromHistory.dynamicViewVariant ?? context.dynamicViewVariant,
            viewportChangedManually: fromHistory.viewportChangedManually,
          })
          const wasFocused = fromHistory.focusedNode
          const wasActiveWalkthrough = fromHistory.activeWalkthrough
          const viewportBefore = fromHistory.viewportBefore

          if (viewportBefore && (wasFocused || wasActiveWalkthrough)) {
            // Restore viewport before focusing or starting walkthrough
            enqueue.assign({
              viewport: viewportBefore.value,
              viewportChangedManually: viewportBefore.wasChangedManually,
              viewportBefore: null,
            })
          }

          const center = BBox.center(event.view.bounds)
          const zoom = calcZoomTowardsNextViewport(fromHistory.viewport)
          xyflow.setCenter(
            center.x,
            center.y,
            { zoom, duration: 0 },
          )

          if (wasFocused) {
            enqueue.raise({
              type: 'focus.node',
              nodeId: wasFocused,
            }, { delay: 50 })
            return
          }
          if (wasActiveWalkthrough) {
            enqueue.raise({
              type: 'walkthrough.start',
              stepId: wasActiveWalkthrough,
            }, { delay: 50 })
            return
          }

          // Fit viewport from history
          enqueue(raiseSetViewport({
            delay: 80,
            viewport: fromHistory.viewport,
          }))
          return
        }

        const nextViewport = calcViewportForBounds(
          context,
          event.view.bounds,
        )

        const { fromNode, toNode } = findCorrespondingNode(context, eventWithXYData)
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
          const zoom = calcZoomTowardsNextViewport(nextViewport)
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
          viewportChangedManually: false,
        })

        // Check if we need to focus on a specific element after navigation (from search)
        const focusOnElement = context.lastOnNavigate?.focusOnElement
        const nodeToFocus = isTruthy(focusOnElement)
          ? findNodeByModelFqn(event.xynodes, focusOnElement)
          : null

        enqueue.assign({
          ...mergeXYNodesEdges(context, eventWithXYData),
          viewportChangedManually: false,
          lastOnNavigate: null,
          navigationHistory: {
            currentIndex: updatedHistory.length - 1,
            history: updatedHistory,
          },
        })

        if (nodeToFocus) {
          // Focus on the searched element with auto-unfocus enabled
          enqueue.raise({
            type: 'focus.node',
            nodeId: nodeToFocus.id as NodeId,
            autoUnfocus: true,
          }, { delay: 150 })
        } else {
          enqueue(raiseFitDiagram({
            delay: 100,
          }))
        }
      }),
    ],
  },
})
