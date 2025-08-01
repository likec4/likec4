import { ViewId } from '@likec4/core/types'
import { isEmpty } from 'remeda'
import {
  type ActorLogicFrom,
  type ActorRefFrom,
  type SnapshotFrom,
  assertEvent,
  assign,
  emit,
  raise,
  setup,
} from 'xstate'
import type { CurrentViewModel } from '../likec4model/LikeC4ModelContext'

export interface NavigationPanelActorInput {
  viewModel: CurrentViewModel
}

export type NavigationPanelActorEvent =
  // Logic events
  | { type: 'update.inputs'; inputs: NavigationPanelActorInput }
  | { type: 'searchQuery.change'; value?: string }
  | { type: 'searchQuery.changed' }
  | { type: 'select.folder'; folderPath: string }
  | { type: 'select.view'; viewId: string }
  // Events from the UI
  // - From breadcrumbs
  | { type: 'breadcrumbs.mouseLeave' }
  | { type: 'breadcrumbs.mouseEnter.root' }
  | { type: 'breadcrumbs.mouseEnter.folder'; folderPath: string }
  | { type: 'breadcrumbs.mouseEnter.viewtitle' }
  | { type: 'breadcrumbs.click.root' }
  | { type: 'breadcrumbs.click.folder'; folderPath: string }
  | { type: 'breadcrumbs.click.viewtitle' }
  // - From dropdown
  | { type: 'dropdown.mouseEnter' }
  | { type: 'dropdown.mouseLeave' }
  | { type: 'dropdown.dismiss' }

export type NavigationPanelActorEmitted = { type: 'trigger.navigateTo'; viewId: ViewId }

export type BreadcrumbItem =
  | { type: 'folder'; folderPath: string; title: string }
  | { type: 'viewtitle'; title: string }

export type DropdownColumnItem =
  | {
    type: 'folder'
    folderPath: string
    title: string
    selected: boolean
  }
  | {
    type: 'view'
    viewType: 'element' | 'deployment' | 'dynamic' | 'index'
    viewId: string
    title: string
    description: string | null
    selected: boolean
  }

export interface NavigationPanelActorContext {
  viewModel: CurrentViewModel
  /**
   * Who activated the dropdown
   * (if `click` then the dropdown is always open until dismissed)
   * @default 'hover'
   */
  activatedBy: 'hover' | 'click'

  /**
   * The folder that is currently selected in the dropdown
   * By default it is the root
   */
  selectedFolder: string

  searchQuery: string
}

const _actorLogic = setup({
  types: {
    context: {} as NavigationPanelActorContext,
    events: {} as NavigationPanelActorEvent,
    tags: 'active',
    input: {} as NavigationPanelActorInput,
    emitted: {} as NavigationPanelActorEmitted,
  },
  delays: {
    'open timeout': 350,
    'close timeout': 350,
  },
  actions: {
    'update activatedBy': assign({
      activatedBy: ({ context, event }) => {
        switch (true) {
          case event.type.includes('click'):
            return 'click'
          case event.type.includes('mouseEnter'):
            return 'hover'
          default:
            return context.activatedBy
        }
      },
    }),
    'keep dropdown open': assign({
      activatedBy: 'click',
    }),
    'update selected folder': assign(({ event }) => {
      assertEvent(event, ['breadcrumbs.click.folder', 'select.folder'])
      return { selectedFolder: event.folderPath }
    }),
    'reset selected folder': assign({
      selectedFolder: ({ context }) => context.viewModel.folder.path,
    }),
    'update inputs': assign(({ context, event }) => {
      assertEvent(event, 'update.inputs')
      const viewChanged = event.inputs.viewModel.id !== context.viewModel.id
      let selectedFolder = context.selectedFolder
      if (!event.inputs.viewModel.folder.path.startsWith(selectedFolder)) {
        selectedFolder = event.inputs.viewModel.folder.path
      }
      return {
        viewModel: event.inputs.viewModel,
        selectedFolder,
        // allow dropdown to close on mouse leave if view changed
        activatedBy: viewChanged ? 'hover' : context.activatedBy,
      }
    }),
    'reset search query': assign({
      searchQuery: '',
    }),
    'update search query': assign(({ event }) => {
      assertEvent(event, 'searchQuery.change')
      return { searchQuery: event.value ?? '' }
    }),
    'emit trigger.navigateTo': emit(({ event }) => {
      assertEvent(event, 'select.view')
      return {
        type: 'trigger.navigateTo' as const,
        viewId: ViewId(event.viewId),
      }
    }),
  },
  guards: {
    'was opened on hover': ({ context }) => context.activatedBy === 'hover',
    'has search query': ({ context }) => !isEmpty(context.searchQuery),
    'search query is empty': ({ context }) => isEmpty(context.searchQuery),
  },
}).createMachine({
  id: 'breadcrumbs',
  context: ({ input }) => ({
    ...input,
    breadcrumbs: [],
    activatedBy: 'hover',
    selectedFolder: '',
    searchQuery: '',
    folderColumns: [],
  }),
  initial: 'idle',
  entry: [
    'update activatedBy',
    'reset selected folder',
  ],
  on: {
    'update.inputs': {
      actions: 'update inputs',
    },
    'searchQuery.change': {
      actions: [
        'update search query',
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
          actions: 'update activatedBy',
        },
        'breadcrumbs.click.*': {
          target: 'active',
          actions: 'update activatedBy',
        },
      },
    },
    // Breadcrumbs are hovered, but dropdown is not opened yet
    pending: {
      on: {
        'breadcrumbs.mouseEnter.*': {
          actions: 'update activatedBy',
        },
        'breadcrumbs.mouseLeave': {
          target: 'idle',
        },
        'breadcrumbs.click.*': {
          target: 'active',
          actions: 'update activatedBy',
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
              actions: 'keep dropdown open',
              target: 'search',
            },
            'breadcrumbs.click.folder': {
              actions: 'update selected folder',
              target: 'opened',
              reenter: true,
            },
            'breadcrumbs.click.viewtitle': {
              actions: 'reset selected folder',
              reenter: true,
              target: 'opened',
            },
            'select.folder': {
              actions: [
                'keep dropdown open',
                'update selected folder',
              ],
            },
            'select.view': {
              actions: [
                'emit trigger.navigateTo',
              ],
            },
          },
        },
        search: {
          on: {
            'breadcrumbs.click.folder': {
              actions: [
                'reset search query',
                'update selected folder',
              ],
              target: 'opened',
            },
            'breadcrumbs.click.*': {
              actions: [
                'reset search query',
                'reset selected folder',
              ],
              target: 'opened',
            },
            'select.view': {
              actions: [
                'emit trigger.navigateTo',
              ],
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

export interface NavigationPanelActorLogic extends ActorLogicFrom<typeof _actorLogic> {}
export const navigationPanelActorLogic: NavigationPanelActorLogic = _actorLogic

export type NavigationPanelActorSnapshot = SnapshotFrom<NavigationPanelActorLogic>
export interface NavigationPanelActorRef extends ActorRefFrom<NavigationPanelActorLogic> {}
