import { nonexhaustive, type OverviewGraph } from '@likec4/core'
import { useUpdateEffect } from '@likec4/diagram'
import { useMantineColorScheme } from '@mantine/core'
import { useRouter } from '@tanstack/react-router'
import { Background, BackgroundVariant, ReactFlow, type Rect, useEdgesState, useNodesState } from '@xyflow/react'
import { useMemo, useRef } from 'react'
import { pick } from 'remeda'
import { root } from './OverviewDiagrams.css'
import { LinkEdge } from './xyflow/Edges'
import { FileNode, FolderNode } from './xyflow/Nodes'
import type {
  FileXYNode,
  FolderXYNode,
  OverviewXYEdge,
  OverviewXYFlowData,
  OverviewXYFlowInstance,
  OverviewXYNode
} from './xyflow/types'
import { ViewNode } from './xyflow/ViewNode'

type OverviewDiagramsProps = {
  graph: OverviewGraph
  zoomable?: boolean | undefined
  pannable?: boolean | undefined
  fitViewPadding?: number | undefined
}

const nodeTypes = {
  folder: FolderNode,
  file: FileNode,
  view: ViewNode
}
const edgeTypes = {
  link: LinkEdge
}

const overviewGraphToXYFlowData = (graph: OverviewGraph): OverviewXYFlowData => {
  return {
    nodes: graph.nodes.map(({ id, parentId, position, width, height, ...node }) => {
      const parent = parentId ? graph.nodes.find(n => n.id === parentId) : null
      // rect is absolute positioned
      const rect = {
        ...position,
        width,
        height
      } satisfies Rect
      if (parent) {
        position = {
          x: position.x - parent.position.x,
          y: position.y - parent.position.y
        }
      }
      const xyparent = parent ? { parentId: parent.id } : {}

      switch (node.type) {
        case 'file':
        case 'folder':
          return {
            id,
            type: node.type,
            data: {
              dimmed: false,
              label: node.label,
              path: node.path,
              rect
            },
            deletable: false,
            position,
            width,
            height,
            zIndex: 1,
            ...xyparent
          } satisfies FolderXYNode | FileXYNode
        case 'view':
          return {
            id,
            type: 'view',
            data: {
              dimmed: false,
              label: node.label,
              viewId: node.viewId as any,
              rect
            },
            selectable: false,
            deletable: false,
            position,
            width,
            height,
            zIndex: 3,
            ...xyparent
          }
        default:
          nonexhaustive(node)
      }
    }),
    edges: graph.edges.map(edge => {
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'link' as const,
        zIndex: 2,
        hidden: true,
        data: {
          points: edge.points
        }
      }
    })
  }
}

export function OverviewDiagrams({
  graph,
  fitViewPadding = 0.1,
  zoomable = true,
  pannable = true
}: OverviewDiagramsProps) {
  const router = useRouter()
  const xyflowRef = useRef<OverviewXYFlowInstance>()
  // const [focusedNodeId, setFocusedNode] = useState<string | null>(null)
  const { colorScheme } = useMantineColorScheme()

  const xyflowdata = useMemo(() => overviewGraphToXYFlowData(graph), [graph])

  const [nodes, setNodes, onNodesChange] = useNodesState(xyflowdata.nodes)
  const [edges, setEdges, onEdgeChanges] = useEdgesState(xyflowdata.edges)

  useUpdateEffect(() => {
    // @ts-ignore
    setNodes(nodes =>
      xyflowdata.nodes.map(n => {
        const current = nodes.find(node => node.id === n.id)
        return current ? { ...pick(current, ['selected', 'hidden']), ...n } : n
      })
    )
    setEdges(xyflowdata.edges)
  }, [xyflowdata.nodes, xyflowdata.edges])

  const focusedNode = nodes.find(node => node.selected)

  useUpdateEffect(() => {
    const xyflow = xyflowRef.current
    if (!xyflow) {
      return
    }
    // const node = focusedNodeId ? nodes.find(node => node.id === focusedNodeId) : null
    if (!focusedNode) {
      xyflow.fitView({
        maxZoom: 1,
        padding: fitViewPadding,
        duration: 800
      })
    } else {
      // const viewport = getViewportForBounds(node.data.rect, )
      xyflow.fitView({
        maxZoom: 1,
        padding: fitViewPadding,
        nodes: [focusedNode],
        duration: 450
      })
      // xyflow.fitBounds(node.data.rect, {
      //   duration: 400
      // })
      // xyflowRef.current.fitView({
      //   position: {
      //     x: node.position.x + node.width / 2,
      //     y: node.position.y + node.height / 2
      //   },
      //   zoom: 1,
      //   duration: 450
      // })
    }
  }, [focusedNode?.id ?? null])

  return (
    <ReactFlow<OverviewXYNode, OverviewXYEdge>
      colorMode={colorScheme === 'auto' ? 'system' : colorScheme}
      className={root}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodes={nodes}
      onNodesChange={onNodesChange}
      edges={edges}
      onEdgesChange={onEdgeChanges}
      fitView
      fitViewOptions={useMemo(() => ({
        minZoom: 0.05,
        maxZoom: 1,
        padding: fitViewPadding,
        includeHiddenNodes: true
      }), [fitViewPadding])}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={true}
      edgesReconnectable={false}
      edgesFocusable={false}
      multiSelectionKeyCode={null}
      zoomOnPinch={zoomable}
      zoomOnScroll={!pannable && zoomable}
      zoomOnDoubleClick={false}
      {...(!zoomable && {
        zoomActivationKeyCode: null
      })}
      maxZoom={zoomable ? 2 : 1}
      minZoom={zoomable ? 0.01 : 1}
      preventScrolling={zoomable || pannable}
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll={pannable}
      panOnDrag={pannable}
      {...(!pannable && {
        selectionKeyCode: null
      })}
      onInit={instance => xyflowRef.current = instance}
      onNodeClick={(event, node) => {
        if (node.type === 'view') {
          event.stopPropagation()
          // @ts-ignore
          setNodes(nodes => nodes.map(({ data, ...n }) => ({ ...n, data: { ...data, dimmed: n.id !== node.id } })))
          xyflowRef.current?.fitView({
            maxZoom: 10,
            padding: 0,
            nodes: [node],
            duration: 1200
          })
          setTimeout(() => {
            xyflowRef.current?.updateNodeData(node.id, { dimmed: true })
          }, 400)
          setTimeout(() => {
            router.navigate({
              to: '/view/$viewId/',
              params: {
                viewId: node.data.viewId
              },
              search: true
            })
          }, 800)
          return
        }
        if (node.selected) {
          event.stopPropagation()
          setNodes(nodes => nodes.map(n => n.id === node.id ? { ...n, selected: false } : n))
        }
      }}
    >
      <Background variant={BackgroundVariant.Dots} size={4} gap={50} />
    </ReactFlow>
  )
}
