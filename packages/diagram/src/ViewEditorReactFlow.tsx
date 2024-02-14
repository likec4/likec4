import { invariant } from '@likec4/core'
import { useUnmountEffect } from '@react-hookz/web'
import { Background, Controls, ReactFlow as ReactXYFlow, type ReactFlowInstance } from '@xyflow/react'
import { memo, useCallback, useRef } from 'react'
import useTilg from 'tilg'
import { edgeTypes } from './edges'
import { nodeTypes } from './nodes'
import { useSetHoveredEdgeId } from './state'
import { EditorEdge, EditorNode } from './types'
import { useLikeC4Editor, useLikeC4EditorTriggers, useLikeC4EditorUpdate } from './ViewEditorApi'

type LikeC4ReactFlowProps = {
  defaultNodes?: EditorNode[] | undefined
  defaultEdges?: EditorEdge[] | undefined
}
export const LikeC4ReactFlow = memo<LikeC4ReactFlowProps>(function ReactFlow({
  defaultNodes = [],
  defaultEdges = []
}) {
  useTilg()
  const editor = useLikeC4Editor()
  const update = useLikeC4EditorUpdate()
  const trigger = useLikeC4EditorTriggers()

  const instanceRef = useRef<ReactFlowInstance>()
  const setHoveredEdgeId = useSetHoveredEdgeId()
  const lastClickTimeRef = useRef<number>(0)

  useUnmountEffect(() => {
    update({
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
      fitViewOptions={{
        maxZoom: 1,
        padding: editor.fitViewPadding
      }}
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
      onEdgeMouseEnter={(event, edge) => setHoveredEdgeId(edge.id)}
      onEdgeMouseLeave={(event, edge) => setHoveredEdgeId(null)}
      {...(editor.hasOnNodeClick && {
        onNodeClick: (event, node) => {
          invariant(EditorNode.is(node), `node is not a EditorNode`)
          trigger.onNodeClick(node, event)
        }
      })}
      {...(editor.hasOnEdgeClick && {
        onEdgeClick: (event, edge) => {
          invariant(EditorEdge.isRelationship(edge), `edge is not a relationship`)
          trigger.onEdgeClick(edge, event)
        }
      })}
      {...(editor.hasOnNodeContextMenu && {
        onEdgeContextMenu: (event, edge) => {
          event.preventDefault()
          event.stopPropagation()
        },
        onNodeContextMenu: (event, node) => {
          invariant(EditorNode.is(node), `node is not a EditorNode`)
          trigger.onNodeContextMenu(node, event)
        },
        onPaneContextMenu: (event) => {
          event.preventDefault()
          event.stopPropagation()
          // invariant(EditorNode.is(node), `node is not a EditorNode`)
          // editor.onNodeContextMenu(node.data, event)
        }
      })}
      onInit={useCallback(
        (instance) => {
          instanceRef.current = instance
          invariant(instance.viewportInitialized, `viewportInitialized is not true`)
          trigger.onInitialized(instance as any)
        },
        [update, trigger.onInitialized]
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
