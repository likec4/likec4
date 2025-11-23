import type { StepEdgeId } from '@likec4/core'
import { enqueueActions, log, raise } from 'xstate/actions'
import { and, or } from 'xstate/guards'
import {
  assignFocusedNode,
  assignLastClickedNode,
  emitEdgeClick,
  emitNodeClick,
  emitOpenSource,
  emitPaneClick,
  fitDiagram,
  openElementDetails,
  openSourceOfFocusedOrLastClickedNode,
  resetLastClickedNode,
} from './machine.actions'
import { machine, targetState } from './machine.setup'

export const idle = machine.createStateConfig({
  id: targetState.idle.slice(1),
  on: {
    'xyflow.nodeClick': [
      {
        guard: and([
          'enabled: Readonly',
          'enabled: FocusMode',
          'click: node has connections',
          or([
            'click: same node',
            'click: selected node',
          ]),
        ]),
        actions: [
          assignLastClickedNode(),
          assignFocusedNode(),
          emitNodeClick(),
        ],
        target: targetState.focused,
      },
      {
        guard: and([
          'enabled: Readonly',
          'enabled: ElementDetails',
          'click: node has modelFqn',
          or([
            'click: same node',
            'click: selected node',
          ]),
        ]),
        actions: [
          assignLastClickedNode(),
          openSourceOfFocusedOrLastClickedNode(),
          openElementDetails(),
          emitNodeClick(),
        ],
      },
      {
        actions: [
          assignLastClickedNode(),
          openSourceOfFocusedOrLastClickedNode(),
          emitNodeClick(),
        ],
      },
    ],
    'xyflow.paneClick': {
      actions: [
        resetLastClickedNode(),
        emitPaneClick(),
      ],
    },
    'xyflow.paneDblClick': {
      actions: [
        resetLastClickedNode(),
        enqueueActions(({ context, enqueue, check }) => {
          if (check('enabled: FitView')) {
            enqueue(fitDiagram())
          }
          enqueue(
            emitOpenSource({ view: context.view.id }),
          )
        }),
      ],
    },
    'focus.node': {
      guard: 'enabled: FocusMode',
      actions: assignFocusedNode(),
      target: targetState.focused,
    },
    'xyflow.edgeClick': {
      guard: and([
        'enabled: Readonly',
        'is dynamic view',
        'enabled: DynamicViewWalkthrough',
        'click: selected edge',
      ]),
      actions: [
        resetLastClickedNode(),
        raise(({ event }) => ({
          type: 'walkthrough.start',
          stepId: event.edge.id as StepEdgeId,
        })),
        emitEdgeClick(),
      ],
    },
  },
})
