import { useInternalNode, useReactFlow, useStoreApi } from '@xyflow/react'
import type { Types } from '../types'

export const useXYFlow = useReactFlow<Types.Node, Types.Edge>

export const useXYStoreApi = useStoreApi<Types.Node, Types.Edge>
export type XYStoreApi = ReturnType<typeof useXYStoreApi>

export const useXYInternalNode = useInternalNode<Types.Node>
