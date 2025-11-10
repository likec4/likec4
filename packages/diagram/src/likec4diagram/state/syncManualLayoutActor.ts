import type { LayoutedView, ViewChange, ViewId } from '@likec4/core/types'
import { deepEqual } from 'fast-equals'
import { last, map } from 'remeda'
import {
  type ActorLogicFrom,
  type ActorRef,
  type ActorRefFromLogic,
  type ActorSystem,
  type MachineSnapshot,
  type SnapshotFrom,
  assertEvent,
  assign,
  setup,
} from 'xstate'
import type { Types } from '../types'
import { createViewChange } from './createViewChange'
import { undoHotKeyActorLogic } from './hotkeyActor'
import type { Context as DiagramContext, Events as DiagramEvents } from './machine.setup'

export type Input = {
  viewId: ViewId
}

/**
 * Actually this is DiagramActorRef
 * But we can't use it here due to circular type inference
 */
const diagramActorRef = function(system: ActorSystem<any>): ActorRef<
  MachineSnapshot<DiagramContext, DiagramEvents, any, any, any, any, any, any>,
  DiagramEvents,
  any
> {
  return system.get('diagram')!
}

type HistorySnapshot = {
  view: LayoutedView
  change: ViewChange.SaveViewSnapshot
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
  synched: boolean
}

export type Context = Readonly<
  Input & {
    history: ReadonlyArray<HistorySnapshot>
    beforeEditing: HistorySnapshot | null
    editing: 'node' | 'edge' | null
  }
>

export type Events =
  | { type: 'sync' }
  | { type: 'synced' }
  | { type: 'editing.start'; subject: 'node' | 'edge' }
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
    children: {} as {
      undoHotKey: 'undoHotKeyActorLogic'
    },
  },
  delays: {
    'timeout': 2_000,
  },
  guards: {
    'can undo': ({ context }) => context.history.length > 0,
  },
  actors: {
    undoHotKeyActorLogic,
  },
})

const pushHistory = syncManualLayout.assign(({ context }) => {
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

  return {
    beforeEditing: null,
    history: [
      ...context.history,
      snapshot,
    ],
  }
})

const popHistory = syncManualLayout.assign(({ context }) => {
  if (context.history.length === 0) {
    return {}
  }
  return {
    history: context.history.slice(0, -1),
  }
})

const startEditing = syncManualLayout.assign(({ system, event }) => {
  assertEvent(event, 'editing.start')
  const parentContext = diagramActorRef(system).getSnapshot().context

  return {
    editing: event.subject,
    beforeEditing: {
      xynodes: map(parentContext.xynodes, n => ({ ...n })),
      xyedges: map(parentContext.xyedges, e => ({ ...e })),
      change: createViewChange(parentContext),
      view: parentContext.view,
      synched: false,
    },
  }
})

const ensureHotKey = syncManualLayout.enqueueActions(({ check, enqueue, self }) => {
  const hasUndo = check('can undo')
  const undoHotKey = self.getSnapshot().children['undoHotKey']
  if (undoHotKey && !hasUndo) {
    enqueue.stopChild(undoHotKey)
    return
  }
  if (!undoHotKey && hasUndo) {
    enqueue.spawnChild('undoHotKeyActorLogic', {
      id: 'undoHotKey',
    })
  }
})

const stopEditing = syncManualLayout.enqueueActions(({ event, enqueue }) => {
  assertEvent(event, 'editing.stop')

  if (event.wasChanged) {
    enqueue.cancel('sync')
    enqueue(pushHistory)
    enqueue.raise({ type: 'sync' }, { id: 'sync', delay: 50 })
  }
  enqueue.assign({
    beforeEditing: null,
    editing: null,
  })
})

const emitOnChange = syncManualLayout.sendTo(
  ({ system }) => diagramActorRef(system),
  ({ system }) => {
    const parentContext = diagramActorRef(system).getSnapshot().context
    return {
      type: 'emit.onChange',
      change: createViewChange(parentContext),
    }
  },
)

const markHistoryAsSynched = syncManualLayout.assign(({ context, event }) => {
  assertEvent(event, 'synced')
  return {
    history: context.history.map(i => ({
      ...i,
      synched: true,
    })),
    beforeEditing: context.beforeEditing
      ? {
        ...context.beforeEditing,
        synched: true,
      }
      : null,
  }
})

const undo = syncManualLayout.enqueueActions(({ context, enqueue, system }) => {
  const lastHistoryItem = last(context.history)
  if (!lastHistoryItem) {
    return
  }
  enqueue(popHistory)
  enqueue(ensureHotKey)
  const diagramActor = diagramActorRef(system)
  enqueue.sendTo(diagramActor, {
    type: 'update.view',
    view: lastHistoryItem.view,
    xyedges: lastHistoryItem.xyedges,
    xynodes: lastHistoryItem.xynodes,
  })
  // If the last history item was already synched,
  // we need to emit onChange event
  if (lastHistoryItem.synched) {
    enqueue.sendTo(diagramActor, {
      type: 'emit.onChange',
      change: lastHistoryItem.change,
    })
  }
})

const idle = syncManualLayout.createStateConfig({
  tags: 'ready',
  entry: [
    assign({
      beforeEditing: null,
      editing: null,
    }),
  ],
  on: {
    sync: {
      target: 'pending',
    },
    'editing.start': {
      actions: startEditing,
      target: 'editing',
    },
    undo: {
      guard: 'can undo',
      actions: undo,
    },
  },
})

/**
 * idle -> editing
 */
const editing = syncManualLayout.createStateConfig({
  on: {
    'editing.stop': {
      actions: [
        stopEditing,
        ensureHotKey,
      ],
      target: 'idle',
    },
    undo: {},
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
      actions: startEditing,
    },
    undo: {
      guard: 'can undo',
      actions: undo,
      target: 'idle',
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
      actions: [
        stopEditing,
        ensureHotKey,
      ],
      target: 'pending',
    },
    undo: {},
  },
})

const _syncManualLayoutActorLogic = syncManualLayout.createMachine({
  initial: 'idle',
  context: ({ input }) => ({
    ...input,
    history: [],
    beforeEditing: null,
    editing: null,
  }),
  states: {
    idle,
    editing,
    pending,
    paused,
    stopped: {
      entry: [
        assign({
          beforeEditing: null,
          history: [],
        }),
        ensureHotKey,
      ],
      type: 'final',
    },
  },
  on: {
    cancel: {
      target: '.idle',
    },
    synced: {
      actions: markHistoryAsSynched,
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
