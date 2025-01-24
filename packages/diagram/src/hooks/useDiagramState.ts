import { shallowEqual } from 'fast-equals'
import { useContext } from 'react'
import { useStoreWithEqualityFn as useZustandStore } from 'zustand/traditional'

import type { ViewId } from '@likec4/core'
// import { DiagramContext } from '../state/DiagramContext'
import { type DiagramContext, useDiagramContext } from '../hooks2'
import type { DiagramState, DiagramStoreApi } from '../state/diagramStore'

const selectViewId = (state: DiagramContext) => state.view.id
export function useCurrentViewId(): ViewId {
  return useDiagramContext(selectViewId)
}

export function useDiagramState<StateSlice = unknown>(
  selector: (state: DiagramState) => StateSlice,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean,
): StateSlice {
  const store = useContext(DiagramContext)

  if (store === null) {
    throw new Error('useDiagramStore could be used only inside DiagramContext')
  }

  return useZustandStore(store, selector, equalityFn ?? shallowEqual)
}

export function useDiagramStoreApi(): DiagramStoreApi {
  const store = useContext(DiagramContext)

  if (store === null) {
    throw new Error('useDiagramStoreApi could be used only inside DiagramContext')
  }

  return store
}
export type { DiagramState, DiagramStoreApi }
