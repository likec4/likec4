import type { DiagramView, Fqn, NodeId } from '@likec4/core/types'
import type { Rect } from '@xyflow/system'
import {
  type ActorRef,
  type SnapshotFrom,
  type StateMachine,
  assign,
  sendTo,
  setup,
  spawnChild,
  stopChild,
} from 'xstate'
import { type RelationshipsBrowserActorRef, relationshipsBrowserLogic } from '../relationships-browser/actor'

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

const _elementDetailsLogic = setup({
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
          viewId: context.currentView.id,
          scope: 'view',
          enableSelectSubject: false,
          enableChangeScope: true,
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
})

export interface ElementDetailsLogic extends
  StateMachine<
    Context,
    Events,
    {
      [key: `${string}-relationships`]: RelationshipsBrowserActorRef | undefined
    },
    any,
    any,
    any,
    any,
    any,
    never,
    Input,
    any,
    any,
    any,
    any
  >
{
}
export const elementDetailsLogic: ElementDetailsLogic = _elementDetailsLogic as any

export type ElementDetailsSnapshot = SnapshotFrom<ElementDetailsLogic>
export interface ElementDetailsActorRef extends ActorRef<ElementDetailsSnapshot, Events> {
}

export type {
  Input as ElementDetailsInput,
}
