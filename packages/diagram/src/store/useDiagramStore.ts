import { useContext, useMemo } from 'react'
import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn as useZustandStore } from 'zustand/traditional'

import { DiagramContext } from './DiagramContext'
import type { DiagramState } from './types'

function useDiagramStore<StateSlice = unknown>(
  selector: (state: DiagramState) => StateSlice,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean
) {
  const store = useContext(DiagramContext)

  if (store === null) {
    throw new Error('useDiagramStore could be used only inside DiagramContext')
  }

  return useZustandStore(store, selector, equalityFn ?? shallow)
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

export { useDiagramStore, useDiagramStoreApi }
