import { shallowEqual } from 'fast-equals'
import { useContext } from 'react'
import { useStoreWithEqualityFn as useZustandStore } from 'zustand/traditional'

import { DiagramContext, type DiagramZustandStore } from './DiagramContext'
import type { DiagramState } from './diagramStore'

function useDiagramState<StateSlice = unknown>(
  selector: (state: DiagramState) => StateSlice,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean
): StateSlice {
  const store = useContext(DiagramContext)

  if (store === null) {
    throw new Error('useDiagramStore could be used only inside DiagramContext')
  }

  return useZustandStore(store, selector, equalityFn ?? shallowEqual)
}

export type DiagramStoreApi = Readonly<Pick<DiagramZustandStore, 'getState' | 'setState' | 'subscribe'>>
function useDiagramStoreApi(): DiagramStoreApi {
  const store = useContext(DiagramContext)

  if (store === null) {
    throw new Error('useDiagramStoreApi could be used only inside DiagramContext')
  }

  return store
}

export { useDiagramState, useDiagramStoreApi }
