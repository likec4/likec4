import type { LayoutedView, ViewId } from '@likec4/core/types'
import { isEmpty } from 'remeda'
import { setup } from 'xstate'
import type { CurrentViewModel } from '../hooks/useCurrentViewModel'

export interface Input {
  view: LayoutedView
  viewModel: CurrentViewModel | null
}

export type Events =
  // Logic events
  | { type: 'update.inputs'; inputs: Input }
  | { type: 'searchQuery.change'; value: string }
  | { type: 'searchQuery.changed' }
  | { type: 'select.folder'; folderPath: string }
  | { type: 'select.view'; viewId: ViewId }
  // Events from the UI
  // - From breadcrumbs
  | { type: 'breadcrumbs.mouseLeave' }
  | { type: 'breadcrumbs.mouseEnter.root' }
  | { type: 'breadcrumbs.mouseLeave.root' }
  | { type: 'breadcrumbs.mouseEnter.folder'; folderPath: string }
  | { type: 'breadcrumbs.mouseLeave.folder'; folderPath: string }
  | { type: 'breadcrumbs.mouseEnter.viewtitle' }
  | { type: 'breadcrumbs.mouseLeave.viewtitle' }
  | { type: 'breadcrumbs.click.root' }
  | { type: 'breadcrumbs.click.folder'; folderPath: string }
  | { type: 'breadcrumbs.click.viewtitle' }
  // - From dropdown
  | { type: 'dropdown.mouseEnter' }
  | { type: 'dropdown.mouseLeave' }
  | { type: 'dropdown.dismiss' }

export type Emitted = unknown

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

export interface Context {
  view: LayoutedView

  viewModel: CurrentViewModel | null
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

export type Tags = 'active'

export function Context({ input }: { input: Input }): Context {
  return {
    ...input,
    activatedBy: 'hover',
    selectedFolder: '',
    searchQuery: '',
  }
}

export const actor = setup({
  types: {
    context: {} as Context,
    events: {} as Events,
    tags: '' as Tags,
    input: {} as Input,
    // emitted: {} as Emitted,
  },
  delays: {
    'open timeout': 500,
    'close timeout': 350,
  },
  guards: {
    'was opened on hover': ({ context }) => context.activatedBy === 'hover',
    'has search query': ({ context }) => !isEmpty(context.searchQuery),
    'search query is empty': ({ context }) => isEmpty(context.searchQuery),
  },
})
