import { shallowEqual } from 'fast-equals'
import { useContext } from 'react'
import { useStoreWithEqualityFn as useZustandStore } from 'zustand/traditional'

import { DiagramContext } from '../state/DiagramContext'
import type { DiagramState, DiagramStoreApi } from '../state/diagramStore'

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

function useDiagramStoreApi(): DiagramStoreApi {
  const store = useContext(DiagramContext)

  if (store === null) {
    throw new Error('useDiagramStoreApi could be used only inside DiagramContext')
  }

  return store
}
export type { DiagramState, DiagramStoreApi }
export { useDiagramState, useDiagramStoreApi }
