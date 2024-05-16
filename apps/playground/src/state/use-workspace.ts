import { shallowEqual } from 'fast-equals'
import { useContext, useMemo } from 'react'
import { useStoreWithEqualityFn as useZustandStore } from 'zustand/traditional'

import type { WorkspaceState } from './store'
import { WorkspaceContext } from './WorkspaceContext'

function useWorkspaceState<StateSlice = unknown>(
  selector: (state: WorkspaceState) => StateSlice,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean
) {
  const store = useContext(WorkspaceContext)

  if (store === null) {
    throw new Error('useWorkspaceState could be used only inside WorkspaceContext')
  }

  return useZustandStore(store, selector, equalityFn ?? shallowEqual)
}

function useStoreApi() {
  const store = useContext(WorkspaceContext)

  if (store === null) {
    throw new Error('useStoreApi could be used only inside WorkspaceContext')
  }

  return useMemo(
    () => ({
      getState: store.getState,
      setState: store.setState,
      subscribe: store.subscribe
    }),
    [store]
  )
}
export type StoreApi = ReturnType<typeof useStoreApi>

export { useStoreApi, useWorkspaceState }
