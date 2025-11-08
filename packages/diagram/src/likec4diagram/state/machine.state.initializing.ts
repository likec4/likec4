import { assign } from 'xstate/actions'
import { emitInitialized, ensureSyncLayout, xyflow } from './machine.actions'
import { machine } from './machine.setup'

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
