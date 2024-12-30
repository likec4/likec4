import { useInternalNode, useNodesData, useReactFlow, useStore, useStoreApi } from '@xyflow/react'
import { deepEqual, shallowEqual } from 'fast-equals'
import { useCallback } from 'react'
import type { DiagramFlowTypes } from '../xyflow/types'

export const useXYFlow = useReactFlow<DiagramFlowTypes.Node, DiagramFlowTypes.Edge>

export const useXYNodesData = useNodesData<DiagramFlowTypes.Node>
export const useXYInternalNode = useInternalNode<DiagramFlowTypes.Node>

export function useXYStore<StateSlice = unknown>(
  selector: (state: DiagramFlowTypes.XYFlowState) => StateSlice,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean
): StateSlice {
  return useStore(
    selector as any,
    equalityFn ?? shallowEqual
  )
}
export const useXYStoreApi = useStoreApi<DiagramFlowTypes.Node, DiagramFlowTypes.Edge>
export type XYStoreApi = ReturnType<typeof useXYStoreApi>

export function useXYEdgesData(edgeIds: string[]): Pick<DiagramFlowTypes.Edge, 'id' | 'data'>[] {
  const ids = edgeIds.join(',')
  const edgesData = useXYStore(
    useCallback(
      (s) => {
        const data = [] as Pick<DiagramFlowTypes.Edge, 'id' | 'data'>[]
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
