import { find } from 'remeda'
import {
  type ActorRef,
  type ActorSystem,
  type SnapshotFrom,
  assign,
  enqueueActions,
  log,
  sendTo,
} from 'xstate'
import type { DiagramMachineRef } from '../likec4diagram/state/machine'
import {
  addSnapshotToPendingChanges,
  cancelSync,
  ensureHotKey,
  isLayoutChange,
  markHistoryAsSynched,
  pushHistory,
  reschedule,
  saveStateBeforeEdit,
  startEditing,
  stopEditing,
  stopHotkey,
  undo,
  withoutSnapshotChanges,
} from './editorActor.actions'
import type { EditorActorEmitedEvent, EditorActorEvent } from './editorActor.setup'
import { machine } from './editorActor.setup'

export type {
  EditorActorContext,
  EditorActorEmitedEvent,
  EditorActorEvent,
  EditorActorInput,
  EditorCalls,
} from './editorActor.setup'

/**
 * Actually this is DiagramActorRef
 * But we can't use it here due to circular type inference
 */
const diagramActorRef = function(params: { system: ActorSystem<any> }): DiagramMachineRef {
  return params.system.get('diagram')!
}

const to = {
  idle: { target: '#idle' },
  editing: { target: '#editing' },
  afterEdit: { target: '#afterEdit' },
  pending: { target: '#pending' },
  applyLatestToManual: { target: '#applyLatestToManual' },
  executeChanges: { target: '#executeChanges' },
} as const

/**
 * Idle state, no pending operations
 */
const idle = machine.createStateConfig({
  id: 'idle',
  on: {
    'sync': {
      ...to.pending,
    },
    'edit.start': {
      ...to.editing,
    },
  },
})

/**
 * Edit state, some operation is in progress, come to this state from idle
 */
const editing = machine.createStateConfig({
  id: 'editing',
  tags: 'pending',
  entry: [
    startEditing(),
    cancelSync(),
  ],
  on: {
    change: {
      actions: stopEditing(),
      ...to.executeChanges,
    },
    'edit.finish': {
      actions: stopEditing(),
      ...to.afterEdit,
    },
    'undo': {
      actions: stopEditing(),
      ...to.idle,
    },
  },
})

/**
 * Syncing state, some edits are not yet synced
 */
const pending = machine.createStateConfig({
  id: 'pending',
  tags: ['pending'],
  entry: ensureHotKey(),
  on: {
    'sync': {
      reenter: true,
      ...to.pending,
    },
    'edit.start': {
      // this allows to return back from editing in afterEdit state
      actions: [
        addSnapshotToPendingChanges(),
      ],
      ...to.editing,
    },
  },
  after: {
    'waitBeforeSync': {
      actions: [
        addSnapshotToPendingChanges(),
      ],
      ...to.executeChanges,
    },
  },
})

/**
 * Decide where to go next
 */
const afterEdit = machine.createStateConfig({
  id: 'afterEdit',
  always: [
    { guard: 'has pending', ...to.pending },
    { ...to.idle },
  ],
})

/**
 * Syncing state, some edits are not yet synced
 */
const applyLatestToManual = machine.createStateConfig({
  id: 'applyLatestToManual',
  entry: [
    cancelSync(),
    saveStateBeforeEdit(),
  ],
  initial: 'call',
  on: {
    // catch all events
    '*': {
      actions: [
        log(({ event }) => `applyLatestToManual received unexpected event: ${event.type}`),
        reschedule(500),
      ],
    },
  },
  states: {
    // Fetch latest and manual layouts
    // Apply changes, send update to diagram
    call: {
      invoke: {
        src: 'applyLatest',
        input: ({ context }) => {
          const current = context.beforeEditing?.change.layout
          return ({
            current: current && current._layout === 'manual' ? current : undefined,
            viewId: context.viewId,
          })
        },
        onDone: {
          actions: sendTo(
            diagramActorRef,
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
            assign({
              beforeEditing: null,
              pendingChanges: [],
            }),
            ({ event }) => {
              console.error(event.error)
            },
          ],
          ...to.idle,
        },
      },
    },
    // Now we wait 350ms, take new snapshot and send save-view-snapshot
    wait: {
      entry: pushHistory(),
      after: {
        '350ms': {
          actions: [
            addSnapshotToPendingChanges(),
            ensureHotKey(),
          ],
          ...to.executeChanges,
        },
      },
    },
  },
})

/**
 * Calls `executeChange` to save the snapshot
 */
const executeChanges = machine.createStateConfig({
  id: 'executeChanges',
  entry: [
    assign(({ event, context }) => {
      console.log('executeChanges entry', { event })
      if (event.type === 'change') {
        if (isLayoutChange(event.change)) {
          return {
            pendingChanges: [
              ...withoutSnapshotChanges(context.pendingChanges),
              event.change,
            ],
          }
        }
        if (!context.pendingChanges.includes(event.change)) {
          return {
            pendingChanges: [
              ...context.pendingChanges,
              event.change,
            ],
          }
        }
      }
      return {}
    }),
    cancelSync(),
  ],
  invoke: {
    src: 'executeChange',
    input: ({ context }) => ({
      changes: context.pendingChanges,
      viewId: context.viewId,
    }),
    onDone: {
      actions: enqueueActions(({ context, event, enqueue }) => {
        console.log('executeChanges onDone', { event })
        const snapshot = find(context.pendingChanges, c => c.op === 'save-view-snapshot')
        if (snapshot) {
          enqueue.sendTo(
            diagramActorRef,
            {
              type: 'update.view-bounds',
              bounds: snapshot.layout.bounds,
            },
          )
        }
        enqueue.assign({
          pendingChanges: [],
        })
      }),
      ...to.idle,
    },
    onError: {
      actions: ({ event }) => {
        console.error('executeChanges onError', { error: event.error })
      },
      ...to.afterEdit,
    },
  },
  on: {
    // catch all events
    '*': {
      actions: [
        log(({ event }) => `executeChanges received unexpected event: ${event.type}`),
        reschedule(),
      ],
    },
  },
})

const _editorActorLogic = machine.createMachine({
  id: 'editor',
  context: ({ input }) => ({
    viewId: input.viewId,
    beforeEditing: null,
    editing: null,
    pendingChanges: [],
    history: [],
  }),
  initial: 'idle',
  states: {
    idle,
    editing,
    pending,
    afterEdit,
    applyLatestToManual,
    executeChanges,
  },
  on: {
    cancel: {
      actions: [
        cancelSync(),
        assign({
          editing: null,
          beforeEditing: null,
          pendingChanges: [],
        }),
      ],
      ...to.idle,
    },
    synced: {
      actions: markHistoryAsSynched(),
    },
    undo: {
      guard: 'can undo',
      actions: undo(),
      ...to.idle,
    },
    change: {
      ...to.executeChanges,
    },
    'applyLatestToManual': {
      ...to.applyLatestToManual,
    },
    reset: {
      actions: [
        cancelSync(),
        assign({
          history: [],
          editing: null,
          beforeEditing: null,
          pendingChanges: [],
        }),
        stopHotkey(),
      ],
      ...to.idle,
    },
  },
})

type InferredMachine = typeof _editorActorLogic
export interface EditorActorLogic extends InferredMachine {}
export const editorActorLogic: EditorActorLogic = _editorActorLogic as any

export type EditorActorSnapshot = SnapshotFrom<EditorActorLogic>
export interface EditorActorRef extends ActorRef<EditorActorSnapshot, EditorActorEvent, EditorActorEmitedEvent> {}
