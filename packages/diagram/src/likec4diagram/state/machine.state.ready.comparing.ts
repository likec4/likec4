import { assign } from 'xstate/actions'
import { and, not, or } from 'xstate/guards'
import {
  assignLastClickedNode,
  beforeLayoutTypeChangeWhileComparing,
  cancelEditing,
  emitNodeClick,
  emitOnLayoutTypeChange,
  exitComparingLayouts,
  openNodeDetails,
  openSourceOfFocusedOrLastClickedNode,
  triggerChange,
  updateView,
} from './machine.actions'
import { ComparingTag, machine, targetState, to } from './machine.setup'

/**
 * State when comparing manual layout with the latest auto layout.
 *
 * - Entered on `compare.start` (from `idle` or `focused`), if the view has layout drifts
 * - Left on `compare.end`, manual layout reset, printing or navigation,
 *   or automatically when drifts are gone or the feature is disabled
 * - On exit switches back to manual layout (if auto is active)
 * - Focus mode and walkthrough are not available
 * - Diagram is readonly while auto layout is active (see `isReadOnly` guard)
 */
export const comparing = machine.createStateConfig({
  id: targetState.comparing.slice(1),
  tags: [ComparingTag],
  always: {
    guard: not('can compare layouts'),
    ...to.idle,
  },
  exit: [
    exitComparingLayouts(),
  ],
  on: {
    'compare.end': {
      ...to.idle,
    },
    'emit.onLayoutTypeChange': {
      actions: [
        beforeLayoutTypeChangeWhileComparing(),
        emitOnLayoutTypeChange(),
      ],
    },
    'update.view': [
      {
        guard: 'is another view',
        ...to.navigating,
      },
      {
        actions: updateView({ restoreLayoutViewport: true }),
      },
    ],
    'layout.resetManualLayout': {
      guard: 'enabled: Editor',
      ...to.idle,
      actions: [
        cancelEditing(),
        assign({
          viewportChangedManually: false,
        }),
        triggerChange({
          op: 'reset-manual-layout',
        }),
      ],
    },
    // Walkthrough is not available while comparing
    'walkthrough.start': {},
    'xyflow.nodeClick': [
      {
        guard: and([
          'enabled: Readonly',
          'enabled: ElementDetails',
          'click: node has details',
          or([
            'click: same node',
            'click: selected node',
          ]),
        ]),
        actions: [
          assignLastClickedNode(),
          openSourceOfFocusedOrLastClickedNode(),
          openNodeDetails(),
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
  },
})
