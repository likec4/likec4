import { shallowEqual } from 'fast-equals'
import { useContext, useMemo } from 'react'
import { useStoreWithEqualityFn as useZustandStore } from 'zustand/traditional'

import { DiagramContext } from './DiagramContext'
import type { DiagramState } from './diagramStore'

function useDiagramState<StateSlice = unknown>(
  selector: (state: DiagramState) => StateSlice,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean
) {
  const store = useContext(DiagramContext)

  if (store === null) {
    throw new Error('useDiagramStore could be used only inside DiagramContext')
  }

  return useZustandStore(store, selector, equalityFn ?? shallowEqual)
}

function useDiagramStoreApi() {
  const store = useContext(DiagramContext)

  if (store === null) {
    throw new Error('useDiagramStoreApi could be used only inside DiagramContext')
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
export type DiagramStoreApi = ReturnType<typeof useDiagramStoreApi>

export { useDiagramState, useDiagramStoreApi }
