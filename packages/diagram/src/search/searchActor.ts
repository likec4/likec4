import type { Fqn, NodeId, ViewId } from '@likec4/core/types'
import {
  type ActorRef,
  type SnapshotFrom,
  type StateMachine,
  assertEvent,
  assign,
  enqueueActions,
  setup,
} from 'xstate'
import { typedSystem } from '../likec4diagram/state/utils'

export type SearchActorEvent =
  | { type: 'open'; search?: string | undefined }
  | { type: 'close' }
  | { type: 'change.search'; search: string }
  | { type: 'pickview.open'; elementFqn: Fqn }
  | { type: 'navigate.to'; viewId: ViewId; focusOnElement?: Fqn | undefined }
  | { type: 'animation.presence.end' } // Event when presence transition (close) animation ends
  | { type: 'pickview.close' }

export interface SearchContext {
  openedWithSearch: string | null
  searchValue: string
  pickViewFor: Fqn | null

  navigateTo: {
    viewId: ViewId
    focusOnElement?: Fqn | undefined
  } | null
}

const _searchActorLogic = setup({
  types: {
    context: {} as SearchContext,
    events: {} as SearchActorEvent,
  },
  actions: {
    'reset navigateTo': assign({
      navigateTo: () => null,
    }),
    'assign navigateTo': assign(({ event }) => {
      assertEvent(event, ['navigate.to'])
      return {
        navigateTo: {
          viewId: event.viewId,
          focusOnElement: event.focusOnElement,
        },
      }
    }),
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
    navigateTo: null,
  },
  initial: 'inactive',
  on: {
    'close': {
      target: '.inactive',
    },
  },
  states: {
    inactive: {
      entry: [
        'reset navigateTo',
        'reset pickViewFor',
      ],
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
        'navigate.to': {
          target: 'waitAnimationEnd',
          actions: 'assign navigateTo',
        },
      },
    },
    pickView: {
      on: {
        'pickview.close': {
          target: 'opened',
          actions: 'reset pickViewFor',
        },
        'navigate.to': {
          target: 'waitAnimationEnd',
          actions: 'assign navigateTo',
        },
      },
    },
    /**
     * Wait for animation end before triggering navigation
     * Otherwise, there could be weird artifacts when navigating to large diagrams.
     */
    waitAnimationEnd: {
      on: {
        'animation.presence.end': {
          target: 'inactive',
          actions: enqueueActions(({ context, system, enqueue }) => {
            const navigateTo = context.navigateTo
            if (!navigateTo) return

            enqueue('reset navigateTo')

            const diagramActor = typedSystem(system).diagramActorRef
            // If we need to focus on an element, we should not navigate to the view
            // as it will cause the view to be re-rendered and the focus will be lost
            if (navigateTo.focusOnElement) {
              const viewId = diagramActor.getSnapshot().context.view.id
              if (viewId === navigateTo.viewId) {
                enqueue.sendTo(diagramActor, {
                  type: 'focus.node',
                  nodeId: navigateTo.focusOnElement as NodeId,
                })
                return
              }
            }
            enqueue.sendTo(diagramActor, {
              type: 'navigate.to',
              ...navigateTo,
            })
          }),
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
    'inactive' | 'opened' | 'pickView' | 'waitAnimationEnd',
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
