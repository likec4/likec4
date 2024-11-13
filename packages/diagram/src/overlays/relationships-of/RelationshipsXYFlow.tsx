import { delay, type Fqn, isAncestor, type Relation } from '@likec4/core'
import { Box, Button, Group, SegmentedControl, Space, Text } from '@mantine/core'
import { useId, useLocalStorage, useStateHistory } from '@mantine/hooks'
import { useDebouncedCallback, useDeepCompareEffect, useSyncedRef } from '@react-hookz/web'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import {
  Background,
  BackgroundVariant,
  getViewportForBounds,
  Panel,
  ReactFlow,
  type ReactFlowInstance,
  useOnViewportChange,
  useReactFlow,
  useStoreApi
} from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { memo, useEffect, useRef } from 'react'
import { isNullish, map, omit, only, prop, setPath, unique } from 'remeda'
import { useDiagramStoreApi } from '../../hooks/useDiagramState'
import { centerXYInternalNode } from '../../xyflow/utils'
import { useOverlayDialog } from '../OverlayContext'
import { cssReactflowMarker } from '../Overlays.css'
import type { XYFlowTypes } from './_types'
import { SelectElement } from './SelectElement'
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

/**
 * Root node in 'subjects' column
 */
const findRootSubject = (nodes: XYFlowTypes.Node[]) =>
  nodes.find((n): n is XYFlowTypes.ElementNode => n.data.column === 'subjects' && isNullish(n.parentId))

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

export const RelationshipsXYFlow = memo<{ subjectId: Fqn }>(function RelationshipsXYFlow({ subjectId }) {
  const id = useId()
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
    notIncludedRelations,
    edges,
    nodes,
    subject,
    bounds
  } = useLayoutedRelationships(subjectId, _scope)
  const scope = viewIncludesSubject ? _scope : 'global'
  const showSubjectWarning = !viewIncludesSubject && _scope === 'view'

  const [historySubjectId, historyOps, { history, current }] = useStateHistory(subject.id)

  const xyflow = useReactFlow<XYFlowTypes.Node, XYFlowTypes.Edge>()
  const xystore = useStoreApi<XYFlowTypes.Node, XYFlowTypes.Edge>()
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
    }
  })

  const initialFitviewFlagRef = useRef(false)
  const viewBoundsRef = useSyncedRef(bounds)

  const fitview = useDebouncedCallback(
    () => {
      const { width, height } = xystore.getState()
      xyflow.setViewport(
        getViewportForBounds(viewBoundsRef.current, width, height, 0.2, 1, 0.2),
        initialFitviewFlagRef.current ? { duration: 500 } : undefined
      )
      initialFitviewFlagRef.current = true
    },
    [xyflow],
    150
  )

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
      setNodes(map(nodes, setPath(['data', 'initialAnimation'], false)))
      setEdges(edges)
      fitview()
      return
    }

    if (!nextSubjectNode) {
      console.error('Subject node not found')
    } else if (nextSubjectNode.data.fqn !== subject.id) {
      console.error(`Subject node mismatch, expected: ${subject.id} got: ${nextSubjectNode.data.fqn}`)
    }

    const nextzoom = getViewportForBounds(bounds, width, height, 0.2, 1, 0.2).zoom

    const nextSubjectCenter = nextSubjectNode && {
      x: nextSubjectNode.position.x + (nextSubjectNode.width ?? 0) / 2,
      y: nextSubjectNode.position.y + (nextSubjectNode.height ?? 0) / 2
    }

    const existingNode = lastClickedNodeRef.current
      ?? xyflow.getNodes().find(n => n.type !== 'empty' && n.data.column !== 'subjects' && n.data.fqn === subject.id)
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
          } as XYFlowTypes.Node
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
        } as XYFlowTypes.Node
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

      // xyflow.setCenter(currentSubjectCenter.x, currentSubjectCenter.y, { zoom, duration: 250 }).then(() => {
      //   // If the component is unmounted, we don't want to update the state
      //   if (isCancelled) return
      //   setNodes(nodes)
      //   setEdges(edges)
      //   xyflow.setCenter(nextSubjectCenter.x, nextSubjectCenter.y, { zoom })
      //   fitview()
      // })
      return () => {
        isCancelled = true
      }
    }
    setNodes(map(nodes, setPath(['data', 'initialAnimation'], false)))
    setEdges(edges)
    fitview()
    return undefined
  }, [nodes, edges])

  return (
    <ReactFlow
      id={id}
      defaultEdges={[] as XYFlowTypes.Edge[]}
      defaultNodes={[] as XYFlowTypes.Node[]}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultMarkerColor="var(--likec4-relation-lineColor)"
      className={cssReactflowMarker}
      zoomOnPinch={true}
      zoomOnScroll={false}
      zoomOnDoubleClick={false}
      maxZoom={2}
      minZoom={0.05}
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
      <Background variant={BackgroundVariant.Dots} size={2} gap={20} />
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
            <Box fz={'sm'} fw={'400'} style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>Relationships of</Box>
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
            {viewIncludesSubject && scope === 'view' && notIncludedRelations > 0 && (
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
                  View does not include {notIncludedRelations}{' '}
                  relationship{notIncludedRelations > 1 ? 's' : ''}. Switch to Global to compare
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
