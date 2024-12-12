import { delay, type DiagramView, type Fqn, isAncestor, type Relation } from '@likec4/core'
import { useId } from '@mantine/hooks'
import { useDebouncedCallback, useDeepCompareEffect, useSyncedRef } from '@react-hookz/web'
import {
  getViewportForBounds,
  ReactFlow,
  type ReactFlowInstance,
  type ReactFlowProps,
  ReactFlowProvider,
  type ReactFlowState,
  useOnViewportChange,
  useReactFlow,
  useStore,
  useStoreApi
} from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { type PropsWithChildren, useRef, useState } from 'react'
import { isNullish, map, omit, only, prop, setPath, unique } from 'remeda'
import { useUpdateEffect } from '../../hooks'
import { centerXYInternalNode } from '../../xyflow/utils'
import { cssReactflowMarker } from '../Overlays.css'
import { type RelationshipsOfTypes } from './_types'
import { ZIndexes } from './use-layouted-relationships'
import { CompoundNode } from '../shared/xyflow/CompoundNode'
import { ElementNode } from './xyflow/ElementNode'
import { EmptyNode } from './xyflow/EmptyNode'
import { RelationshipEdge } from './xyflow/RelationshipEdge'
import { type BaseTypes } from '../shared/_types'

const nodeTypes = {
  element: ElementNode,
  compound: CompoundNode,
  empty: EmptyNode
}
const edgeTypes = {
  relation: RelationshipEdge
}

/**
 * Root node in 'subjects' column
 */
const findRootSubject = (nodes: RelationshipsOfTypes.Node[]) =>
  nodes.find((n): n is RelationshipsOfTypes.ElementNode => n.data.column === 'subjects' && isNullish(n.parentId))

const resetDimmedAndHovered = (xyflow: ReactFlowInstance<RelationshipsOfTypes.Node, BaseTypes.Edge>) => {
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
      }) as RelationshipsOfTypes.Node
    )
  )
}

const animateEdge = (node: RelationshipsOfTypes.Node, animated = true) => (edges: BaseTypes.Edge[]) => {
  return edges.map(edge => {
    const isConnected = edge.source === node.id || edge.target === node.id || isAncestor(node.id, edge.source)
      || isAncestor(node.id, edge.target)
    return {
      ...edge,
      animated: animated && isConnected
    }
  })
}

const onlyOneUnique = <T extends keyof Relation>(
  data: BaseTypes.Edge['data'],
  property: T
): Relation[T] | undefined => {
  return only(unique(map(data.relations, prop(property))))
}

type RelationshipsXYFlowProps =
  & PropsWithChildren<{
    subjectId: Fqn
    view: DiagramView
    nodes: RelationshipsOfTypes.Node[]
    edges: BaseTypes.Edge[]
    bounds: {
      x: number
      y: number
      width: number
      height: number
    }
    viewportPadding?: number | undefined
  }>
  & Pick<
    ReactFlowProps<RelationshipsOfTypes.Node, BaseTypes.Edge>,
    | 'onNodeClick'
    | 'elementsSelectable'
    | 'maxZoom'
    | 'minZoom'
  >
const selectContainerViewport = (s: ReactFlowState) => `${s.width}x${s.height}`

function RelationshipsXYFlowWrapped({
  subjectId,
  view,
  nodes,
  edges,
  bounds,
  children,
  maxZoom = 2,
  minZoom = 0.05,
  viewportPadding = 0.1,
  ...rest
}: RelationshipsXYFlowProps) {
  const id = useId()

  const lastClickedNodeRef = useRef<RelationshipsOfTypes.NonEmptyNode | null>(null)

  const xyflow = useReactFlow<RelationshipsOfTypes.Node, BaseTypes.Edge>()
  const xystore = useStoreApi<RelationshipsOfTypes.Node, BaseTypes.Edge>()

  const [zoomOnDoubleClick, setZoomOnDoubleClick] = useState(true)

  const containerviewport = useStore(selectContainerViewport)

  /**
   * WORKAROUND - Called on viewport change
   * Viewport transform is not rounded to integers which results in blurry nodes on some resolution
   * https://github.com/xyflow/xyflow/issues/3282
   * https://github.com/likec4/likec4/issues/734
   */
  useOnViewportChange({
    onEnd: ({ x, y, zoom }) => {
      const roundedX = Math.round(x),
        roundedY = Math.round(y)
      if (x !== roundedX || y !== roundedY) {
        xystore.setState({ transform: [roundedX, roundedY, zoom] })
      }
      setZoomOnDoubleClick(zoom < 0.7)
    }
  })

  const initialFitviewFlagRef = useRef(false)
  const viewBoundsRef = useSyncedRef(bounds)

  const fitview = useDebouncedCallback(
    () => {
      const { width, height } = xystore.getState()
      xyflow.setViewport(
        getViewportForBounds(viewBoundsRef.current, width, height, minZoom, maxZoom, viewportPadding),
        initialFitviewFlagRef.current ? { duration: 500 } : undefined
      )
      initialFitviewFlagRef.current = true
    },
    [xyflow, minZoom, maxZoom, viewportPadding],
    100
  )

  useUpdateEffect(() => {
    fitview()
  }, [containerviewport])

  useDeepCompareEffect(() => {
    const {
      nodes: _nodes,
      edges: _edges,
      setNodes,
      setEdges,
      width,
      height
    } = xystore.getState()

    const nextSubjectNode = findRootSubject(nodes)
    const currentSubjectNode = findRootSubject(_nodes)

    // If subject node is the same, don't animate
    if (currentSubjectNode && nextSubjectNode?.data.fqn === currentSubjectNode.data.fqn) {
      setNodes(map(nodes, setPath(['data', 'entering'], false)))
      setEdges(edges)
      fitview()
      return
    }

    if (!nextSubjectNode) {
      console.error('Subject node not found')
    } else if (nextSubjectNode.data.fqn !== subjectId) {
      console.error(`Subject node mismatch, expected: ${subjectId} got: ${nextSubjectNode.data.fqn}`)
    }

    const nextzoom = getViewportForBounds(bounds, width, height, minZoom, maxZoom, viewportPadding).zoom

    const nextSubjectCenter = nextSubjectNode && {
      x: nextSubjectNode.position.x + (nextSubjectNode.width ?? 0) / 2,
      y: nextSubjectNode.position.y + (nextSubjectNode.height ?? 0) / 2
    }

    const existingNode = lastClickedNodeRef.current
      ?? xyflow.getNodes().find(n => n.type !== 'empty' && n.data.column !== 'subjects' && n.data.fqn === subjectId)
    lastClickedNodeRef.current = null
    // Animate from existing node to next subject node
    if (nextSubjectCenter && existingNode && currentSubjectNode) {
      // Center of current subject
      const currentSubjectInternalNode = xyflow.getInternalNode(currentSubjectNode.id)!
      const currentSubjectCenter = centerXYInternalNode(currentSubjectInternalNode)

      // Move to center of existing node
      const existingInternalNode = xyflow.getInternalNode(existingNode.id)!
      const existingDimensions = getNodeDimensions(existingInternalNode)
      nextSubjectNode.data.layoutId = existingNode.id

      // Dim all nodes except the existing node
      setNodes(_nodes.map(n => {
        if (n.id !== existingNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              leaving: n.data.column === 'subjects',
              dimmed: n.data.column === 'subjects' ? 'immediate' : false
            }
            // hidden: n.data.column === 'subjects'
          } as RelationshipsOfTypes.Node
        }
        // Move existing node
        return {
          ...omit(n, ['parentId']),
          position: {
            x: currentSubjectCenter.x - existingDimensions.width / 2,
            y: currentSubjectCenter.y - existingDimensions.height / 2
          },
          zIndex: ZIndexes.max,
          data: {
            ...n.data,
            leaving: false,
            dimmed: false
          }
        } as RelationshipsOfTypes.Node
      }))
      setEdges(_edges.map(e => ({
        ...e,
        data: {
          ...e.data,
          dimmed: 'immediate' as const
        },
        hidden: e.source === existingNode.id
          || e.target === existingNode.id
          || isAncestor(existingNode.id, e.source)
          || isAncestor(existingNode.id, e.target)
      })))

      // Pick the smaller zoom level
      const zoom = Math.min(
        xyflow.getViewport().zoom,
        nextzoom
      )

      let isCancelled = false

      const layout = async () => {
        // allow frameer to render
        await delay(150)
        if (isCancelled) return
        await xyflow.setCenter(currentSubjectCenter.x, currentSubjectCenter.y, { zoom, duration: 250 })
        requestAnimationFrame(() => {
          if (isCancelled) return
          xyflow.setCenter(nextSubjectCenter.x, nextSubjectCenter.y, { zoom })
          setNodes(nodes)
          setEdges(edges)
          fitview()
        })
      }
      requestAnimationFrame(layout)
      return () => {
        isCancelled = true
      }
    }
    setNodes(map(nodes, setPath(['data', 'entering'], false)))
    setEdges(edges)
    fitview()
    return undefined
  }, [nodes, edges, subjectId])

  return (
    <ReactFlow
      id={id}
      defaultEdges={[] as BaseTypes.Edge[]}
      defaultNodes={[] as RelationshipsOfTypes.Node[]}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultMarkerColor="var(--likec4-relation-lineColor)"
      className={cssReactflowMarker}
      zoomOnPinch={true}
      zoomOnScroll={false}
      zoomOnDoubleClick={zoomOnDoubleClick}
      maxZoom={maxZoom}
      minZoom={minZoom}
      fitView
      fitViewOptions={{
        padding: viewportPadding,
        maxZoom,
        minZoom,
        includeHiddenNodes: true
      }}
      preventScrolling={true}
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll
      panOnDrag
      nodesFocusable={false}
      edgesFocusable={false}
      nodesDraggable={false}
      onNodeMouseEnter={(_, node) => {
        if (node.type === 'empty') return
        xyflow.setEdges(animateEdge(node, true))
      }}
      onNodeMouseLeave={() => {
        resetDimmedAndHovered(xyflow)
      }}
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
          } as RelationshipsOfTypes.Node))
        )
      }}
      onEdgeMouseLeave={() => {
        resetDimmedAndHovered(xyflow)
      }}
      onNodeDoubleClick={(e) => {
        e.stopPropagation()
      }}
      {...!zoomOnDoubleClick && {
        onDoubleClick: e => {
          e.stopPropagation()
          fitview()
        }
      }}
      {...rest}
    >
      {/* <Background variant={BackgroundVariant.Dots} size={2} gap={20} /> */}
      {children}
    </ReactFlow>
  )
}

export function RelationshipsXYFlow(props: RelationshipsXYFlowProps) {
  return (
    <ReactFlowProvider
      defaultNodes={[]}
      defaultEdges={[]}>
      <RelationshipsXYFlowWrapped {...props} />
    </ReactFlowProvider>
  )
}
