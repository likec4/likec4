import { type NodeId, BBox } from '@likec4/core/types'
import { invariant, nonNullable } from '@likec4/core/utils'
import type { Viewport } from '@xyflow/system'
import { isTruthy } from 'remeda'
import { assertEvent, enqueueActions } from 'xstate'
import { roundDpr } from '../../utils'
import { parsePaddings } from '../../utils/xyflow'
import { convertToXYFlow } from '../convert-to-xyflow'
import { mergeXYNodesEdges } from './assign'
import {
  cancelFitDiagram,
  disableCompareWithLatest,
  raiseSetViewport,
} from './machine.actions'
import { machine, targetState } from './machine.setup'
import { calcViewportForBounds, findCorrespondingNode, findNodeByModelFqn, nodeRef, viewBounds } from './utils'

/**
 * If the user navigates back or forward using the browser's back/forward buttons,
 * update the navigation history and return to the previous or next view.
 */
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
    const stepBack = currentIndex > 0 ? history.at(currentIndex - 1) : null
    if (stepBack && stepBack.viewId === event.view.id) {
      return {
        navigationHistory: {
          currentIndex: currentIndex - 1,
          history,
        },
        lastOnNavigate: null,
      }
    }
    const stepForward = currentIndex < history.length - 1 ? history.at(currentIndex + 1) : null
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
            currentViewId: context.view.id,
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
          const diff = nextViewport.zoom - zoom
          if (Math.abs(diff) < 0.01) {
            return nextViewport.zoom
          }
          const coef = diff < 0 ? 0.8 : 0.4
          return zoom + diff * coef
        }

        // Calculate the center of the next viewport (using the next bounds and paddings)
        const calcCenterTowardsNextViewport = (nextViewport: Viewport, nextBounds: BBox) => {
          const zoom = calcZoomTowardsNextViewport(nextViewport)
          const { width, height } = nonNullable(context.xystore).getState()
          const padding = parsePaddings(context.fitViewPadding, width, height)
          const center = BBox.center({
            x: nextBounds.x,
            y: nextBounds.y,
            width: nextBounds.width + padding.x / zoom,
            height: nextBounds.height + padding.y / zoom,
          })
          return {
            x: roundDpr(center.x),
            y: roundDpr(center.y),
            zoom,
          }
        }

        const fromHistory = history[currentIndex]
        if (fromHistory && fromHistory.viewId === eventWithXYData.view.id) {
          const {
            focusedNode: wasFocused,
            activeWalkthrough: wasActiveWalkthrough,
            viewportBefore,
          } = fromHistory

          const nextCtx = {
            ...mergeXYNodesEdges(context, eventWithXYData),
            dynamicViewVariant: fromHistory.dynamicViewVariant ?? context.dynamicViewVariant,
            viewportChangedManually: viewportBefore?.wasChangedManually ?? fromHistory.viewportChangedManually,
            viewport: viewportBefore?.value ?? fromHistory.viewport,
            viewportBefore: null,
          } satisfies Partial<typeof context>

          enqueue.assign(nextCtx)

          const zoom = calcZoomTowardsNextViewport(nextCtx.viewport)
          xyflow.setViewport({
            x: nextCtx.viewport.x,
            y: nextCtx.viewport.y,
            zoom,
          }, { duration: 0 })

          if (wasFocused) {
            enqueue.raise({
              type: 'focus.node',
              nodeId: wasFocused,
            }, { delay: 100 })
            return
          }

          if (wasActiveWalkthrough) {
            enqueue.raise({
              type: 'walkthrough.start',
              stepId: wasActiveWalkthrough,
            }, { delay: 100 })
            return
          }

          // Set viewport from history
          enqueue(raiseSetViewport({
            delay: 100,
            ...(nextCtx.viewportChangedManually ? { duration: 0 } : {}),
            viewport: nextCtx.viewport,
          }))
          return
        }

        const nextBounds = viewBounds(context, eventWithXYData.view)

        const nextViewport = calcViewportForBounds(
          context,
          nextBounds,
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
          }).catch((err) => {
            console.error('Error during xyflow.panBy', { err })
          })
        } else {
          const { x, y, zoom } = calcCenterTowardsNextViewport(nextViewport, nextBounds)
          xyflow.setCenter(
            x,
            y,
            { zoom, duration: 0 },
          ).catch((err) => {
            console.error('Error during xyflow.setCenter', { err })
          })
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
          ? findNodeByModelFqn(eventWithXYData.xynodes, focusOnElement)
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

        enqueue(raiseSetViewport({
          delay: 100,
          viewport: nextViewport,
        }))

        if (nodeToFocus) {
          // Focus on the searched element with auto-unfocus enabled
          enqueue.raise({
            type: 'focus.node',
            nodeId: nodeToFocus.id as NodeId,
            autoUnfocus: true,
          }, { delay: 250 })
        }
      }),
    ],
  },
})
