import type { NodeId } from '@likec4/core'
import { enqueueActions } from 'xstate/actions'
import { updateNavigationHistory } from './assign'
import {
  cancelFitDiagram,
  closeAllOverlays,
  closeSearch,
  disableCompareWithLatest,
  ensureSyncLayout,
  findCorrespondingNode,
  raiseFitDiagram,
  stopSyncLayout,
  trigger,
  updateXYNodesEdges,
  xyflow,
} from './machine.actions'
import { machine } from './machine.setup'

/**
 * State for handling navigation to a different view.
 * Closes overlays and search, stops sync layout and fit diagram actions,
 * then processes the view update and transitions back to idle state.
 */
export const navigating = machine.createStateConfig({
  id: 'navigating',
  entry: [
    closeAllOverlays(),
    closeSearch(),
    stopSyncLayout(),
    cancelFitDiagram(),
    trigger.navigateTo(),
  ],
  on: {
    'update.view': {
      actions: enqueueActions(({ enqueue, context, event }) => {
        enqueue(disableCompareWithLatest())
        const { fromNode, toNode } = findCorrespondingNode(context, event)
        if (fromNode && toNode) {
          enqueue(
            xyflow.alignNodeFromToAfterNavigate({
              fromNode: fromNode.id as NodeId,
              toPosition: {
                x: toNode.data.x,
                y: toNode.data.y,
              },
            }),
          )
        } else {
          enqueue(
            xyflow.setViewportCenter(),
          )
        }
        enqueue.assign(updateNavigationHistory)
        enqueue(updateXYNodesEdges())
        enqueue(ensureSyncLayout())
        enqueue(raiseFitDiagram({ delay: 25 }))
      }),
      target: '#idle',
    },
  },
})
