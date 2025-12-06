import type * as t from '@likec4/core/types'
import { find } from 'remeda'
import {
  type ActorRef,
  type ActorRefFromLogic,
  type ActorSystem,
  type NonReducibleUnknown,
  type SnapshotFrom,
  type StateMachine,
  assertEvent,
  assign,
  enqueueActions,
  fromPromise,
  log,
  raise,
  setup,
} from 'xstate'
import type { HotkeyActorLogic } from '../likec4diagram/state/hotkeyActor'
import type { DiagramMachineRef } from '../likec4diagram/state/machine'
import type { Types } from '../likec4diagram/types'
import { applyChangesToManualLayout } from './applyChangesToManualLayout'
import {
  addSnapshotToPendingChanges,
  cancelSync,
  ensureHotKey,
  isLayoutChange,
  markHistoryAsSynched,
  pushHistory,
  pushManualLayoutToHistory,
  startEditing,
  stopEditing,
  undo,
  withoutSnapshotChanges,
} from './editorActor.actions'
import { type HotKeyEvent, hotkeyActorLogic as hotkey } from './hotkeyActor'

export namespace EditorCalls {
  export type ApplyLatestToManual = (
    params: { input: ApplyLatestToManual.Input },
  ) => Promise<ApplyLatestToManual.Output>
  export namespace ApplyLatestToManual {
    export type Input = { viewId: t.ViewId; current: t.LayoutedView | undefined }
    export type Output = { updated: t.LayoutedView }
  }

  export type ExecuteChange = (
    params: { input: ExecuteChange.Input },
  ) => Promise<ExecuteChange.Output>
  export namespace ExecuteChange {
    export type Input = { viewId: t.ViewId; changes: t.ViewChange[] }
    export type Output = NonReducibleUnknown
  }
}

const applyLatest = fromPromise<EditorCalls.ApplyLatestToManual.Output, EditorCalls.ApplyLatestToManual.Input>(
  () => {
    throw new Error('Not implemented')
  },
)

const executeChange = fromPromise<EditorCalls.ExecuteChange.Output, EditorCalls.ExecuteChange.Input>(
  () => {
    throw new Error('Not implemented')
  },
)

export type EditorActorEvent =
  | { type: 'sync' }
  | { type: 'change'; change: t.ViewChange }
  | { type: 'edit.start'; subject: 'node' | 'edge' }
  | { type: 'edit.finish'; wasChanged?: boolean }
  | { type: 'applyLatestToManual' }
  | { type: 'synced' }
  | { type: 'cancel' }
  | HotKeyEvent

type HistorySnapshot = {
  view: t.LayoutedView
  change: t.ViewChange.SaveViewSnapshot
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
  synched: boolean
}

export interface EditorActorInput {
  viewId: t.ViewId
}

export interface EditorActorContext {
  viewId: t.ViewId

  pendingChanges: t.ViewChange[]

  history: ReadonlyArray<HistorySnapshot>
  /**
   * The state before editing started
   */
  beforeEditing: HistorySnapshot | null

  /**
   * The subject of the edit
   */
  editing: 'node' | 'edge' | null
}

export type EditorActorEmitedEvent = { type: 'idle' }

/**
 * Actually this is DiagramActorRef
 * But we can't use it here due to circular type inference
 */
const diagramActorRef = function(params: { system: ActorSystem<any> }): DiagramMachineRef {
  return params.system.get('diagram')!
}

export const machine = setup({
  types: {
    context: {} as EditorActorContext,
    events: {} as EditorActorEvent,
    emitted: {} as EditorActorEmitedEvent,
    input: {} as EditorActorInput,
    children: {} as {
      hotkey: 'hotkey'
    },
    tags: {} as 'pending',
  },
  delays: {
    '250ms': 250,
    'waitBeforeSync': 2_000,
  },
  actors: {
    applyLatest,
    executeChange,
    hotkey,
  },
  guards: {
    'has pending': ({ context }) => context.pendingChanges.length > 0,
    'can undo': ({ context }) => context.history.length > 0,
  },
})

const to = {
  idle: { target: '#idle' },
  editing: { target: '#editing' },
  afterEdit: { target: '#afterEdit' },
  pending: { target: '#pending' },
  applyLatestToManual: { target: '#applyLatestToManual' },
  executeChanges: { target: '#executeChanges' },
} as const

const cancel = {
  actions: [
    machine.enqueueActions(({ enqueue, event }) => {
      enqueue(cancelSync())
      assertEvent(event, ['cancel'])
      enqueue(stopEditing())
      enqueue.assign({
        editing: null,
        beforeEditing: null,
        pendingChanges: [],
      })
      enqueue(ensureHotKey())
    }),
  ],
  ...to.idle,
}

/**
 * Idle state, no pending operations
 */
const idle = machine.createStateConfig({
  id: 'idle',
  exit: ensureHotKey(),
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
  exit: ensureHotKey(),
  on: {
    cancel,
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
    'synced': {
      actions: markHistoryAsSynched(),
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
    to.idle,
  ],
})

/**
 * Syncing state, some edits are not yet synced
 */
const applyLatestToManual = machine.createStateConfig({
  id: 'applyLatestToManual',
  entry: [
    cancelSync(),
    pushManualLayoutToHistory(),
  ],
  initial: 'exec',
  states: {
    // Fetch latest and manual layouts
    // Apply changes, send update to diagram
    exec: {
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
          actions: [
            log('applyLatest done'),
            enqueueActions(({ enqueue, event }) => {
              enqueue.sendTo(
                diagramActorRef,
                {
                  type: 'update.view',
                  view: event.output.updated,
                },
              )
            }),
          ],
          target: 'wait',
        },
        onError: {
          actions: [
            assign({
              beforeEditing: null,
              editing: null,
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
    // Now we wait 250ms, take new snapshot and send save-view-snapshot
    wait: {
      entry: log('applyLatestToManual.wait entry'),
      on: {
        // catch all events
        '*': {
          actions: [
            log(({ event }) => event.type),
          ],
        },
      },
      after: {
        '250ms': {
          actions: [
            pushHistory(),
            assign({
              pendingChanges: [],
            }),
            addSnapshotToPendingChanges(),
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
    log('executeChanges entry'),
    assign(({ event, context }) => {
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
      actions: enqueueActions(({ context, enqueue }) => {
        console.log('executeChanges done')
        const snapshot = find(context.pendingChanges, c => c.op === 'save-view-snapshot')
        enqueue.assign({
          pendingChanges: [],
        })
        if (snapshot) {
          enqueue.sendTo(
            diagramActorRef,
            {
              type: 'update.view-bounds',
              bounds: snapshot.layout.bounds,
            },
          )
        }
      }),
      ...to.idle,
    },
    onError: {
      actions: ({ event }) => {
        console.error(event.error)
      },
      ...to.idle,
    },
  },
  on: {
    '*': {
      // reschedule
      actions: raise(({ event }) => event, { delay: 100 }),
    },
  },
})

/**
 * Syncing state, some edits are not yet synced
 */
const pending = machine.createStateConfig({
  id: 'pending',
  tags: ['pending'],
  exit: ensureHotKey(),
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
  entry: ({ self }) => {
    // self.
    const s = self.subscribe({
      complete: () => {
        console.log('editor actor completed')
        s.unsubscribe()
      },
    })
  },
  states: {
    idle,
    editing,
    pending,
    afterEdit,
    applyLatestToManual,
    executeChanges,
  },
  on: {
    cancel,
    synced: {
      actions: [
        markHistoryAsSynched(),
        cancelSync(),
      ],
      ...to.idle,
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
  },
})

type InferredMachine = typeof _editorActorLogic
export interface EditorActorLogic extends InferredMachine {}
// export interface EditorActorLogic extends
//   StateMachine<
//     EditorActorContext,
//     EditorActorEvent,
//     {
//       applyLatest: ActorRefFromLogic<typeof applyLatest>
//       executeChange: ActorRefFromLogic<typeof executeChange>
//       hotkey: ActorRefFromLogic<HotkeyActorLogic>
//     },
//     any,
//     any,
//     any,
//     any,
//     any,
//     'pending',
//     EditorActorInput,
//     any,
//     EditorActorEmitedEvent,
//     any,
//     any
//   >
// {
// }
export const editorActorLogic: EditorActorLogic = _editorActorLogic as any

export type EditorActorSnapshot = SnapshotFrom<EditorActorLogic>
export interface EditorActorRef extends ActorRef<EditorActorSnapshot, EditorActorEvent, EditorActorEmitedEvent> {}
