import { isAncestor, type Relation } from '@likec4/core'
import { Box, Button, Group, SegmentedControl, Space, Text } from '@mantine/core'
import { useLocalStorage, useStateHistory } from '@mantine/hooks'
import { useDebouncedCallback, useDebouncedEffect } from '@react-hookz/web'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import {
  getViewportForBounds,
  Panel,
  ReactFlow,
  type ReactFlowInstance,
  useReactFlow,
  useStoreApi
} from '@xyflow/react'
import { fitView, getNodeDimensions } from '@xyflow/system'
import { memo, useEffect, useRef } from 'react'
import { map, only, prop, unique } from 'remeda'
import { useOverlayDialog } from '../../components'
import { useDiagramStoreApi } from '../../hooks/useDiagramState'
import { dimmed } from '../../xyflow/edges/edges.css'
import { getNodeCenter } from '../../xyflow/edges/utils'
import type { XYFlowTypes } from './_types'
import { SelectElement } from './SelectElement'
import * as css from './styles.css'
import { useLayoutedRelationships, ZIndexes } from './use-layouted-relationships'
import { CompoundNode } from './xyflow/CompoundNode'
import { ElementNode } from './xyflow/ElementNode'
import { EmptyNode } from './xyflow/EmptyNode'
import { RelationshipEdge } from './xyflow/RelationshipEdge'

const nodeTypes = {
  element: ElementNode,
  compound: CompoundNode,
  empty: EmptyNode
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

const onlyOneUnique = <T extends keyof Relation>(
  data: XYFlowTypes.Edge['data'],
  property: T
): Relation[T] | undefined => {
  return only(unique(map(data.relations, prop(property))))
}

export const RelationshipsXYFlow = memo(function RelationshipsXYFlow() {
  const diagramStore = useDiagramStoreApi()
  const lastClickedNodeRef = useRef<XYFlowTypes.NonEmptyNode | null>(null)
  const [_scope, setScope] = useLocalStorage<'global' | 'view'>({
    key: 'likec4:scope-relationships-of',
    getInitialValueInEffect: false,
    defaultValue: 'view'
  })
  const {
    view,
    viewIncludesSubject,
    edges,
    nodes,
    subject,
    bounds
  } = useLayoutedRelationships(_scope)
  const scope = viewIncludesSubject ? _scope : 'global'
  const showSubjectWarning = !viewIncludesSubject && _scope === 'view'

  const [historySubjectId, historyOps, { history, current }] = useStateHistory(subject.id)

  const xyflow = useReactFlow<XYFlowTypes.Node, XYFlowTypes.Edge>()
  const xystore = useStoreApi()
  const overlay = useOverlayDialog()

  useEffect(() => {
    if (historySubjectId !== subject.id) {
      historyOps.set(subject.id)
    }
  }, [subject.id])

  useEffect(() => {
    if (historySubjectId !== subject.id) {
      overlay.openOverlay({
        relationshipsOf: historySubjectId
      })
    }
  }, [historySubjectId])

  const fitview = useDebouncedCallback(
    () => {
      xyflow.fitView({
        padding: 0.2,
        includeHiddenNodes: true,
        maxZoom: 1,
        duration: 500
      })
    },
    [xyflow],
    150
  )

  useEffect(() => {
    const nextSubjectNode = nodes.find((n): n is XYFlowTypes.NonEmptyNode =>
      n.type !== 'empty' && n.data.column === 'subject'
    )
    if (!nextSubjectNode) {
      console.error('Subject node not found')
    } else if (nextSubjectNode.data.fqn !== subject.id) {
      console.error(`Subject node mismatch, expected: ${subject.id} got: ${nextSubjectNode.data.fqn}`)
    }

    const {
      nodes: _nodes,
      edges: _edges,
      setNodes,
      setEdges,
      width,
      height
    } = xystore.getState()

    const nextviewport = getViewportForBounds(bounds, width, height, 0.2, 1, 0.2)

    const nextSubjectCenter = nextSubjectNode && {
      x: nextSubjectNode.position.x + (nextSubjectNode.width ?? 0) / 2,
      y: nextSubjectNode.position.y + (nextSubjectNode.height ?? 0) / 2
    }

    const existingNode = lastClickedNodeRef.current
      ?? xyflow.getNodes().find(n => n.type !== 'empty' && n.data.column !== 'subject' && n.data.fqn === subject.id)
    lastClickedNodeRef.current = null
    // Animate from existing node to next subject node
    if (nextSubjectCenter && existingNode) {
      // Dim all nodes except the existing node
      setNodes(_nodes.map(n => {
        return {
          ...n,
          data: {
            ...n.data,
            dimmed: n.id !== existingNode.id ? 'immediate' : false
          }
        }
      }))
      setEdges(_edges.map(e => ({
        ...e,
        data: {
          ...e.data,
          dimmed: true
        }
      })))

      // Move to center of existing node
      const existingInternalNode = xyflow.getInternalNode(existingNode.id)!
      const existingDimensions = getNodeDimensions(existingInternalNode)
      const existingCenter = {
        x: existingInternalNode.internals.positionAbsolute.x + existingDimensions.width / 2,
        y: existingInternalNode.internals.positionAbsolute.y + existingDimensions.height / 2
      }

      // Pick the smaller zoom level
      const zoom = Math.min(
        nextviewport.zoom,
        nextSubjectNode.width! / existingDimensions.width,
        nextSubjectNode.height! / existingDimensions.height
      )

      let isCancelled = false

      xyflow.setCenter(
        existingCenter.x,
        existingCenter.y,
        {
          zoom,
          // we zoomed to match the subject node (might be smaller than the existing node)
          // so make it faster
          duration: zoom < nextviewport.zoom ? 250 : 350
        }
      ).then(() => {
        // If the component is unmounted, we don't want to update the state
        if (isCancelled) return
        setNodes(nodes)
        setEdges(edges)
        xyflow.setCenter(nextSubjectCenter.x, nextSubjectCenter.y, {
          // so we need to zoom out to the smaller of the two
          zoom: nextviewport.zoom
        })
        fitview()
      })
      return () => {
        isCancelled = true
      }
    }
    setNodes(nodes)
    setEdges(edges)
    xyflow.setViewport(nextviewport)
    return undefined
  }, [nodes, edges])

  return (
    <ReactFlow
      className={css.root}
      defaultEdges={[] as XYFlowTypes.Edge[]}
      defaultNodes={[] as XYFlowTypes.Node[]}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultMarkerColor="var(--xy-edge-stroke)"
      zoomOnPinch={true}
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
          } as XYFlowTypes.Node))
        )
      }}
      onEdgeMouseLeave={() => {
        resetDimmedAndHovered(xyflow)
      }}
      onNodeClick={(e, node) => {
        e.stopPropagation()
        if (node.type === 'empty') return
        lastClickedNodeRef.current = node
        overlay.openOverlay({
          relationshipsOf: node.data.fqn
        })
      }}
      onNodeDoubleClick={(e) => {
        e.stopPropagation()
      }}
      onDoubleClick={e => {
        e.stopPropagation()
        fitview()
      }}
      onEdgeClick={(e, edge) => {
        e.stopPropagation()
        // One relation in edge
        const relationId = only(edge.data.relations)?.id
        if (relationId) {
          diagramStore.getState().onOpenSourceRelation?.(relationId)
          return
        }

        const nodeId = onlyOneUnique(edge.data, 'source') ? edge.source : edge.target
        const next = xyflow.getNode(nodeId)
        if (next && next.type !== 'empty') {
          lastClickedNodeRef.current = next
          overlay.openOverlay({
            relationshipsOf: next.data.fqn
          })
        }
      }}
    >
      <Panel position="top-center">
        <Group gap={'xs'} wrap={'nowrap'}>
          <Button
            leftSection={<IconArrowLeft stroke={3} size={14} />}
            color="dimmed"
            variant="subtle"
            style={{
              visibility: current > 0 ? 'visible' : 'hidden',
              padding: '0.25rem 0.75rem'
            }}
            styles={{
              label: {
                fontWeight: 400
              },
              section: {
                marginInlineEnd: 6
              }
            }}
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              historyOps.back()
            }}>
            Back
          </Button>
          <Space w={2} />
          <Group gap={'xs'} pos={'relative'} wrap="nowrap" flex={'1 0 auto'}>
            <Box fz={'sm'} fw={'400'} style={{ whiteSpace: 'nowrap' }}>Relationships of</Box>
            <Box flex={'1 0 auto'}>
              <SelectElement
                scope={scope}
                subject={subject.element}
                onSelect={fqn =>
                  overlay.openOverlay({
                    relationshipsOf: fqn
                  })}
                viewId={view.id} />
            </Box>
            <SegmentedControl
              flex={'1 0 auto'}
              size="xs"
              withItemsBorders={false}
              value={scope}
              onChange={setScope as any}
              data={[
                { label: 'Global', value: 'global' },
                { label: 'Current view', value: 'view', disabled: !viewIncludesSubject }
              ]}
            />
            {showSubjectWarning && (
              <Box
                pos={'absolute'}
                top={'calc(100% + .5rem)'}
                left={'50%'}
                w={'max-content'}
                style={{
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setScope('global')
                }}
              >
                <Text fw={500} size="xs" c="orange" component="div">
                  Current view doesn't include this element, switched to Global
                </Text>
              </Box>
            )}
          </Group>
          <Button
            rightSection={<IconArrowRight stroke={3} size={14} />}
            color="dimmed"
            variant="subtle"
            style={{
              visibility: current + 1 < history.length ? 'visible' : 'hidden',
              padding: '0.25rem 0.75rem'
            }}
            styles={{
              label: {
                fontWeight: 400
              },
              section: {
                marginInlineStart: 4
              }
            }}
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              historyOps.forward()
            }}>
            Forward
          </Button>
        </Group>
      </Panel>
    </ReactFlow>
  )
})
