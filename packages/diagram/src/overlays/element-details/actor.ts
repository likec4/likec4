import type { DiagramView, NodeId } from '@likec4/core/types'
import type { Rect } from '@xyflow/system'
import {
  type ActorRef,
  type SnapshotFrom,
  type StateMachine,
  assign,
  enqueueActions,
  setup,
} from 'xstate'
import { type RelationshipsBrowserActorRef, relationshipsBrowserLogic } from '../relationships-browser/actor'
import type { DetailsSubject } from './subject'

export type ElementDetailsInput = {
  subject: DetailsSubject
  currentView: DiagramView
  initiatedFrom?: {
    node?: NodeId
    clientRect?: Rect
  }
}

export type Context = {
  subject: DetailsSubject
  currentView: DiagramView
  initiatedFrom: {
    node: NodeId | null
    clientRect: Rect | null
  }
}

export type Events =
  | { type: 'change.subject'; subject: DetailsSubject }
  | { type: 'close' }

const _elementDetailsLogic = setup({
  types: {
    context: {} as Context,
    input: {} as ElementDetailsInput,
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
      entry: enqueueActions(({ context, self, enqueue }) => {
        if (context.subject.type === 'element') {
          enqueue.spawnChild('relationshipsBrowserLogic', {
            id: `${self.id}-relationships`,
            input: {
              subject: context.subject.element,
              viewId: context.currentView.id,
              scope: 'view',
              enableSelectSubject: false,
              enableChangeScope: true,
              closeable: false,
            },
          })
        }
      }),
      exit: enqueueActions(({ context, self, enqueue }) => {
        if (context.subject.type === 'element') {
          enqueue.sendTo(`${self.id}-relationships`, { type: 'close' })
          enqueue.stopChild(`${self.id}-relationships`)
        }
      }),
      on: {
        'change.subject': {
          target: 'active',
          reenter: true,
          actions: assign({
            subject: ({ event }) => event.subject,
            // The card stays where it is, but it is no longer related to the node it was opened from
            initiatedFrom: ({ context }) => ({
              node: null,
              clientRect: context.initiatedFrom.clientRect,
            }),
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
    ElementDetailsInput,
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
