import { invariant } from '@likec4/core'
import { findLast } from 'remeda'
import { assign, enqueueActions, log, sendTo } from 'xstate'
import { typedSystem } from '../../likec4diagram/state/utils'
import {
  cancelSync,
  clearQueue,
  deleteNodesAndEdges,
  makeSnapshot,
  pushToSyncQueue,
  redo,
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
    'delete.nodes-edges': {
      actions: deleteNodesAndEdges(),
    },
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
    },
    'redo': {
      actions: redo(),
    },
    'cancel': {
      actions: cancelSync(),
      ...to.idle,
    },
    'view.synched': {
      actions: log('in idle got view.synched'),
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
    'delete.nodes-edges': {
      actions: deleteNodesAndEdges(),
      reenter: true,
      ...to.pending,
    },
    // When editing starts, we suspend the queue
    'edit.move.start': {
      ...to.suspended,
    },
    'undo': {
      reenter: true,
      actions: undo(),
      ...to.pending,
    },
    'redo': {
      reenter: true,
      actions: redo(),
      ...to.pending,
    },
    'cancel': {
      actions: clearQueue(),
      ...to.idle,
    },
    'view.synched': {
      actions: log('in pending got view.synched'),
    },
  },
  after: {
    'wait-after-edit': [
      {
        guard: 'has pending',
        ...to.process,
      },
      to.idle,
    ],
  },
})

/**
 * When editing starts, we suspend the queue
 */
const suspended = machine.createStateConfig({
  ...idOf(to.suspended),
  on: {
    // idle redirects to pending if any
    'edit.*': to.idle,
    'cancel': {
      actions: [
        clearQueue(),
        cancelSync(),
      ],
      ...to.idle,
    },
  },
})

const peekFromQueue = () =>
  machine.assign(({ system, context: { syncQueue } }) => {
    let [head, ...tail] = syncQueue
    if (head === 'sync-snapshot') {
      head = makeSnapshot(system).change
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
  initial: 'peekFromQueue',
  tags: ['busy'],
  states: {
    peekFromQueue: {
      entry: peekFromQueue(),
      // Decide what to do next
      always: [
        {
          guard: ({ context: { processing } }) => processing === 'apply-latest-to-manual',
          target: 'applyLatestToManual',
        },
        {
          guard: ({ context: { processing } }) => processing === 'apply-semantic-layout',
          target: 'applySemanticLayout',
        },
        {
          guard: ({ context: { processing } }) => isViewChange(processing),
          target: 'executeChanges',
        },
        {
          guard: 'has pending',
          reenter: true,
          ...to.process,
        },
        {
          actions: clearQueue(),
          ...to.idle,
        },
      ],
    },
    /**
     * Syncing state, some edits are not yet synced
     */
    applyLatestToManual: machine.createStateConfig({
      initial: 'call',
      entry: assign(({ system }) => ({
        processing: makeSnapshot(system).change,
      })),
      states: {
        // Fetch latest and manual layouts
        // Apply changes, send update to diagram
        call: {
          invoke: {
            src: 'applyLatest',
            input: ({ context }) => {
              const current = context.processing
              invariant(isViewChange(current) && current.op === 'save-view-snapshot')
              return ({
                current: current.layout,
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
                { delay: 20 },
              ),
              target: 'wait',
            },
            onError: {
              actions: assign(({ event }) => {
                console.error('applyLatestToManual onError', { error: event.error })
                return {
                  processing: null,
                  syncQueue: [],
                }
              }),
              ...to.idle,
            },
          },
        },
        // Now we wait 500ms, take new snapshot and send sync
        wait: {
          on: {
            // Ignore all events during window to prevent
            // race conditions between view updates and sync operations
            '*': {
              actions: log(({ event }) => `wait: ignoring event ${event.type}`),
            },
          },
          after: {
            '500ms': {
              actions: [
                clearQueue(),
                assign({ redo: null }),
                scheduleSync(),
              ],
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
          actions: ({ event }) => {
            console.error('applySemanticLayout onError', { error: event.error })
          },
          target: 'failure',
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
            const requested = event.output.requested
            enqueue.assign({
              processing: null,
              syncQueue: context.syncQueue.filter(change => !isViewChange(change) || !requested.includes(change)),
            })

            const lastSyncSnapshot = findLast(
              event.output.applied,
              c => c.op === 'save-view-snapshot',
            )
            if (lastSyncSnapshot) {
              enqueue.sendTo(
                typedSystem.diagramActor,
                {
                  type: 'update.view-bounds',
                  bounds: lastSyncSnapshot.layout.bounds,
                },
              )
            }
          }),
          target: 'waitViewSynced',
        },
        onError: {
          actions: ({ event }) => {
            console.error('executeChanges onError', { error: event.error })
          },
          target: 'failure',
        },
      },
    }),

    // This state blocks further changes until the view is fully synced
    waitViewSynced: {
      on: {
        'view.synched': {
          target: 'decideNext',
        },
      },
      after: {
        // Fallback: if view.synched doesn't come, proceed after 2 second
        2000: 'decideNext',
      },
    },

    decideNext: {
      entry: assign(clearProcessing),
      always: [
        // If there are pending operations, enter the process state
        {
          guard: 'has pending',
          reenter: true,
          ...to.process,
        },
        // Otherwise, stay idle
        to.idle,
      ],
    },

    failure: {
      always: {
        actions: clearQueue(),
        ...to.idle,
      },
    },
  },
  on: {
    // 'change.*': {
    //   actions: log(({ event }) => `ignore ${event.type} in process state`),
    // },
    // 'undo': {
    //   actions: log('ignore undo in process state'),
    // },
    // 'view.synched': {
    //   actions: log('im in process and got view.synched'),
    // },
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
