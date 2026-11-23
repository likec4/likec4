import type { ProjectId } from '@likec4/core/types'
import {
  type StandardSchemaV1,
  type StoreFromStoreLogicCreator,
  createStoreLogic,
  useSelector,
} from '@xstate/store-react'
import { shallowEqual } from 'fast-equals'
import { createContext, use } from 'react'
import type { SearchElement } from './search-index'

/**
 * Removes the `@project` prefix that picks a scope
 */
function stripScopePrefix(query: string): string {
  return query.replace(/^\s*@\S*\s*/, '')
}

export interface WorkspaceSearchState {
  readonly opened: boolean
  readonly query: string
  /**
   * Project picked to limit the search to
   */
  readonly scope: ProjectId | null
  /**
   * Element whose views are listed to pick one
   */
  readonly pick: SearchElement | null
  /**
   * Incremented on every open, a new search session gets a new dialog
   */
  readonly session: number
}

const initialState: WorkspaceSearchState = {
  opened: false,
  query: '',
  scope: null,
  pick: null,
  session: 0,
}

export const workspaceSearchLogic = createStoreLogic({
  schemas: {
    context: {} as StandardSchemaV1<WorkspaceSearchState, WorkspaceSearchState>,
  },
  context: initialState,
  selectors: {
    opened: (state: WorkspaceSearchState) => state.opened,
  },
  on: {
    /**
     * Opens a fresh search, with the text typed into the trigger
     */
    open: (context, { query = '' }: { query?: string }) => ({
      opened: true,
      query,
      scope: null,
      pick: null,
      session: context.session + 1,
    }),
    close: context => ({ ...context, opened: false }),
    changeQuery: (context, { query }: { query: string }) => ({ ...context, query, pick: null }),
    changeScope: (context, { scope }: { scope: ProjectId | null }) => ({
      ...context,
      scope,
      query: stripScopePrefix(context.query),
      // the picked element may be from another project
      pick: null,
    }),
    /**
     * Clears query and scope, keeps the search open
     */
    reset: context => ({ ...context, query: '', scope: null, pick: null }),
    pickView: (context, { element }: { element: SearchElement }) => ({ ...context, pick: element }),
    cancelPick: context => ({ ...context, pick: null }),
  },
})

export type WorkspaceSearchStore = StoreFromStoreLogicCreator<typeof workspaceSearchLogic>

export const WorkspaceSearchContext = createContext<WorkspaceSearchStore | null>(null)

function useWorkspaceSearchStore(): WorkspaceSearchStore {
  const store = use(WorkspaceSearchContext)
  if (!store) {
    throw new Error('WorkspaceSearchProvider is missing')
  }
  return store
}

/**
 * Selects from the search state
 */
export function useWorkspaceSearch<T>(selector: (state: WorkspaceSearchState) => T): T {
  const store = useWorkspaceSearchStore()
  return useSelector(
    store,
    s => selector(s.context),
    shallowEqual,
  )
}

/**
 * Events of the search state
 */
export function useWorkspaceSearchActions(): WorkspaceSearchStore['trigger'] {
  return useWorkspaceSearchStore().trigger
}
