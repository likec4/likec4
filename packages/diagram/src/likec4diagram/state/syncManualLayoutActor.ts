import type { LayoutedView, ViewChange, ViewId } from '@likec4/core/types'
import { getHotkeyHandler } from '@mantine/hooks'
import { last, omit } from 'remeda'
import {
  type ActorLogicFrom,
  type ActorRef,
  type ActorSystem,
  type AnyEventObject,
  type CallbackActorLogic,
  type MachineSnapshot,
  type NonReducibleUnknown,
  type SnapshotFrom,
  assertEvent,
  assign,
  fromCallback,
  setup,
  stopChild,
} from 'xstate'
import type { Types } from '../types'
import { createViewChange } from './createViewChange'
import type { Context as DiagramContext, Events as DiagramEvents } from './machine.setup'

type UndoEvent = { type: 'undo' }

interface UndoHotKeyActorLogic extends CallbackActorLogic<AnyEventObject, NonReducibleUnknown, UndoEvent> {}

const undoHotKeyActorLogic: UndoHotKeyActorLogic = fromCallback(({ sendBack }: {
  sendBack: (event: UndoEvent) => void
}) => {
  const ctrlZHandler = getHotkeyHandler([
    ['mod + z', (event: KeyboardEvent) => {
      event.stopPropagation()
      sendBack({ type: 'undo' })
    }, {
      preventDefault: true,
    }],
  ])

  document.body.addEventListener('keydown', ctrlZHandler, { capture: true })
  return () => {
    document.body.removeEventListener('keydown', ctrlZHandler, { capture: true })
  }
})

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
    return {
      editing: null,
    }
  }

  return {
    beforeEditing: null,
    editing: null,
    history: [
      ...context.history,
      snapshot,
    ],
  }
})

const popHistory = syncManualLayout.assign(({ context }) => {
  if (context.history.length === 0 || context.history.length === 1) {
    return {
      history: [],
    }
  }
  return {
    history: context.history.slice(0, context.history.length - 1),
  }
})

const startEditing = syncManualLayout.enqueueActions(({ check, enqueue, system, event, self, context }) => {
  assertEvent(event, 'editing.start')
  const parentContext = diagramActorRef(system).getSnapshot().context

  enqueue.assign({
    editing: event.subject,
    beforeEditing: {
      xynodes: parentContext.xynodes.map(({ measured, style, ...n }) =>
        ({
          ...omit(n, ['selected', 'dragging', 'resizing']),
          data: omit(n.data, ['dimmed', 'hovered']),
          initialWidth: measured?.width ?? n.width ?? n.initialWidth,
          initialHeight: measured?.height ?? n.height ?? n.initialHeight,
        }) as Types.Node
      ),
      xyedges: parentContext.xyedges.map(e =>
        ({
          ...omit(e, ['selected']),
          data: omit(e.data, ['active', 'dimmed', 'hovered']),
        }) as Types.Edge
      ),
      change: createViewChange(parentContext),
      view: parentContext.view,
      synched: false,
    },
  })
})

const ensureHotKey = syncManualLayout.enqueueActions(({ check, context, enqueue, self }) => {
  const hasUndo = context.history.length > 0
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

const raiseEditingStop = syncManualLayout.raise({ type: 'editing.stop' })

const stopEditing = syncManualLayout.enqueueActions(({ event, enqueue }) => {
  assertEvent(event, 'editing.stop')

  if (event.wasChanged) {
    enqueue(pushHistory)
    enqueue(ensureHotKey)
    enqueue.raise({ type: 'sync' }, { delay: 100, id: 'sync' })
    return
  }

  enqueue.assign({
    beforeEditing: null,
    editing: null,
  })
})

const emitOnChange = syncManualLayout.enqueueActions(({ context, enqueue, system }) => {
  const diagramActor = diagramActorRef(system)
  const parentContext = diagramActor.getSnapshot().context
  const change = createViewChange(parentContext)
  enqueue.sendTo(diagramActor, {
    type: 'update.view-bounds',
    bounds: change.layout.bounds,
  })
  enqueue.sendTo(diagramActor, {
    type: 'emit.onChange',
    change,
  })
})

const markHistoryAsSynched = syncManualLayout.assign(({ context, event }) => {
  assertEvent(event, 'synced')
  return {
    history: context.history.map(i => ({
      ...i,
      synched: true,
    })),
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
    source: 'internal',
  })
  // If the last history item was already synched,
  // we need to emit onChange event
  if (lastHistoryItem.synched) {
    enqueue.sendTo(
      diagramActor,
      {
        type: 'emit.onChange',
        change: lastHistoryItem.change,
      },
    )
  } else {
    // Otherwise, we need to start sync after undo
    enqueue.raise({ type: 'sync' }, { delay: 100 })
  }
})

const idle = syncManualLayout.createStateConfig({
  tags: 'ready',
  on: {
    sync: {
      target: 'pending',
    },
    'editing.start': {
      actions: startEditing,
      target: 'editing',
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
      ],
      target: 'idle',
    },
    undo: {
      actions: [
        raiseEditingStop,
      ],
    },
    synced: {
      actions: [
        markHistoryAsSynched,
        raiseEditingStop,
      ],
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
      actions: startEditing,
    },
  },
  after: {
    'timeout': {
      target: 'idle',
      actions: emitOnChange,
    },
  },
})

/**
 * pending -> paused when editing starts
 */
const paused = syncManualLayout.createStateConfig({
  tags: 'pending',
  on: {
    'editing.stop': {
      actions: [
        stopEditing,
      ],
      target: 'pending',
    },
    undo: {
      actions: [
        raiseEditingStop,
      ],
    },
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
        stopChild('undoHotKey'),
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
export interface SyncLayoutActorLogic extends InferredMachine {
}

export type SyncLayoutActorSnapshot = SnapshotFrom<SyncLayoutActorLogic>
export interface SyncLayoutActorRef extends ActorRef<SyncLayoutActorSnapshot, Events> {
}

export const syncManualLayoutActorLogic: SyncLayoutActorLogic = _syncManualLayoutActorLogic as any
