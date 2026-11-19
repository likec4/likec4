import { useHotkeys } from '@mantine/hooks'
import { useSelector, useStore } from '@xstate/store-react'
import type { PropsWithChildren } from 'react'
import { WorkspaceSearchContext, workspaceSearchLogic } from './store'
import { WorkspaceSearch } from './WorkspaceSearch'

/**
 * State of the workspace search, shared by the trigger and the overlay.
 * Renders the overlay and binds `mod+K` and `/` to open it
 */
export function WorkspaceSearchProvider({ children }: PropsWithChildren) {
  const store = useStore(workspaceSearchLogic)
  const opened = useSelector(store.selectors.opened)
  useHotkeys(
    opened ? [] : [
      ['mod+k', () => store.trigger.open({}), { preventDefault: true }],
      ['/', () => store.trigger.open({}), { preventDefault: true }],
    ],
  )
  return (
    <WorkspaceSearchContext value={store}>
      {children}
      <WorkspaceSearch />
    </WorkspaceSearchContext>
  )
}
