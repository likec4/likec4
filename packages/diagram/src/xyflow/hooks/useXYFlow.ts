import { useNodesData, useReactFlow, useStore, useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import type { XYFlowEdge, XYFlowNode, XYFlowState } from '../types'

export const useXYFlow = useReactFlow<XYFlowNode, XYFlowEdge>

export const useXYNodesData = useNodesData<XYFlowNode>

export function useXYStore<StateSlice = unknown>(
  selector: (state: XYFlowState) => StateSlice,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean
): StateSlice {
  return useStore(
    // @ts-expect-error - types are not correct
    selector,
    equalityFn ?? shallowEqual
  )
}
export const useXYStoreApi = useStoreApi<XYFlowNode, XYFlowEdge>
export type XYStoreApi = ReturnType<typeof useXYStoreApi>
