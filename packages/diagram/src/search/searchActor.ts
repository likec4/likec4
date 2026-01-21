import type { Fqn } from '@likec4/core/types'
import {
  type ActorRef,
  type SnapshotFrom,
  type StateMachine,
  assertEvent,
  assign,
  setup,
} from 'xstate'

export type SearchActorEvent =
  | { type: 'open'; search?: string | undefined }
  | { type: 'close' }
  | { type: 'change.search'; search: string }
  | { type: 'pickview.open'; elementFqn: Fqn }
  | { type: 'pickview.close' }

export interface SearchContext {
  openedWithSearch: string | null
  searchValue: string
  pickViewFor: Fqn | null
}

const _searchActorLogic = setup({
  types: {
    context: {} as SearchContext,
    events: {} as SearchActorEvent,
  },
  actions: {
    'change searchValue': assign({
      searchValue: ({ event, context }) => {
        assertEvent(event, ['change.search', 'open'])
        return event.search ?? context.searchValue
      },
    }),
    'reset pickViewFor': assign({
      pickViewFor: () => null,
    }),
  },
}).createMachine({
  id: 'search',
  context: {
    openedWithSearch: null,
    searchValue: '',
    pickViewFor: null,
  },
  initial: 'inactive',
  on: {
    'close': {
      target: '.inactive',
      actions: 'reset pickViewFor',
    },
  },
  states: {
    inactive: {
      on: {
        'open': {
          target: 'opened',
          actions: [
            assign({
              openedWithSearch: ({ event }) => event.search ?? null,
              searchValue: ({ event, context }) => event.search ?? context.searchValue,
            }),
          ],
        },
      },
    },
    opened: {
      on: {
        'open': {
          actions: 'change searchValue',
        },
        'change.search': {
          actions: 'change searchValue',
        },
        'pickview.open': {
          target: 'pickView',
          actions: assign({
            pickViewFor: ({ event }) => event.elementFqn,
          }),
        },
      },
    },
    pickView: {
      on: {
        'pickview.close': {
          target: 'opened',
          actions: 'reset pickViewFor',
        },
      },
    },
  },
})

export interface SearchActorLogic extends
  StateMachine<
    SearchContext,
    SearchActorEvent,
    {},
    any,
    any,
    any,
    any,
    'inactive' | 'opened' | 'pickView',
    never,
    never,
    any,
    any,
    any,
    any
  >
{
}
export const searchActorLogic: SearchActorLogic = _searchActorLogic as any

export type SearchActorSnapshot = SnapshotFrom<SearchActorLogic>
export interface SearchActorRef extends ActorRef<SearchActorSnapshot, SearchActorEvent> {}
