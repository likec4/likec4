import { type DiagramEdge, type EdgeId, isAncestor } from '@likec4/core'
import { Box, Group, Text } from '@mantine/core'
import { useDebouncedCallback, useSyncedRef, useUpdateEffect } from '@react-hookz/web'
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
import { only } from 'remeda'
import { useDiagramStoreApi } from '../../hooks/useDiagramState'
import type { SharedFlowTypes } from '../shared/xyflow/_types'
import type { EdgeDetailsFlowTypes } from './_types'
import { SelectEdge } from './SelectEdge'
import * as css from './SelectEdge.css'
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

const resetDimmedAndHovered = (xyflow: ReactFlowInstance<SharedFlowTypes.Node, EdgeDetailsFlowTypes.Edge>) => {
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
      }) as SharedFlowTypes.Node
    )
  )
}

const animateEdge = (node: SharedFlowTypes.Node, animated = true) => (edges: EdgeDetailsFlowTypes.Edge[]) => {
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

  const xyflow = useReactFlow<SharedFlowTypes.Node, EdgeDetailsFlowTypes.Edge>()
  const xystore = useStoreApi<SharedFlowTypes.Node, EdgeDetailsFlowTypes.Edge>()

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
      defaultEdges={[] as EdgeDetailsFlowTypes.Edge[]}
      defaultNodes={[] as SharedFlowTypes.Node[]}
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
          } as SharedFlowTypes.Node))
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
        // edge-details only ever deals with edges that represent only one relation
        let relationId = only(edge.data.relations)?.id
        if (relationId) {
          diagramStore.getState().onOpenSource?.({
            relation: relationId
          })
        }
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
        <Box className={css.edgeDataGrid}>
          <Text size="xs" fw={500} c="dimmed">technology</Text>
          <Text>{edge.technology || 'unknown'}</Text>
          <Text size="xs" fw={500} c="dimmed">description</Text>
          <Text>{edge.description || 'no description'}</Text>
        </Box>
      </Box>
    </ViewportPortal>
  )
}
