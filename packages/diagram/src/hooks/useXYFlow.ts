import {
  type InternalNode,
  type ReactFlowInstance,
  type ReactFlowState,
  useInternalNode,
  useReactFlow,
  useStore,
  useStoreApi,
} from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { useCallback } from 'react'
import type { Types } from '../likec4diagram/types'
import { useCallbackRef } from './useCallbackRef'

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
    useCallbackRef(selector as any),
    equalityFn ?? shallowEqual,
  )
}

export function useXYStoreApi(): XYStoreApi {
  return useStoreApi<Types.AnyNode, Types.AnyEdge>()
}
export type XYStoreApi = {
  getState: () => XYStoreState
  setState: (state: Partial<XYStoreState> | ((state: XYStoreState) => Partial<XYStoreState>)) => void
  subscribe: (listener: (state: XYStoreState, prevState: XYStoreState) => void) => () => void
}

export type XYInternalNode = InternalNode<Types.AnyNode>
export function useXYInternalNode(id: string): XYInternalNode | undefined {
  return useInternalNode<Types.AnyNode>(id)
}
/**
 * Returns the current zoom level of the flow.
 * @param precision The number of decimal places to round to, defaults to 2 (i.e. 1.23)
 * @returns The current zoom level of the flow.
 */
export function useCurrentZoom(precision = 2): number {
  return useStore(useCallback(state => Math.round(state.transform[2] * 10 ** precision) / 10 ** precision, [precision]))
}

export function useCurrentZoomAtLeast(minZoom: number): boolean {
  return useStore(useCallback(state => state.transform[2] >= minZoom, [minZoom]))
}

const selectZoom = (state: ReactFlowState) => state.transform[2] < 0.2
export function useIsZoomTooSmall(): boolean {
  return useStore(selectZoom)
}
