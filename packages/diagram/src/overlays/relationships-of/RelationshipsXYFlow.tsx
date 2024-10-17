import { invariant, isAncestor, type notDescendantOf, type Relation } from '@likec4/core'
import { Box, Button, Group, SegmentedControl, Space, Text } from '@mantine/core'
import { useLocalStorage, useStateHistory } from '@mantine/hooks'
import { useDebouncedEffect } from '@react-hookz/web'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import { Panel, ReactFlow, type ReactFlowInstance, useReactFlow, useStoreApi } from '@xyflow/react'
import { memo, useEffect, useRef } from 'react'
import { map, only, prop, unique } from 'remeda'
import { useOverlayDialog } from '../../components'
import { useDiagramStoreApi } from '../../hooks/useDiagramState'
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
      }) as any
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
    subject
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

  useEffect(() => {
    const nextSubjectNode = nodes.find((n): n is XYFlowTypes.NonEmptyNode =>
      n.type !== 'empty' && n.data.column === 'subject'
    )
    if (!nextSubjectNode) {
      console.error('Subject node not found')
    } else if (nextSubjectNode.data.fqn !== subject.id) {
      console.error(`Subject node mismatch, expected: ${subject.id} got: ${nextSubjectNode.data.fqn}`)
    }
    const existingNode = lastClickedNodeRef.current
      ?? xyflow.getNodes().find(n => n.type !== 'empty' && n.data.column !== 'subject' && n.data.fqn === subject.id)
    lastClickedNodeRef.current = null
    // Correct position if we have subject in existing nodes
    if (nextSubjectNode && existingNode && existingNode.data.column !== 'subject') {
      const xynodeFrom = xyflow.getInternalNode(existingNode.id)!
      const fromPos = xyflow.flowToScreenPosition({
          x: xynodeFrom.internals.positionAbsolute.x,
          y: xynodeFrom.internals.positionAbsolute.y
        }),
        toPos = xyflow.flowToScreenPosition({
          x: nextSubjectNode.position.x,
          y: nextSubjectNode.position.y
        }),
        diff = {
          x: fromPos.x - toPos.x,
          y: fromPos.y - toPos.y
        }
      xystore.getState().panBy(diff)
      xystore.getState().setNodes(nodes)
      xystore.getState().setEdges(edges)
      return
    }
    xyflow.setNodes(nodes)
    xyflow.setEdges(edges)
  }, [nodes, edges])

  const zoomable = true

  useDebouncedEffect(
    () => {
      xyflow.fitView({
        padding: 0.2,
        includeHiddenNodes: true,
        maxZoom: 1,
        duration: 450
      })
    },
    [subject.id, scope],
    200
  )

  return (
    <ReactFlow
      className={css.root}
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
            } as any
          }))
        )
      }}
      onEdgeMouseLeave={() => {
        resetDimmedAndHovered(xyflow)
      }}
      onNodeClick={(e, node) => {
        e.stopPropagation()
        if (node.type === 'empty') return
        if (subject.id !== node.data.fqn) {
          lastClickedNodeRef.current = node
        }
        overlay.openOverlay({
          relationshipsOf: node.data.fqn
        })
      }}
      onDoubleClick={e => {
        e.stopPropagation()
        xyflow.fitView({
          includeHiddenNodes: true,
          maxZoom: 1,
          duration: 450
        })
      }}
      onEdgeClick={(e, edge) => {
        e.stopPropagation()
        if (edge.data.relations.length <= 1) {
          const relationId = only(edge.data.relations)?.id
          if (relationId) {
            diagramStore.getState().onOpenSourceRelation?.(relationId)
          }
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
                  Current view doesn't include selected element, switched to Global
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
