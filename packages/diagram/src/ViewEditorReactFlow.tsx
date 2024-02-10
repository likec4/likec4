import { invariant } from '@likec4/core'
import { useUnmountEffect } from '@react-hookz/web'
import {
  Background,
  Controls,
  type EdgeMouseHandler,
  type NodeMouseHandler,
  ReactFlow as ReactXYFlow,
  type ReactFlowInstance,
  ViewportPortal
} from '@xyflow/react'
import { memo, useCallback, useMemo, useRef } from 'react'
import { isNumber } from 'remeda'
import useTilg from 'tilg'
import { edgeTypes } from './edges'
import { nodeTypes } from './nodes'
import { useSetHoveredEdgeId } from './state'
import { EditorEdge, EditorNode } from './types'
import StylesPanel from './ui/StylesPanel'
import { useLikeC4Editor, useLikeC4EditorState, useLikeC4EditorUpdate } from './ViewEditorApi'

type LikeC4ReactFlowProps = {
  defaultNodes?: EditorNode[] | undefined
  defaultEdges?: EditorEdge[] | undefined
}
export const LikeC4ReactFlow = memo<LikeC4ReactFlowProps>(function ReactFlow({
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
    <ReactXYFlow
      colorMode={editor.colorMode}
      defaultNodes={defaultNodes}
      defaultEdges={defaultEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      zoomOnPinch={editor.zoomable}
      zoomOnScroll={editor.zoomable && !editor.pannable}
      {...(!editor.zoomable && {
        zoomActivationKeyCode: null
      })}
      maxZoom={1.9}
      minZoom={0.1}
      fitView
      fitViewOptions={useMemo(() => ({
        maxZoom: 1.05,
        padding: editor.fitViewPadding
      }), [editor.fitViewPadding])}
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll={editor.pannable}
      panOnDrag={editor.pannable}
      elementsSelectable={editor.nodesSelectable}
      {...(!editor.nodesSelectable && {
        selectionKeyCode: null
      })}
      nodesDraggable={editor.nodesDraggable}
      // edgesUpdatable={false}
      zoomOnDoubleClick={false}
      elevateNodesOnSelect={false} // or edges are not visible after select
      selectNodesOnDrag={false} // or camera does not work
      onNodeClick={useCallback(
        (event, node) => {
          invariant(EditorNode.is(node), `node is not a EditorNode`)
          editor.onNodeClick(node.data, event)
        },
        [editor.onNodeClick]
      )}
      onEdgeClick={useCallback(
        (event, edge) => {
          invariant(EditorEdge.isRelationship(edge), `edge is not a relationship`)
          editor.onEdgeClick(edge.data.edge, event)
        },
        [editor.onEdgeClick]
      )}
      onEdgeMouseEnter={useCallback(
        (event, edge) => setHoveredEdgeId(edge.id),
        []
      )}
      onEdgeMouseLeave={useCallback(
        (event, edge) => {
          setHoveredEdgeId(null)
        },
        []
      )}
      onEdgeContextMenu={useCallback(
        (event, edge) => {
          event.preventDefault()
          event.stopPropagation()
          // invariant(EditorNode.is(node), `node is not a EditorNode`)
          // editor.onNodeContextMenu(node.data, event)
        },
        []
      )}
      onNodeContextMenu={useCallback(
        (event, node) => {
          invariant(EditorNode.is(node), `node is not a EditorNode`)
          editor.onNodeContextMenu(node.data, event)
        },
        [editor.onNodeContextMenu]
      )}
      onPaneContextMenu={useCallback(
        (event) => {
          event.preventDefault()
          event.stopPropagation()
          // invariant(EditorNode.is(node), `node is not a EditorNode`)
          // editor.onNodeContextMenu(node.data, event)
        },
        []
      )}
      onInit={useCallback(
        (instance) => {
          instanceRef.current = instance
          updateState({
            reactflow: instance as any
          })
        },
        [updateState]
      )}
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
      data-likec4-view-no-pan={!editor.pannable}
      data-likec4-view-no-bg={editor.disableBackground}
    >
      {!editor.disableBackground && <Background />}
      {editor.controls && <Controls />}
    </ReactXYFlow>
  )
}, (prev, next) => true)
LikeC4ReactFlow.displayName = 'LikeC4ReactFlow'
