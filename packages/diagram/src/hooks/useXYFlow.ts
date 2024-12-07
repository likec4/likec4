import { useInternalNode, useNodesData, useReactFlow, useStore, useStoreApi } from '@xyflow/react'
import { deepEqual, shallowEqual } from 'fast-equals'
import { useCallback } from 'react'
import type { XYFlowEdge, XYFlowNode, XYFlowState } from '../xyflow/types'

export const useXYFlow = useReactFlow<XYFlowNode, XYFlowEdge>

export const useXYNodesData = useNodesData<XYFlowNode>
export const useXYInternalNode = useInternalNode<XYFlowNode>

export function useXYStore<StateSlice = unknown>(
  selector: (state: XYFlowState) => StateSlice,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean
): StateSlice {
  return useStore(
    selector as any,
    equalityFn ?? shallowEqual
  )
}
export const useXYStoreApi = useStoreApi<XYFlowNode, XYFlowEdge>
export type XYStoreApi = ReturnType<typeof useXYStoreApi>

export function useXYEdgesData(edgeIds: string[]): Pick<XYFlowEdge, 'id' | 'data'>[] {
  const ids = edgeIds.join(',')
  const edgesData = useXYStore(
    useCallback(
      (s) => {
        const data = [] as Pick<XYFlowEdge, 'id' | 'data'>[]
        for (const id of edgeIds) {
          const edge = s.edgeLookup.get(id)
          if (edge) {
            data.push({
              id: edge.id,
              data: edge.data
            })
          }
        }

        return data
      },
      [ids]
    ),
    deepEqual
  )

  return edgesData
}
