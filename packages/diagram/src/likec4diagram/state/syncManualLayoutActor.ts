import type { ViewId } from '@likec4/core/types'
import {
  type ActorLogicFrom,
  type ActorRef,
  type ActorRefFromLogic,
  type MachineSnapshot,
  type SnapshotFrom,
  assign,
  sendTo,
  setup,
} from 'xstate'
import type { Context as DiagramContext, Events as DiagramEvents } from './diagram-machine'
import { createViewChange } from './utils'

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

export type Context = Readonly<
  Input & {}
>

export type Events =
  | { type: 'sync' }
  | { type: 'synced'; viewId: ViewId }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'cancel' }
  | { type: 'stop' }

const syncManualLayout = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    events: {} as Events,
    tags: '' as 'pending' | 'ready',
  },
  delays: {
    'timeout': 1_500,
  },
  guards: {
    'same view': ({ context }) => context.parent.getSnapshot().context.view.id === context.viewId,
  },
})

const idle = syncManualLayout.createStateConfig({
  tags: 'ready',
  on: {
    sync: {
      target: 'pending',
    },
  },
})

const paused = syncManualLayout.createStateConfig({
  tags: 'pending',
  on: {
    resume: {
      target: 'pending',
    },
    sync: {
      target: 'pending',
    },
    cancel: {
      target: 'idle',
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
    resume: {
      target: 'pending',
      reenter: true,
    },
    cancel: {
      target: 'idle',
    },
    pause: {
      target: 'paused',
    },
  },
  after: {
    'timeout': {
      target: 'syncing',
    },
  },
})

const syncing = syncManualLayout.createStateConfig({
  always: [{
    guard: 'same view',
    actions: sendTo(
      ({ context }) => context.parent,
      ({ context }) => {
        const parentContext = context.parent.getSnapshot().context
        return {
          type: 'emit.onChange',
          change: createViewChange(parentContext),
        }
      },
    ),
    target: 'synced',
  }, {
    target: 'stopped',
  }],
})

const synced = syncManualLayout.createStateConfig({
  tags: 'ready',
  on: {
    sync: {
      target: 'pending',
    },
  },
})

const _syncManualLayoutActorLogic = syncManualLayout.createMachine({
  initial: 'idle',
  context: ({ input }) => ({
    ...input,
  }),
  states: {
    idle,
    paused,
    pending,
    syncing,
    synced,
    stopped: {
      entry: assign({
        parent: null as any,
      }),
      type: 'final',
    },
  },
  on: {
    synced: {
      target: '.synced',
      actions: assign({
        viewId: ({ event }) => event.viewId,
      }),
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
