import { invariant } from '@likec4/core'
import { isNot } from 'remeda'
import { assign, enqueueActions, sendTo } from 'xstate'
import { typedSystem } from '../../likec4diagram/state/utils'
import {
  makeSnapshot,
  pushToSyncQueue,
  reschedule,
  scheduleSync,
  undo,
} from './actions'
import { machine } from './setup'
import { isViewChange } from './types'

const to = {
  idle: { target: '#queue-idle' },
  pending: { target: '#queue-pending' },
  suspended: { target: '#queue-suspended' },
  process: { target: '#queue-process' },
} as const

const idOf = (t: { target: string }) => ({ id: t.target.substring(1) })

/**
 * Idle state, no pending operations
 */
const idle = machine.createStateConfig({
  ...idOf(to.idle),
  always: {
    guard: 'has pending',
    ...to.pending,
  },
  on: {
    'change.sync-snapshot': {
      actions: pushToSyncQueue(),
      ...to.pending,
    },
    'change.*': {
      actions: pushToSyncQueue(),
      ...to.process,
    },
    'undo': {
      actions: undo(),
      reenter: true,
      ...to.idle,
    },
  },
})

/**
 * Has pending operations
 */
const pending = machine.createStateConfig({
  ...idOf(to.pending),
  on: {
    // Debounce queue events
    'change.sync-snapshot': {
      reenter: true,
      actions: pushToSyncQueue(),
      ...to.pending,
    },
    // All other changes route to process
    'change.*': {
      actions: pushToSyncQueue(),
      ...to.process,
    },
    // When editing starts, we suspend the queue
    'edit.move.start': {
      ...to.suspended,
    },
    'undo': {
      actions: undo(),
      ...to.idle,
    },
    'view.synched': {
      guard: 'has pending',
      actions: () => {
        if (import.meta.env.DEV) {
          console.log('view.synched')
        }
      },
      ...to.process,
    },
  },
  after: {
    'wait-after-edit': [
      {
        guard: 'has pending',
        ...to.process,
      },
      {
        ...to.idle,
      },
    ],
  },
})

/**
 * When editing starts, we suspend the queue
 */
const suspended = machine.createStateConfig({
  ...idOf(to.suspended),
  on: {
    'undo': {
      actions: undo(),
      ...to.idle,
    },
    'edit.*': {
      ...to.pending,
    },
    'change.*': {
      actions: reschedule(),
    },
    'cancel': {
      ...to.idle,
    },
  },
})

const peekFromQueue = () =>
  machine.assign(({ system, context: { syncQueue, processing } }) => {
    if (processing) {
      if (import.meta.env.DEV) {
        console.log('Processing already in progress')
      }
      return {}
    }
    let [head, ...tail] = syncQueue
    if (head === 'sync-snapshot') {
      head = makeSnapshot(system).change
    }
    if (import.meta.env.DEV) {
      console.log('peekFromQueue', { head, tail, syncQueue })
    }
    return {
      processing: head ?? null,
      syncQueue: tail,
    }
  })

const clearProcessing = () => ({
  processing: null,
})

/**
 * Processing pending operation
 */
const process = machine.createStateConfig({
  ...idOf(to.process),
  initial: 'enter',
  tags: ['busy'],
  states: {
    enter: {
      entry: peekFromQueue(),
      // Decide what to do next
      always: [
        {
          guard: ({ context: { processing } }) => !processing,
          ...to.idle,
        },
        {
          guard: ({ context: { processing } }) => processing === 'apply-latest-to-manual',
          target: 'applyLatestToManual',
        },
        {
          guard: ({ context: { processing } }) => processing === 'apply-semantic-layout',
          target: 'applySemanticLayout',
        },
        {
          target: 'executeChanges',
        },
      ],
    },
    /**
     * Syncing state, some edits are not yet synced
     */
    applyLatestToManual: machine.createStateConfig({
      initial: 'call',
      states: {
        // Fetch latest and manual layouts
        // Apply changes, send update to diagram
        call: {
          invoke: {
            src: 'applyLatest',
            input: ({ context }) => {
              const current = context.history?.head.change.layout
              return ({
                current: current && current._layout === 'manual' ? current : undefined,
                viewId: context.viewId,
              })
            },
            onDone: {
              actions: sendTo(
                typedSystem.diagramActor,
                ({ event }) => ({
                  type: 'update.view',
                  view: event.output.updated,
                }),
                { delay: 10 },
              ),
              target: 'wait',
            },
            onError: {
              actions: [
                ({ event }) => {
                  console.error(event.error)
                },
              ],
              ...to.idle,
            },
          },
        },
        // Now we wait 500ms, take new snapshot and send sync
        wait: {
          entry: assign(clearProcessing),
          after: {
            '500ms': {
              actions: scheduleSync(),
              ...to.idle,
            },
          },
        },
      },
    }),
    /**
     * User requested semantic layout, we will call the AI
     */
    applySemanticLayout: machine.createStateConfig({
      tags: ['ai-semantic-layout'],
      invoke: {
        src: 'applySemanticLayout',
        input: ({ context }) => ({
          viewId: context.viewId,
        }),
        onDone: {
          target: 'decideNext',
        },
        onError: {
          actions: [
            ({ event }) => {
              console.error(event.error)
            },
          ],
          target: 'decideNext',
        },
      },
    }),
    /**
     * Calls `executeChange` to save the snapshot
     */
    executeChanges: machine.createStateConfig({
      invoke: {
        src: 'executeChange',
        input: ({ context: { processing, syncQueue, viewId } }) => {
          // processing must be defined
          invariant(processing && isViewChange(processing))
          return ({
            changes: [
              processing,
              ...syncQueue.filter(isViewChange),
            ],
            viewId,
          })
        },
        onDone: {
          actions: enqueueActions(({ context, event, enqueue }) => {
            if (import.meta.env.DEV) {
              console.log('executeChanges onDone', { event })
            }
            // const snapshot = find([
            //   context.processing,
            //   ...context.syncQueue,
            // ], p => !!p && isViewChange(p) && p.op === 'save-view-snapshot')
            // if (snapshot) {
            //   console.log('sendTo update.view-bounds', { snapshot })
            //   enqueue.sendTo(
            //     typedSystem.diagramActor,
            //     {
            //       type: 'update.view-bounds',
            //       bounds: snapshot.layout.bounds,
            //     },
            //   )
            // }
            enqueue.assign({
              processing: null,
              syncQueue: context.syncQueue.filter(isNot(isViewChange)),
            })
          }),
          target: 'decideNext',
        },
        onError: {
          actions: assign(({ event }) => {
            console.error('executeChanges onError', { error: event.error })
            return {
              processing: null,
              syncQueue: [],
            }
          }),
          ...to.idle,
        },
      },
    }),

    decideNext: {
      entry: assign(clearProcessing),
      always: [
        // If there are pending operations, enter the process state
        {
          guard: 'has pending',
          target: 'enter',
        },
        // Otherwise, stay idle
        {
          ...to.idle,
        },
      ],
    },
  },
  on: {
    'change.*': {
      actions: reschedule(),
    },
    'view.synched': {
      actions: () => {
        if (import.meta.env.DEV) {
          console.log('view.synched')
        }
      },
    },
  },
})

export const syncQueue = machine.createStateConfig({
  initial: 'idle',
  states: {
    idle,
    pending,
    suspended,
    process,
  },
  on: {},
})
