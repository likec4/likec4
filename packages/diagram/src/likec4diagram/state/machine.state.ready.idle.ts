import { type StepPath, dynamicViewFlow, invariant, isDynamicView, nonNullable } from '@likec4/core'
import { raise } from 'xstate/actions'
import { and, not, or } from 'xstate/guards'
import {
  assignFocusedNode,
  assignLastClickedNode,
  emitEdgeClick,
  emitNodeClick,
  emitOpenSourceOfView,
  emitPaneClick,
  openElementDetails,
  openSourceOfFocusedOrLastClickedNode,
  raiseFitDiagram,
  resetLastClickedNode,
  resetSelection,
} from './machine.actions'
import { machine, targetState, to } from './machine.setup'

export const idle = machine.createStateConfig({
  id: targetState.idle.slice(1),
  on: {
    'xyflow.nodeClick': [
      {
        description: 'Handle sequence subflow click in sequence variant',
        guard: and([
          'is dynamic view in sequence variant',
          ({ event }) => event.node.type === 'seq-subflow',
          'click: same node',
        ]),
        actions: raise(({ event: { node }, context }) => {
          invariant(node.type === 'seq-subflow')
          invariant(isDynamicView(context.view))
          const flow = dynamicViewFlow(context.view)
          const stepId = flow.firstStep(node.data.flowId) ?? flow.firstStep()
          return ({
            type: 'walkthrough.start',
            stepId,
          })
        }),
      },
      {
        description: 'Handle sequence subflow click in sequence variant',
        guard: and([
          'is dynamic view in sequence variant',
          ({ event }) => event.node.type === 'seq-subflow',
        ]),
        actions: [
          assignLastClickedNode(),
        ],
      },
      {
        guard: and([
          'enabled: Readonly',
          'enabled: FocusMode',
          not('is dynamic view in sequence variant'),
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
        ...to.focused,
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
        resetSelection(),
        raiseFitDiagram(),
        emitOpenSourceOfView(),
        emitPaneClick(),
      ],
    },
    'focus.node': [
      // Focus was initialed by the user searching (autoUnfocus=true) - always allowed
      {
        guard: 'focus.node: autoUnfocus',
        actions: assignFocusedNode(),
        ...to.focused,
      },
      // Regular focus - requires FocusMode to be enabled
      {
        guard: 'enabled: FocusMode',
        actions: assignFocusedNode(),
        ...to.focused,
      },
    ],
    'xyflow.edgeClick': {
      guard: and([
        'enabled: Readonly',
        'enabled: DynamicViewWalkthrough',
        'is dynamic view',
        'click: selected edge',
      ]),
      actions: [
        resetLastClickedNode(),
        raise(({ event }) => ({
          type: 'walkthrough.start',
          stepId: event.edge.data.id as StepPath,
        })),
        emitEdgeClick(),
      ],
    },
  },
})
