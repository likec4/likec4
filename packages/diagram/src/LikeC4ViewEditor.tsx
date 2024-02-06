import { type DiagramView } from '@likec4/core'
import { MantineProvider } from '@mantine/core'
import {
  Background,
  Controls,
  type Edge,
  type Node as ReactFlowNode,
  ReactFlow,
  type ReactFlowInstance,
  ReactFlowProvider,
  useStoreApi
} from '@xyflow/react'
import { memo, type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef } from 'react'
import useTilg from 'tilg'
import { edgeTypes } from './edges'
import { fromDiagramView } from './fromDiagramView'
import { nodeTypes } from './nodes'

import { useUpdateEffect } from '@react-hookz/web'
import { mergeDeep, pick } from 'remeda'
import { JotaiProvider } from './jotai'
import type { LikeC4ViewEditorApiProps } from './LikeC4ViewEditorApi'
import { LikeC4ViewEditorProvider, useLikeC4EditorUpdate } from './LikeC4ViewEditorApi'
import { useSetHoveredEdgeId } from './state'
import './theme-colors.css'
import type { EditorEdge, EditorNode } from './types'
import Camera from './ui/Camera'

type LikeC4ViewEditorProps = LikeC4ViewEditorApiProps & {
  view: DiagramView
}

export function LikeC4ViewEditor({
  view,
  ...apiProps
}: LikeC4ViewEditorProps) {
  useTilg()`view = ${view.id}`
  const initial = useMemo(() => fromDiagramView(view), [])
  // const viewId = view.id
  return (
    <MantineProvider>
      <JotaiProvider>
        <ReactFlowProvider>
          <LikeC4ViewEditorProvider
            view={view}
            {...apiProps}
          >
            <LikeC4ViewReactFlow
              initialNodes={initial.nodes}
              initialEdges={initial.edges}
            />
            <DiagramViewSync view={view} />
            <Camera viewId={view.id} />
          </LikeC4ViewEditorProvider>
        </ReactFlowProvider>
      </JotaiProvider>
    </MantineProvider>
  )
}

type LikeC4ViewReactFlowProps = {
  initialNodes: EditorNode[]
  initialEdges: EditorEdge[]
}
const LikeC4ViewReactFlow = memo<LikeC4ViewReactFlowProps>(({
  initialNodes,
  initialEdges
}) => {
  useTilg()
  // const initial = useMemo(() => fromDiagramView(view), [])
  // const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  // const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const instanceRef = useRef<ReactFlowInstance>()
  const setHoveredEdgeId = useSetHoveredEdgeId()

  const update = useLikeC4EditorUpdate()

  // Workaround for dbl click
  const lastClickTimeRef = useRef<number>(0)

  // useUpdateEffect(() => {
  //   const { nodes, edges } = fromDiagramView(view)
  //   setNodes(nodes)
  //   setEdges(edges)
  // }, [view])

  return (
    <ReactFlow
      defaultNodes={initialNodes}
      defaultEdges={initialEdges}
      // nodes={nodes}
      // edges={edges}
      // onNodesChange={onNodesChange}
      // onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      maxZoom={1.9}
      minZoom={0.1}
      fitView
      panOnScroll
      elementsSelectable
      zoomOnDoubleClick={false}
      elevateNodesOnSelect={false} // or edges are not visible after select
      selectNodesOnDrag={false} // or camera does not work
      nodeDragThreshold={2}
      fitViewOptions={{
        maxZoom: 1.05,
        padding: 0.1
      }}
      // onInit={instance => {
      //   instanceRef.current = instance
      // }}
      onEdgeMouseEnter={useCallback((_ev: ReactMouseEvent, edge: Edge) => {
        // update({
        //   hoveredEdgeId: edge.id
        // })
        setHoveredEdgeId(edge.id)
      }, [])}
      onEdgeMouseLeave={useCallback((_ev: ReactMouseEvent, _edge: Edge) => {
        // update({
        //   hoveredEdgeId: null
        // })
        setHoveredEdgeId(null)
      }, [])}
      onPaneClick={useCallback((e: ReactMouseEvent) => {
        const ts = e.timeStamp
        if (lastClickTimeRef.current > 0) {
          const diff = ts - lastClickTimeRef.current
          if (diff < 250) {
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
    >
      <Background />
      <Controls />
    </ReactFlow>
  )
}, (prev, next) => true)

// export function LikeC4ViewEditor({
//   children,
//   ...props
// }: PropsWithChildren<LikeC4ViewEditorApiProps>) {
//   useTilg()
//   return (
//     <ReactFlowProvider>
//       <Provider {...props}>
//         {children}
//       </Provider>
//     </ReactFlowProvider>
//   )
// }

// export { useLikeC4ViewEditor }

const DiagramViewSync = memo<{ view: DiagramView }>(({ view }) => {
  useTilg()
  const store = useStoreApi()
  const setHoveredEdgeId = useSetHoveredEdgeId()

  useEffect(() => {
    return () => {
      store.getState().resetSelectedElements()
      setHoveredEdgeId(null)
    }
  }, [view.id])

  useUpdateEffect(() => {
    const update = fromDiagramView(view)
    const { setNodes, nodeLookup, setEdges, edgeLookup } = store.getState()

    setNodes(update.nodes.map(node => {
      const existing = nodeLookup.get(node.id)
      if (
        existing
        && existing.type === node.type
        && ((!existing.parentNode && !node.parentNode) || existing.parentNode === node.parentNode)
      ) {
        const override = pick(node, ['data', 'position', 'style', 'zIndex'])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Object.assign(existing, mergeDeep(existing as any, override as any) as ReactFlowNode)
      }
      return node
    }))

    setEdges(update.edges.map(edge => {
      const existing = edgeLookup.get(edge.id)
      if (
        existing
        && existing.type === edge.type
        && existing.source === edge.source
        && existing.target === edge.target
      ) {
        return Object.assign(existing, pick(edge, ['data']))
      }
      return edge
    }))

    // reactflow.setNodes(nodes)
    // reactflow.setEdges(edges)
    // reactflow.
  }, [view])
  return null
})
