import { useUnmountEffect } from '@react-hookz/web'
import { Background, Controls, ReactFlow, type ReactFlowInstance, ViewportPortal } from '@xyflow/react'
import { memo, useCallback, useMemo, useRef } from 'react'
import useTilg from 'tilg'
import { edgeTypes } from './edges'
import { nodeTypes } from './nodes'
import { useSetHoveredEdgeId } from './state'
import type { EditorEdge, EditorNode } from './types'
import StylesPanel from './ui/StylesPanel'
import { useLikeC4Editor, useLikeC4EditorState, useLikeC4EditorUpdate } from './ViewEditorApi'

type LikeC4ReactFlowProps = {
  defaultNodes?: EditorNode[] | undefined
  defaultEdges?: EditorEdge[] | undefined
}
export const LikeC4ReactFlow = memo<LikeC4ReactFlowProps>(function LikeC4ReactFlow({
  defaultNodes = [],
  defaultEdges = []
}) {
  useTilg()
  const [editor, updateState] = useLikeC4EditorState()
  const instanceRef = useRef<ReactFlowInstance>()
  const setHoveredEdgeId = useSetHoveredEdgeId()
  const lastClickTimeRef = useRef<number>(0)

  useUnmountEffect(() => {
    updateState({
      reactflow: null
    })
  })

  return (
    <ReactFlow
      colorMode="dark"
      defaultNodes={defaultNodes}
      defaultEdges={defaultEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      maxZoom={1.9}
      minZoom={0.1}
      fitView
      panOnScroll
      elementsSelectable={editor.nodesSelectable}
      nodesDraggable={editor.nodesDraggable}
      edgesUpdatable={false}
      zoomOnDoubleClick={false}
      elevateNodesOnSelect={false} // or edges are not visible after select
      selectNodesOnDrag={false} // or camera does not work
      fitViewOptions={useMemo(() => ({
        maxZoom: 1.05,
        padding: 0.1
      }), [])}
      // onNodeClick={useCallback((event, node) => {
      //   const api = instanceRef.current
      //   if (!api) {
      //     return
      //   }
      //   api.
      //   api.setCenter(node.position.x, node.position.y)
      // }, [])}
      onEdgeMouseEnter={useCallback((event, edge) => {
        setHoveredEdgeId(edge.id)
      }, [])}
      onEdgeMouseLeave={useCallback((event, edge) => {
        setHoveredEdgeId(null)
      }, [])}
      onInit={useCallback((instance) => {
        instanceRef.current = instance
        updateState({
          reactflow: instance as any
        })
      }, [updateState])}
      onPaneClick={useCallback(e => {
        // Workaround for dbl click
        const ts = e.timeStamp
        if (lastClickTimeRef.current > 0) {
          const diff = ts - lastClickTimeRef.current
          if (diff < 300) {
            instanceRef.current?.fitView({
              duration: 350,
              maxZoom: 1.05,
              padding: 0.1
            })
            lastClickTimeRef.current = 0
            return
          }
        }
        lastClickTimeRef.current = ts
      }, [])}
      // onNodeDrag={useCallback((event, node) => {
      //   // console.log('onNodeDrag', node)
      //   const api = instanceRef.current
      //   if (!api) {
      //     return
      //   }
      //   if (node.parentNode && node.extent && Array.isArray(node.extent)) {
      //     if (node.position.x > node.extent[1][0] - 20) {
      //       api.updateNode(node.parentNode, (nd) => ({
      //         width: (nd.width ?? 0) + 20
      //       }))
      //       api.updateNode(node.id, {
      //         extent: [
      //           node.extent[0],
      //           [node.extent[1][0] + 20, node.extent[1][1]]
      //         ]
      //       })
      //     }
      //   }
      // }, [])}
    >
      {!editor.disableBackground && <Background />}
      <Controls />
    </ReactFlow>
  )
}, (prev, next) => true)
LikeC4ReactFlow.displayName = 'LikeC4ReactFlow'
