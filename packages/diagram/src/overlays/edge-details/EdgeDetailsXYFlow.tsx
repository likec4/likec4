import { type DiagramEdge, type EdgeId, isAncestor } from '@likec4/core'
import { Box, Group } from '@mantine/core'
import { useDebouncedCallback, useDebouncedEffect, useSyncedRef, useUpdateEffect } from '@react-hookz/web'
import {
  getViewportForBounds,
  Panel,
  ReactFlow,
  type ReactFlowInstance,
  useReactFlow,
  useStoreApi,
  ViewportPortal
} from '@xyflow/react'
import { memo, useEffect } from 'react'
import { useDiagramStoreApi } from '../../hooks/useDiagramState'
import { useOverlayDialog } from '../OverlayContext'
import type { XYFlowTypes } from './_types'
import { SelectEdge } from './SelectEdge'
import { useLayoutedEdgeDetails, ZIndexes } from './use-layouted-edge-details'
import { CompoundNode } from './xyflow/CompoundNode'
import { ElementNode } from './xyflow/ElementNode'
import { RelationshipEdge } from './xyflow/RelationshipEdge'

const nodeTypes = {
  element: ElementNode,
  compound: CompoundNode
}
const edgeTypes = {
  relation: RelationshipEdge
}

const resetDimmedAndHovered = (xyflow: ReactFlowInstance<XYFlowTypes.Node, XYFlowTypes.Edge>) => {
  xyflow.setEdges(edges =>
    edges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        dimmed: false,
        hovered: false
      },
      animated: false
    }))
  )
  xyflow.setNodes(nodes =>
    nodes.map(n =>
      ({
        ...n,
        data: {
          ...n.data,
          dimmed: false,
          hovered: false
        }
      }) as XYFlowTypes.Node
    )
  )
}

const animateEdge = (node: XYFlowTypes.Node, animated = true) => (edges: XYFlowTypes.Edge[]) => {
  return edges.map(edge => {
    const isConnected = edge.source === node.id || edge.target === node.id || isAncestor(node.id, edge.source)
      || isAncestor(node.id, edge.target)
    return {
      ...edge,
      animated: animated && isConnected
    }
  })
}

export const EdgeDetailsXYFlow = memo<{ edgeId: EdgeId }>(function EdgeDetailsXYFlow({ edgeId }) {
  const diagramStore = useDiagramStoreApi()

  const {
    view,
    edge,
    edges,
    nodes,
    bounds
  } = useLayoutedEdgeDetails(edgeId)

  const boundsRef = useSyncedRef(bounds)

  const xyflow = useReactFlow<XYFlowTypes.Node, XYFlowTypes.Edge>()
  const xystore = useStoreApi<XYFlowTypes.Node, XYFlowTypes.Edge>()

  const fitview = useDebouncedCallback(
    () => {
      const {
        width,
        height
      } = xystore.getState()
      const viewport = getViewportForBounds(
        {
          ...boundsRef.current,
          height: Math.max(boundsRef.current.height + 100, height - 200) // Add some padding to the bottom
        },
        width,
        height,
        0.2,
        1,
        0.2
      )
      xyflow.setViewport(viewport, { duration: 350 })
    },
    [xyflow],
    150
  )

  useEffect(() => {
    xyflow.setNodes(nodes)
    xyflow.setEdges(edges)
  }, [nodes, edges])

  const zoomable = true

  useUpdateEffect(() => fitview(), [edge.id])

  return (
    <ReactFlow
      defaultEdges={[] as XYFlowTypes.Edge[]}
      defaultNodes={[] as XYFlowTypes.Node[]}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultMarkerColor="var(--xy-edge-stroke)"
      zoomOnPinch={zoomable}
      zoomOnScroll={false}
      zoomOnDoubleClick={false}
      maxZoom={1.5}
      minZoom={0.1}
      fitView
      fitViewOptions={{
        padding: 0.2,
        maxZoom: 1,
        minZoom: 0.1,
        includeHiddenNodes: true
      }}
      preventScrolling={true}
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll
      panOnDrag
      elementsSelectable
      nodesFocusable={false}
      edgesFocusable={false}
      nodesDraggable={false}
      // onNodeMouseEnter={(_, node) => {
      //   if (node.type === 'empty') return
      //   xyflow.setEdges(animateEdge(node, true))
      // }}
      // onNodeMouseLeave={() => {
      //   resetDimmedAndHovered(xyflow)
      // }}
      onEdgeMouseEnter={(_, edge) => {
        xyflow.setEdges(edges =>
          edges.map(e => ({
            ...e,
            data: {
              ...e.data,
              dimmed: e.id !== edge.id,
              hovered: e.id === edge.id
            },
            zIndex: e.id === edge.id ? ZIndexes.max : ZIndexes.edge,
            animated: e.id === edge.id
          }))
        )
        xyflow.setNodes(nodes =>
          nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              dimmed: n.id !== edge.source && n.id !== edge.target
            }
          } as XYFlowTypes.Node))
        )
      }}
      onEdgeMouseLeave={() => {
        resetDimmedAndHovered(xyflow)
      }}
      // onNodeClick={(e, node) => {
      //   e.stopPropagation()
      //   if (node.type === 'empty') return
      //   if (subject.id !== node.data.fqn) {
      //     lastClickedNodeRef.current = node
      //   }
      //   overlay.openOverlay({
      //     relationshipsOf: node.data.fqn
      //   })
      // }}
      // onDoubleClick={e => {
      //   e.stopPropagation()
      //   xyflow.fitView({
      //     includeHiddenNodes: true,
      //     maxZoom: 1,
      //     duration: 450
      //   })
      // }}
      onEdgeClick={(e, edge) => {
        e.stopPropagation()
        diagramStore.getState().onOpenSourceRelation?.(edge.data.relation.id)
      }}
      // onEdgeClick={(e, edge) => {
      //   e.stopPropagation()
      //   if (edge.data.relations.length <= 1) {
      //     const relationId = only(edge.data.relations)?.id
      //     if (relationId) {
      //       diagramStore.getState().onOpenSourceRelation?.(relationId)
      //     }
      //     return
      //   }
      //   const nodeId = onlyOneUnique(edge.data, 'source') ? edge.source : edge.target
      //   const next = xyflow.getNode(nodeId)
      //   if (next && next.type !== 'empty') {
      //     lastClickedNodeRef.current = next
      //     overlay.openOverlay({
      //       relationshipsOf: next.data.fqn
      //     })
      //   }
      // }}
    >
      <Panel position="top-center">
        <Group gap={'xs'} wrap={'nowrap'}>
          <SelectEdge
            view={view}
            edge={edge} />
        </Group>
      </Panel>
      <EdgeData edge={edge} top={bounds.height} width={bounds.width} />
    </ReactFlow>
  )
})

const EdgeData = ({ edge, top, width }: { edge: DiagramEdge; top: number; width: number }) => {
  return (
    <ViewportPortal>
      <Box
        maw={width}
        style={{
          transform: `translate(100px, ${top + 32}px)`
        }}>
        {edge.id}
      </Box>
    </ViewportPortal>
  )
}
