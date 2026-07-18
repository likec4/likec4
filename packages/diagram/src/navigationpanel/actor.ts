import {
  type ActorRef,
  type SnapshotFrom,
  type StateMachine,
  type StateValueFrom,
  raise,
} from 'xstate'
import {
  emitNavigateTo,
  keepDropdownOpen,
  resetSearchQuery,
  resetSelectedFolder,
  updateActivatedBy,
  updateInputs,
  updateSearchQuery,
  updateSelectedFolder,
} from './actor.actions'
import {
  actor,
  Context as NavigationPanelActorContextFactory,
} from './actor.setup'
import type {
  Context as NavigationPanelActorContext,
  Events as NavigationPanelActorEvent,
  Input as NavigationPanelActorInput,
  Tags,
} from './actor.setup'

export type {
  NavigationPanelActorContext,
  NavigationPanelActorEvent,
  NavigationPanelActorInput,
}
export type { BreadcrumbItem, DropdownColumnItem } from './actor.setup'

const _actorLogic = actor.createMachine({
  id: 'navigationPanel',
  context: ({ input }) => NavigationPanelActorContextFactory({ input }),
  initial: 'idle',
  entry: [
    updateActivatedBy(),
    resetSelectedFolder(),
  ],
  on: {
    'update.inputs': {
      actions: updateInputs(),
    },
    'searchQuery.change': {
      actions: [
        updateSearchQuery(),
        raise({ type: 'searchQuery.changed' }),
      ],
    },
  },
  states: {
    idle: {
      id: 'idle',
      on: {
        'breadcrumbs.mouseEnter.*': {
          target: 'pending',
          actions: updateActivatedBy(),
        },
        'breadcrumbs.click.*': {
          target: 'active',
          actions: updateActivatedBy(),
        },
      },
    },
    // Breadcrumbs are hovered, but dropdown is not opened yet
    pending: {
      on: {
        'breadcrumbs.mouseEnter.*': {
          actions: updateActivatedBy(),
        },
        'breadcrumbs.mouseLeave.*': {
          target: 'idle',
        },
        'breadcrumbs.click.*': {
          target: 'active',
          actions: updateActivatedBy(),
        },
      },
      after: {
        'open timeout': {
          target: 'active',
        },
      },
    },
    active: {
      tags: ['active'],
      initial: 'decide',
      on: {
        'dropdown.dismiss': {
          target: '#idle',
        },
        'breadcrumbs.mouseLeave': {
          guard: 'was opened on hover',
          target: '.closing',
        },
        'dropdown.mouseLeave': {
          guard: 'was opened on hover',
          target: '.closing',
        },
        'searchQuery.changed': {
          target: '.decide',
        },
      },
      states: {
        // Decide next state based on the search query
        decide: {
          always: [
            {
              guard: 'has search query',
              target: 'search',
            },
            {
              target: 'opened',
            },
          ],
        },
        opened: {
          on: {
            'searchQuery.changed': {
              guard: 'has search query',
              actions: keepDropdownOpen(),
              target: 'search',
            },
            'breadcrumbs.click.viewtitle': {
              actions: resetSelectedFolder(),
            },
            'breadcrumbs.click.*': {
              actions: updateSelectedFolder(),
            },
            'select.folder': {
              actions: [
                keepDropdownOpen(),
                updateSelectedFolder(),
              ],
            },
            'select.view': {
              actions: emitNavigateTo(),
            },
          },
        },
        search: {
          on: {
            'breadcrumbs.click.viewtitle': {
              actions: [
                resetSearchQuery(),
                resetSelectedFolder(),
              ],
              target: 'opened',
            },
            'breadcrumbs.click.*': {
              actions: [
                resetSearchQuery(),
                updateSelectedFolder(),
              ],
              target: 'opened',
            },
            'select.view': {
              actions: emitNavigateTo(),
            },
          },
        },
        closing: {
          on: {
            'breadcrumbs.mouseEnter.*': {
              target: 'decide',
            },
            'dropdown.mouseEnter': {
              target: 'decide',
            },
          },
          after: {
            'close timeout': {
              target: '#idle',
            },
          },
        },
      },
    },
  },
})

export interface NavigationPanelActorLogic extends
  StateMachine<
    NavigationPanelActorContext,
    NavigationPanelActorEvent,
    any,
    any,
    any,
    any,
    any,
    StateValueFrom<typeof _actorLogic>,
    Tags,
    NavigationPanelActorInput,
    any,
    any,
    any,
    any
  >
{
}

export const navigationPanelActorLogic: NavigationPanelActorLogic = _actorLogic as any

export type NavigationPanelActorSnapshot = SnapshotFrom<NavigationPanelActorLogic>

export interface NavigationPanelActorRef extends
  ActorRef<
    NavigationPanelActorSnapshot,
    NavigationPanelActorEvent,
    never
  >
{}
