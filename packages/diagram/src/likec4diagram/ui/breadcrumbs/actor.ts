import type { LikeC4ViewsFolder } from '@likec4/core/model'
import { isEmpty, prop } from 'remeda'
import {
  type ActorLogicFrom,
  type ActorRefFrom,
  type SnapshotFrom,
  assertEvent,
  assign,
  raise,
  setup,
} from 'xstate'
import type { CurrentViewModelContextType } from '../../../likec4model/LikeC4ModelContext'

export interface BreadcrumbsActorInput {
  viewModel: CurrentViewModelContextType
}

export type BreadcrumbsActorEvent =
  // Logic events
  | { type: 'update.inputs'; inputs: BreadcrumbsActorInput }
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

export interface BreadcrumbsContext {
  viewModel: CurrentViewModelContextType
  breadcrumbs: Array<BreadcrumbItem>
  /**
   * Who initiated the dropdown
   * (mouseEnter coming from)
   * @default 'root'
   */
  initiator: 'root' | 'viewtitle' | { folderPath: string }
  initiateEvent: 'hover' | 'click'

  /**
   * The folder that is currently selected in the dropdown
   * By default it is the root
   */
  selectedFolder: string

  searchQuery: string

  folderColumns: Array<{
    folderPath: string
    items: Array<DropdownColumnItem>
  }>
}

function folderColumn(
  folder: LikeC4ViewsFolder,
  context: Pick<BreadcrumbsContext, 'selectedFolder' | 'viewModel'>,
): {
  folderPath: string
  items: Array<DropdownColumnItem>
} {
  return {
    folderPath: folder.path,
    items: [
      ...folder.folders.map(s => ({
        type: 'folder' as const,
        folderPath: s.path,
        title: s.title,
        selected: context.selectedFolder.startsWith(s.path),
      })),
      ...folder.views.map(s => ({
        type: 'view' as const,
        viewType: s.id === 'index' ? 'index' as const : s._type,
        viewId: s.id,
        title: s.title ?? s.id,
        description: s.description.nonEmpty && s.description.text || null,
        selected: s.id === context.viewModel.id,
      })),
    ],
  }
}

const _breadcrumbsActorLogic = setup({
  types: {
    context: {} as BreadcrumbsContext,
    events: {} as BreadcrumbsActorEvent,
    tags: 'active',
    input: {} as BreadcrumbsActorInput,
  },
  delays: {
    'open timeout': 350,
    'close timeout': 350,
  },
  actions: {
    'update breadcrumbs': assign({
      breadcrumbs: ({ context }): BreadcrumbItem[] => {
        const folder = context.viewModel.folder
        return [
          ...(folder.isRoot ? [] : folder.breadcrumbs.map(s => ({
            type: 'folder' as const,
            folderPath: s.path,
            title: s.title,
          }))),
          { type: 'viewtitle', title: context.viewModel.title ?? 'Untitled' },
        ]
      },
    }),
    'keep dropdown open': assign({
      initiateEvent: 'click',
    }),
    'update selected folder': assign(({ event }) => {
      assertEvent(event, ['breadcrumbs.click.folder', 'select.folder'])
      return { selectedFolder: event.folderPath }
    }),
    'reset selected folder': assign({
      selectedFolder: ({ context }) => context.viewModel.folder.path,
    }),
    'update folder columns': assign(({ context }) => {
      const viewModel = context.viewModel
      const likec4model = viewModel.$model
      const columns: BreadcrumbsContext['folderColumns'] = [
        folderColumn(likec4model.rootViewFolder, context),
      ]
      const folder = likec4model.viewFolder(context.selectedFolder)
      if (!folder.isRoot) {
        for (const b of folder.breadcrumbs) {
          columns.push(folderColumn(b, context))
        }
      }
      return { folderColumns: columns }
    }),
    'update initiator': assign({
      initiator: ({ event, context }) => {
        switch (event.type) {
          case 'breadcrumbs.mouseEnter.root':
          case 'breadcrumbs.click.root':
            return 'root'
          case 'breadcrumbs.mouseEnter.viewtitle':
          case 'breadcrumbs.click.viewtitle':
            return 'viewtitle'
          case 'breadcrumbs.mouseEnter.folder':
          case 'breadcrumbs.click.folder':
            return { folderPath: event.folderPath }
          default:
            return context.initiator
        }
      },
      initiateEvent: ({ event }) => {
        return event.type.includes('click') ? 'click' : 'hover'
      },
    }),
    'trigger navigateTo': (_, params: { viewId: string }) => {
      throw new Error('Not implemented')
    },
    'update inputs': assign(({ context, event }) => {
      assertEvent(event, 'update.inputs')
      let selectedFolder = context.selectedFolder
      if (!event.inputs.viewModel.folder.path.startsWith(selectedFolder)) {
        selectedFolder = event.inputs.viewModel.folder.path
      }
      return {
        viewModel: event.inputs.viewModel,
        selectedFolder,
      }
    }),
    'reset search query': assign({
      searchQuery: '',
    }),
    'update search query': assign(({ event }) => {
      assertEvent(event, 'searchQuery.change')
      return { searchQuery: event.value ?? '' }
    }),
  },
  guards: {
    'was opened on hover': ({ context }) => context.initiateEvent === 'hover',
    'has search query': ({ context }) => !isEmpty(context.searchQuery),
    'search query is empty': ({ context }) => isEmpty(context.searchQuery),
  },
}).createMachine({
  id: 'breadcrumbs',
  context: ({ input }) => ({
    ...input,
    breadcrumbs: [],
    initiator: 'root',
    initiateEvent: 'hover',
    selectedFolder: '',
    searchQuery: '',
    folderColumns: [],
  }),
  initial: 'idle',
  entry: [
    'update breadcrumbs',
    'reset selected folder',
  ],
  on: {
    'update.inputs': {
      actions: [
        'update inputs',
        'update breadcrumbs',
        'update folder columns',
      ],
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
          actions: 'update initiator',
        },
        'breadcrumbs.click.*': {
          target: 'active',
          actions: 'update initiator',
        },
      },
    },
    // Breadcrumbs are hovered, but dropdown is not opened yet
    pending: {
      on: {
        'breadcrumbs.mouseEnter.*': {
          actions: 'update initiator',
        },
        'breadcrumbs.mouseLeave': {
          target: 'idle',
        },
        'breadcrumbs.click.*': {
          target: 'active',
          actions: 'update initiator',
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
          entry: 'update folder columns',
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
                'update folder columns',
              ],
            },
            'select.view': {
              actions: [
                'keep dropdown open',
                {
                  type: 'trigger navigateTo',
                  params: prop('event'),
                },
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
              actions: {
                type: 'trigger navigateTo',
                params: prop('event'),
              },
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

export interface BreadcrumbsActorLogic extends ActorLogicFrom<typeof _breadcrumbsActorLogic> {}
export const breadcrumbsActorLogic: BreadcrumbsActorLogic = _breadcrumbsActorLogic

export type BreadcrumbsActorSnapshot = SnapshotFrom<BreadcrumbsActorLogic>
export interface BreadcrumbsActorRef extends ActorRefFrom<BreadcrumbsActorLogic> {}
