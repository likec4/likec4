import type { NodeId } from '@likec4/core'
import { log, raise } from 'xstate/actions'
import { and } from 'xstate/guards'
import {
  assignFocusedNode,
  assignLastClickedNode,
  assignViewportBefore,
  cancelFitDiagram,
  emitNodeClick,
  emitPaneClick,
  fitFocusedBounds,
  focusOnNodesAndEdges,
  openElementDetails,
  openSourceOfFocusedOrLastClickedNode,
  resetLastClickedNode,
  returnViewportBefore,
  startHotKeyActor,
  stopHotKeyActor,
  undimEverything,
} from './machine.actions'
import { machine, targetState } from './machine.setup'

export const focused = machine.createStateConfig({
  id: targetState.focused.slice(1),
  entry: [
    focusOnNodesAndEdges(),
    assignViewportBefore(),
    openSourceOfFocusedOrLastClickedNode(),
    startHotKeyActor(),
    cancelFitDiagram(),
    fitFocusedBounds(),
  ],
  exit: [
    log('Leaving focused state'),
    stopHotKeyActor(),
    undimEverything(),
    returnViewportBefore(),
    machine.assign({
      focusedNode: null,
    }),
  ],
  on: {
    'xyflow.nodeClick': [
      {
        guard: and([
          'enabled: ElementDetails',
          'click: focused node',
          'click: node has modelFqn',
        ]),
        actions: [
          assignLastClickedNode(),
          openElementDetails(),
          emitNodeClick(),
        ],
      },
      {
        guard: 'click: focused node',
        actions: [
          assignLastClickedNode(),
          emitNodeClick(),
        ],
        target: targetState.idle,
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
        fitFocusedBounds(),
      ],
    },
    'key.esc': {
      target: targetState.idle,
    },
    'xyflow.paneClick': {
      actions: [
        resetLastClickedNode(),
        emitPaneClick(),
      ],
      target: targetState.idle,
    },
    'notations.unhighlight': {
      actions: focusOnNodesAndEdges(),
    },
    'tag.unhighlight': {
      actions: focusOnNodesAndEdges(),
    },
  },
})
