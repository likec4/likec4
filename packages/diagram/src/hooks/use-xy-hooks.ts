import { useNodesData, useReactFlow } from '@xyflow/react'
import { type XYFlowEdge, type XYFlowNode } from '..'

export const useXYFlow = useReactFlow<XYFlowNode, XYFlowEdge>

export const useXYNodesData = useNodesData<XYFlowNode>
