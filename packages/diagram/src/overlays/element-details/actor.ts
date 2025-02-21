import { type DiagramView, type Fqn, type NodeId } from '@likec4/core'
import { type Rect } from '@xyflow/system'
import {
  type ActorLogicFrom,
  type ActorRefFromLogic,
  type SnapshotFrom,
  assign,
  sendTo,
  setup,
  spawnChild,
  stopChild,
} from 'xstate'
import { relationshipsBrowserLogic } from '../relationships-browser/actor'

export type Input = {
  subject: Fqn
  currentView: DiagramView
  initiatedFrom?: {
    node?: NodeId
    clientRect?: Rect
  }
}

export type Context = {
  subject: Fqn
  currentView: DiagramView
  initiatedFrom: {
    node: NodeId | null
    clientRect: Rect | null
  }
}

export type Events =
  | { type: 'change.subject'; subject: Fqn }
  | { type: 'close' }

export const elementDetailsLogic = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    events: {} as Events,
    children: {} as {
      [key: `${string}-relationships`]: 'relationshipsBrowserLogic'
    },
  },
  actors: {
    relationshipsBrowserLogic,
  },
}).createMachine({
  id: 'element-details',
  context: ({ input }) => ({
    ...input,
    initiatedFrom: {
      node: input.initiatedFrom?.node ?? null,
      clientRect: input.initiatedFrom?.clientRect ?? null,
    },
  }),
  initial: 'active',
  states: {
    'active': {
      entry: spawnChild('relationshipsBrowserLogic', {
        id: ({ self }) => `${self.id}-relationships`,
        input: ({ context }) => ({
          subject: context.subject,
          scope: context.currentView,
          enableNavigationMenu: false,
          closeable: false,
        }),
      }),
      exit: [
        sendTo(({ self }) => `${self.id}-relationships`, { type: 'close' }),
        stopChild(({ self }) => `${self.id}-relationships`),
      ],
      on: {
        'change.subject': {
          actions: assign({
            subject: ({ event }) => event.subject,
          }),
        },
        'close': 'closed',
      },
    },
    closed: {
      id: 'closed',
      type: 'final',
    },
  },
  // exit: assign({
  //   initialized: false,
  //   xyflow: null,
  //   layouted: null,
  //   xystore: null,
  //   xyedges: [],
  //   xynodes: [],
  // }),
})

export interface ElementDetailsLogic extends ActorLogicFrom<typeof elementDetailsLogic> {
}
export interface ElementDetailsActorRef extends ActorRefFromLogic<ElementDetailsLogic> {
}
export type ElementDetailsSnapshot = SnapshotFrom<ElementDetailsLogic>
