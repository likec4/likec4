import { type NodeId, BBox } from '@likec4/core/types'
import { invariant } from '@likec4/core/utils'
import type { Viewport } from '@xyflow/system'
import { isTruthy } from 'remeda'
import { assertEvent, enqueueActions } from 'xstate'
import { roundDpr } from '../../utils/roundDpr'
import { parsePaddings } from '../../utils/xyflow'
import { convertToXYFlow } from '../convert-to-xyflow'
import { mergeXYNodesEdges } from './assign'
import {
  cancelFitDiagram,
  disableCompareWithLatest,
  raiseSetViewport,
} from './machine.actions'
import { machine, targetState, to } from './machine.setup'
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
    ...to.idle,
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

        const currentViewport = xyflow.getViewport()

        // Make 60% zoom step towards the target viewport if zooming out,
        // and 30% if zooming in, to make the transition smoother
        const calcZoomTowardsNextViewport = (nextViewport: Viewport) => {
          const zoom = currentViewport.zoom
          const diff = nextViewport.zoom - zoom
          if (Math.abs(diff) < 0.01) {
            return nextViewport.zoom
          }
          const coef = diff < 0 ? 0.6 : 0.3
          return Math.trunc(10000 * (zoom + diff * coef)) / 10000
        }

        // Move towards the next viewport and raise set viewport if needed
        const moveTowardsNextViewport = (nextViewport: Viewport) => {
          const zoom = calcZoomTowardsNextViewport(nextViewport)

          if (zoom !== nextViewport.zoom) {
            xyflow.setViewport({
              x: roundDpr(nextViewport.x * (1 + currentViewport.zoom - zoom)),
              y: roundDpr(nextViewport.y * (1 + currentViewport.zoom - zoom)),
              zoom,
            })
            enqueue(raiseSetViewport({
              delay: 100,
              viewport: nextViewport,
            }))
          } else {
            xyflow.setViewport(nextViewport, { duration: 0 })
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

          moveTowardsNextViewport(nextCtx.viewport)

          if (wasFocused) {
            enqueue.raise({
              type: 'focus.node',
              nodeId: wasFocused,
            }, { delay: 150 })
            return
          }

          if (wasActiveWalkthrough) {
            enqueue.raise({
              type: 'walkthrough.start',
              stepId: wasActiveWalkthrough,
            }, { delay: 150 })
            return
          }
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

          enqueue(raiseSetViewport({
            delay: 100,
            viewport: nextViewport,
          }))
        } else {
          const zoom = calcZoomTowardsNextViewport(nextViewport)

          if (zoom !== nextViewport.zoom) {
            const { width, height } = context.xystore.getState()
            const nextCenter = BBox.center(nextBounds)
            const paddings = parsePaddings(context.fitViewPadding, width, height)
            // Center next bounds in the viewport
            xyflow.setViewport({
              x: roundDpr(
                (width - paddings.x) / 2
                  - nextCenter.x * zoom
                  + paddings.left,
              ),
              y: roundDpr(
                (height - paddings.y) / 2
                  - nextCenter.y * zoom
                  + paddings.top,
              ),
              zoom,
            })
            enqueue(raiseSetViewport({
              delay: 100,
              viewport: nextViewport,
            }))
          } else {
            xyflow.setViewport(nextViewport, { duration: 0 })
          }
        }

        const updatedHistory = currentIndex < history.length - 1 ? history.slice(0, currentIndex + 1) : [...history]
        if (updatedHistory.length > 20) {
          updatedHistory.shift()
        }
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
