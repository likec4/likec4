import type { NodeId } from '@likec4/core'
import { assign, raise } from 'xstate/actions'
import { and } from 'xstate/guards'
import {
  assignFocusedNode,
  assignLastClickedNode,
  assignViewportBefore,
  cancelAutoUnfocusTimer,
  cancelFitDiagram,
  emitNodeClick,
  emitPaneClick,
  fitFocusedBounds,
  focusOnNodesAndEdges,
  openElementDetails,
  openSourceOfFocusedOrLastClickedNode,
  resetLastClickedNode,
  returnViewportBefore,
  startAutoUnfocusTimer,
  startHotKeyActor,
  stopHotKeyActor,
  undimEverything,
} from './machine.actions'
import { machine, targetState, to } from './machine.setup'

export const focused = machine.createStateConfig({
  id: targetState.focused.slice(1),
  entry: [
    cancelFitDiagram(),
    focusOnNodesAndEdges(),
    assignViewportBefore(),
    openSourceOfFocusedOrLastClickedNode(),
    startHotKeyActor(),
    fitFocusedBounds(),
    startAutoUnfocusTimer(),
  ],
  exit: [
    stopHotKeyActor(),
    undimEverything(),
    returnViewportBefore(),
    cancelAutoUnfocusTimer(),
    assign({
      focusedNode: null,
      autoUnfocusTimer: false,
    }),
  ],
  on: {
    'focus.autoUnfocus': {
      ...to.idle,
    },
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
        ...to.idle,
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
      ...to.idle,
    },
    'xyflow.paneClick': {
      actions: [
        emitPaneClick(),
      ],
      ...to.idle,
    },
    'notations.unhighlight': {
      actions: focusOnNodesAndEdges(),
    },
    'tag.unhighlight': {
      actions: focusOnNodesAndEdges(),
    },
  },
})
