import { assign } from 'xstate/actions'
import { emitInitialized, ensureSyncLayout, xyflow } from './machine.actions'
import { machine } from './machine.setup'

/**
 * To be in `initializing` state, the diagram must wait for two events:
 * - `xyflow.init` - indicates that the `xyflow` instance is ready
 * - `update.view` - provides the initial diagram data (nodes and edges)
 *
 * Once both events have been received, the diagram transitions to `isReady` state.
 */
export const initializing = machine.createStateConfig({
  on: {
    'xyflow.init': {
      actions: assign(({ context, event }) => ({
        initialized: {
          ...context.initialized,
          xyflow: true,
        },
        xyflow: event.instance,
      })),
      target: 'isReady',
    },
    'update.view': {
      actions: assign(({ context, event }) => ({
        initialized: {
          ...context.initialized,
          xydata: true,
        },
        view: event.view,
        xynodes: event.xynodes,
        xyedges: event.xyedges,
      })),
      target: 'isReady',
    },
  },
})

/**
 * State that checks whether the diagram is ready to be used.
 * Transitions to `ready` state if both `xyflow` and `xydata` are initialized,
 * otherwise goes back to `initializing` state.`
 */
export const isReady = machine.createStateConfig({
  always: [{
    guard: 'isReady',
    actions: [
      xyflow.fitDiagram({ duration: 0 }),
      assign(({ context }) => ({
        navigationHistory: {
          currentIndex: 0,
          history: [{
            viewId: context.view.id,
            fromNode: null,
            viewport: { ...context.xyflow!.getViewport() },
          }],
        },
      })),
      ensureSyncLayout(),
      emitInitialized(),
    ],
    target: 'ready',
  }, {
    target: 'initializing',
  }],
})
