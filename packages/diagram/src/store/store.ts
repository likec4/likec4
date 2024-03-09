import { applyEdgeChanges, applyNodeChanges, OnEdgesChange, OnNodesChange } from '@xyflow/react'
import { create } from 'zustand'

import type { XYFlowEdge, XYFlowNode } from '..'

type RFState = {
  nodes: XYFlowNode[]
  edges: XYFlowEdge[]
  onNodesChange: OnNodesChange<XYFlowNode>
  onEdgesChange: OnEdgesChange<XYFlowEdge>
  setNodes: (nodes: XYFlowNode[]) => void
  setEdges: (edges: XYFlowEdge[]) => void
}

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<RFState>((set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    })
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges)
    })
  },
  setNodes: (nodes) => {
    set({ nodes })
  },
  setEdges: (edges) => {
    set({ edges })
  }
}))

export default useStore
