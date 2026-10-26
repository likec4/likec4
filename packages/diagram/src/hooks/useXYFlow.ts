import { type ReactFlowInstance, type ReactFlowState, useReactFlow, useStore, useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { useCallback } from 'react'
import type { Types } from '../likec4diagram/types'

export type XYFlowInstance = ReactFlowInstance<Types.AnyNode, Types.AnyEdge>
export function useXYFlow(): XYFlowInstance {
  return useReactFlow<Types.AnyNode, Types.AnyEdge>()
}

export type XYStoreState = ReactFlowState<Types.AnyNode, Types.AnyEdge>

export function useXYStore<StateSlice = unknown>(
  selector: (state: XYStoreState) => StateSlice,
  equalityFn?: (a: NoInfer<StateSlice>, b: NoInfer<StateSlice>) => boolean,
): StateSlice {
  return useStore(
    selector as any,
    equalityFn ?? shallowEqual,
  )
}

export function selectXYStore<StateSlice = unknown>(selector: (state: XYStoreState) => StateSlice) {
  return selector
}

export function useXYStoreApi(): XYStoreApi {
  return useStoreApi<Types.AnyNode, Types.AnyEdge>()
}
export type XYStoreApi = {
  getState: () => XYStoreState
  setState: (state: Partial<XYStoreState> | ((state: XYStoreState) => Partial<XYStoreState>)) => void
  subscribe: (listener: (state: XYStoreState, prevState: XYStoreState) => void) => () => void
}

export function useCurrentZoomAtLeast(minZoom: number): boolean {
  return useStore(useCallback(state => state.transform[2] >= minZoom, [minZoom]))
}

const selectZoom = (state: ReactFlowState) => state.transform[2] < 0.2
export function useIsZoomTooSmall(): boolean {
  return useStore(selectZoom)
}
