import type { LayoutedView, ViewChange, ViewId } from '@likec4/core/types'
import { deepEqual } from 'fast-equals'
import { last } from 'remeda'
import {
  type ActorLogicFrom,
  type ActorRef,
  type ActorRefFromLogic,
  type MachineSnapshot,
  type SnapshotFrom,
  assertEvent,
  assign,
  enqueueActions,
  sendTo,
  setup,
} from 'xstate'
import type { Types } from '../types'
import { createViewChange } from './createViewChange'
import type { Context as DiagramContext, Events as DiagramEvents } from './machine.setup'

export type Input = {
  /**
   * Actually this is DiagramActorRef
   * But we can't use it here due to circular type inference
   */
  parent: ActorRef<
    MachineSnapshot<DiagramContext, DiagramEvents, any, any, any, any, any, any>,
    DiagramEvents,
    any
  >
  viewId: ViewId
}

type HistorySnapshot = {
  view: LayoutedView
  change: ViewChange.SaveViewSnapshot
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
}

export type Context = Readonly<
  Input & {
    history: ReadonlyArray<HistorySnapshot>
    beforeEditing: HistorySnapshot | null
  }
>

export type Events =
  | { type: 'sync' }
  | { type: 'synced' }
  | { type: 'editing.start' }
  | { type: 'editing.stop'; wasChanged?: boolean }
  | { type: 'cancel' }
  | { type: 'undo' }
  | { type: 'stop' }

const syncManualLayout = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    events: {} as Events,
    tags: '' as 'pending' | 'ready',
  },
  delays: {
    'short': 300,
    'timeout': 1_500,
  },
  guards: {
    'can undo': ({ context }) => context.history.length > 0,
  },
})

const pushHistory = syncManualLayout.createAction(assign(({ context }) => {
  const snapshot = context.beforeEditing
  if (!snapshot) {
    // If we have beforeEditing snapshot, do not push history
    return {}
  }
  // Avoid duplicate history entries
  const prevHistoryItem = last(context.history)
  if (
    deepEqual(prevHistoryItem?.xyedges, snapshot.xyedges) &&
    deepEqual(prevHistoryItem?.xynodes, snapshot.xynodes)
  ) {
    return {
      beforeEditing: null,
    }
  }
  console.log('Pushing manual layout history:', snapshot)

  return {
    beforeEditing: null,
    history: [
      ...context.history,
      snapshot,
    ],
  }
}))

const popHistory = syncManualLayout.createAction(assign(({ context, event }) => {
  if (context.history.length === 0) {
    return {}
  }
  return {
    history: context.history.slice(0, -1),
  }
}))

const makeSnapshot = syncManualLayout.createAction(assign(({ context }) => {
  const parentContext = context.parent.getSnapshot().context
  const xystore = parentContext.xystore.getState()

  return {
    beforeEditing: structuredClone({
      xynodes: xystore.nodes,
      xyedges: xystore.edges,
      change: createViewChange(parentContext),
      view: parentContext.view,
    }),
  }
}))

// const onEditingStart = syncManualLayout.createAction(enqueueActions(({ context, event, enqueue }) => {
//   assertEvent(event, 'editing.start')
//   invariant(context.beforeEditing === null, 'beforeEditing must be null on editing.start')
//   const parentContext = context.parent.getSnapshot().context
//   const xystore = parentContext.xystore.getState()

//   enqueue.assign({
//     beforeEditing: structuredClone({
//       xynodes: xystore.nodes,
//       xyedges: xystore.edges,
//       change: createViewChange(parentContext),
//       view: parentContext.view,
//     }),
//   })
// }))

const onEditingStop = syncManualLayout.createAction(enqueueActions(({ context, event, enqueue }) => {
  assertEvent(event, 'editing.stop')

  if (event.wasChanged) {
    enqueue(pushHistory)
    enqueue.raise({ type: 'sync' }, { id: 'sync', delay: 10 })
  }
  enqueue.assign({
    beforeEditing: null,
  })
}))

const emitOnChange = syncManualLayout.createAction(sendTo(
  ({ context }) => context.parent,
  ({ context }) => {
    const parentContext = context.parent.getSnapshot().context
    return {
      type: 'emit.onChange',
      change: createViewChange(parentContext),
    }
  },
))

const undo = syncManualLayout.createAction(enqueueActions(({ context, enqueue }) => {
  const lastHistoryItem = last(context.history)
  if (!lastHistoryItem) {
    return
  }
  enqueue(popHistory)

  enqueue.sendTo(context.parent, {
    type: 'update.view',
    view: lastHistoryItem.view,
    xyedges: lastHistoryItem.xyedges,
    xynodes: lastHistoryItem.xynodes,
  })
  enqueue.sendTo(context.parent, {
    type: 'emit.onChange',
    change: lastHistoryItem.change,
  })
}))

const init = syncManualLayout.createStateConfig({
  after: {
    'short': {
      actions: [
        makeSnapshot,
        pushHistory,
      ],
      target: 'idle',
    },
  },
})

const idle = syncManualLayout.createStateConfig({
  tags: 'ready',
  entry: assign({
    beforeEditing: null,
  }),
  on: {
    sync: {
      target: 'pending',
    },
    'editing.start': {
      actions: makeSnapshot,
    },
    'editing.stop': {
      actions: onEditingStop,
    },
  },
})

const pending = syncManualLayout.createStateConfig({
  tags: 'pending',
  on: {
    sync: {
      target: 'pending',
      reenter: true,
    },
    'editing.start': {
      target: 'paused',
      actions: makeSnapshot,
    },
  },
  after: {
    'timeout': {
      target: 'idle',
      actions: emitOnChange,
    },
  },
})

const paused = syncManualLayout.createStateConfig({
  tags: 'pending',
  on: {
    'editing.stop': {
      actions: onEditingStop,
      target: 'pending',
    },
    undo: {},
  },
})

// const syncing = syncManualLayout.createStateConfig({
//   tags: 'pending',
//   on: {
//     // do not allow sync/pause/cancel during syncing
//     undo: {
//       actions: [
//         cancel('undo'),
//         raise({ type: 'undo' }, { id: 'undo', delay: 100 }),
//       ],
//     },
//     cancel: {
//       target: 'idle',
//     },
//     sync: {
//       // Re-emit sync
//       actions: [
//         cancel('sync'),
//         raise({ type: 'sync' }, { id: 'sync', delay: 100 }),
//       ],
//     },
//   },
//   ...(import.meta.env.DEV
//     ? {
//       after: {
//         'timeout': {
//           target: 'idle',
//         },
//       },
//     }
//     : {}),
// })

const _syncManualLayoutActorLogic = syncManualLayout.createMachine({
  initial: 'init',
  context: ({ input }) => ({
    ...input,
    history: [],
    beforeEditing: null,
  }),
  states: {
    init,
    idle,
    paused,
    pending,
    // syncing,
    stopped: {
      entry: assign({
        parent: null as any,
        beforeEditing: null,
        history: [],
      }),
      type: 'final',
    },
  },
  on: {
    cancel: {
      target: '.idle',
    },
    undo: {
      guard: 'can undo',
      actions: undo,
      target: '.idle',
    },
    stop: {
      target: '.stopped',
    },
  },
})

/**
 * Here is a trick to reduce inference types
 */
type InferredMachine = ActorLogicFrom<typeof _syncManualLayoutActorLogic>
export interface SyncLayoutActorLogic extends InferredMachine {}

export type SyncLayoutActorRef = ActorRefFromLogic<SyncLayoutActorLogic>
export type SyncLayoutActorSnapshot = SnapshotFrom<SyncLayoutActorLogic>

export const syncManualLayoutActorLogic: SyncLayoutActorLogic = _syncManualLayoutActorLogic as any
