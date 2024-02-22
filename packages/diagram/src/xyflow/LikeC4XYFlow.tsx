import { invariant } from '@likec4/core'
import { useRafCallback, useUnmountEffect } from '@react-hookz/web'
import { Background, Controls, ReactFlow } from '@xyflow/react'
import { memo, useCallback, useRef } from 'react'
import useTilg from 'tilg'
import { useLikeC4View, useLikeC4ViewTriggers } from '../state'
import { createLayoutConstraints } from '../state/cassowary'
import { edgeTypes } from './edges'
import { nodeTypes } from './nodes'
import { XYFlowEdge, type XYFlowInstance, XYFlowNode } from './types'

type LikeC4XYFlowProps = {
  defaultNodes?: XYFlowNode[] | undefined
  defaultEdges?: XYFlowEdge[] | undefined
}

type Solver = ReturnType<typeof createLayoutConstraints>

export const LikeC4XYFlow = memo<LikeC4XYFlowProps>(({
  defaultNodes = [],
  defaultEdges = []
}) => {
  useTilg()
  const [editor, update] = useLikeC4View()
  const trigger = useLikeC4ViewTriggers()

  const instanceRef = useRef<XYFlowInstance>()
  const solverRef = useRef<Solver>()
  const lastClickTimeRef = useRef<number>(0)

  useUnmountEffect(() => {
    update({
      xyflow: null
    })
  })

  const colorMode = editor.colorMode === 'auto' ? 'system' : editor.colorMode

  const onNodeDragStart = useCallback((event: React.MouseEvent) => {
  }, [])

  const [render, cancel] = useRafCallback(() => {
    if (!solverRef.current) {
      return
    }
    const positioned = new Map(solverRef.current.solve().map((r) => [r.id, r]))
    instanceRef.current?.setNodes(nodes =>
      nodes.map((n) => {
        if (n.dragging) {
          return n
        }
        const next = positioned.get(n.data.element.id)
        if (!next || next.isEditing) {
          return n
        }
        return {
          ...n,
          position: next.position,
          width: next.width,
          height: next.height
          // computed: Object.assign(node.computed ?? {}, {
          //   positionAbsolute: dim.positionAbsolute
          // })
        }
      })
    )
  })

  return (
    <ReactFlow
      colorMode={colorMode}
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
      onNodeDragStart={(event, node) => {
        cancel()
        invariant(XYFlowNode.is(node), `node is not a EditorNode`)
        solverRef.current = createLayoutConstraints(editor.viewNodes, node.data.element.id)
      }}
      onNodeDrag={(event, { computed }) => {
        if (!solverRef.current) {
          return
        }
        const next = computed?.positionAbsolute
        if (next) {
          solverRef.current.moveTo(next)
          render()
        }
      }}
      onNodeDragStop={(event, node) => {
        cancel()
        solverRef.current = undefined
      }}
      onEdgeMouseEnter={(event, edge) => {
        update({
          hoveredEdgeId: edge.id
        })
      }}
      onEdgeMouseLeave={(event, edge) => {
        update({
          hoveredEdgeId: null
        })
      }}
      {...(editor.hasOnNodeClick && {
        onNodeClick: (event, node) => {
          invariant(XYFlowNode.is(node), `node is not a XYFlowNode`)
          trigger.onNodeClick(node, event)
        }
      })}
      {...(editor.hasOnEdgeClick && {
        onEdgeClick: (event, edge) => {
          invariant(XYFlowEdge.isRelationship(edge), `edge is not a relationship`)
          trigger.onEdgeClick(edge, event)
        }
      })}
      {...(editor.hasOnNodeContextMenu && {
        onEdgeContextMenu: (event, edge) => {
          event.preventDefault()
          event.stopPropagation()
        },
        onNodeContextMenu: (event, node) => {
          invariant(XYFlowNode.is(node), `node is not a XYFlowNode`)
          trigger.onNodeContextMenu(node, event)
        },
        onPaneContextMenu: (event) => {
          event.preventDefault()
          event.stopPropagation()
        }
      })}
      onInit={(instance) => {
        instanceRef.current = instance as XYFlowInstance
        invariant(instance.viewportInitialized, `viewportInitialized is not true`)
        trigger.onInitialized(instance as any)
      }}
      onPaneClick={(e) => {
        // Workaround for dbl click
        const ts = e.timeStamp
        if (lastClickTimeRef.current > 0) {
          const diff = ts - lastClickTimeRef.current
          if (diff < 300) {
            instanceRef.current?.fitView({
              duration: 350,
              maxZoom: 1,
              padding: editor.fitViewPadding
            })
            lastClickTimeRef.current = 0
            trigger.onCanvasDblClick(e)
            return
          }
        }
        lastClickTimeRef.current = ts
      }}
      {...(!editor.pannable && { [`data-likec4-view-nopan`]: '' })}
      {...(editor.disableBackground && { [`data-likec4-view-nobg`]: '' })}
    >
      {!editor.disableBackground && <Background />}
      {editor.controls && <Controls />}
    </ReactFlow>
  )
}, (prev, next) => true /* always skip render */)
LikeC4XYFlow.displayName = 'LikeC4ViewXYFlow'
