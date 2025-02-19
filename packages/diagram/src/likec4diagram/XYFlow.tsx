import { type EdgeId, type NodeId, nonNullable } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import clsx from 'clsx'
import { shallowEqual } from 'fast-equals'
import { memo } from 'react'
import type { EnforceOptional } from 'type-fest/source/enforce-optional'
import { BaseXYFlow } from '../base/BaseXYFlow'
import { useDiagramEventHandlers } from '../context'
import { useDiagram } from '../hooks/useDiagram'
import { useDiagramContext } from '../hooks/useDiagramContext'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import { edgeTypes, nodeTypes } from './custom'
import { DiagramUI } from './DiagramUI'
import type { DiagramContext } from './state/machine'
import type { Types } from './types'
import { useLayoutConstraints } from './useLayoutConstraints'

const selectXYProps = (ctx: DiagramContext) => ({
  initialized: ctx.initialized,
  nodes: ctx.xynodes,
  edges: ctx.xyedges,
  pannable: ctx.pannable,
  zoomable: ctx.zoomable,
  fitViewPadding: ctx.fitViewPadding,
  enableFitView: ctx.features.enableFitView,
  enableReadOnly: ctx.features.enableReadOnly || ctx.toggledFeatures.enableReadOnly,
  ...(!ctx.features.enableFitView && {
    viewport: {
      x: -Math.min(ctx.view.bounds.x, 0),
      y: -Math.min(ctx.view.bounds.y, 0),
      zoom: 1,
    },
  }),
})
const equalsXYProps = (a: ReturnType<typeof selectXYProps>, b: ReturnType<typeof selectXYProps>): boolean =>
  a.initialized === b.initialized &&
  a.pannable === b.pannable &&
  a.zoomable === b.zoomable &&
  a.fitViewPadding === b.fitViewPadding &&
  a.enableFitView === b.enableFitView &&
  a.enableReadOnly === b.enableReadOnly &&
  shallowEqual(a.nodes, b.nodes) &&
  shallowEqual(a.edges, b.edges) &&
  shallowEqual(a.viewport, b.viewport)

type Picked = EnforceOptional<
  Pick<
    LikeC4DiagramProperties,
    | 'background'
    | 'nodesDraggable'
    | 'nodesSelectable'
  >
>
export type LikeC4DiagramXYFlowProps = Required<Picked>

export const LikeC4DiagramXYFlow = memo<LikeC4DiagramXYFlowProps>(({ background, nodesDraggable, nodesSelectable }) => {
  const diagram = useDiagram()
  const {
    initialized,
    nodes,
    edges,
    enableReadOnly,
    enableFitView,
    ...props
  } = useDiagramContext(selectXYProps, equalsXYProps)

  const {
    onNodeContextMenu,
    onCanvasContextMenu,
    onEdgeContextMenu,
    onNodeClick,
    onEdgeClick,
    onCanvasClick,
    onCanvasDblClick,
  } = useDiagramEventHandlers()

  const notReadOnly = !enableReadOnly

  const layoutConstraints = useLayoutConstraints()

  const onViewportResize = useCallbackRef(() => {
    diagram.send({ type: 'xyflow.resized' })
  })

  return (
    <BaseXYFlow<Types.Node, Types.Edge>
      nodes={nodes}
      edges={edges}
      className={clsx(initialized ? 'initialized' : 'not-initialized')}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={useCallbackRef((changes) => {
        diagram.send({ type: 'xyflow.applyNodeChanges', changes })
      })}
      onEdgesChange={useCallbackRef((changes) => {
        diagram.send({ type: 'xyflow.applyEdgeChanges', changes })
      })}
      background={initialized ? background : 'transparent'}
      // Fitview is handled in onInit
      fitView={false}
      onNodeClick={useCallbackRef((e, node) => {
        e.stopPropagation()
        diagram.send({ type: 'xyflow.nodeClick', node })
        onNodeClick?.(diagram.findDiagramNode(node.id as NodeId)!, e)
      })}
      onEdgeClick={useCallbackRef((e, edge) => {
        e.stopPropagation()
        diagram.send({ type: 'xyflow.edgeClick', edge })
        onEdgeClick?.(diagram.findDiagramEdge(edge.id as EdgeId)!, e)
      })}
      onPaneClick={useCallbackRef((e) => {
        e.stopPropagation()
        diagram.send({ type: 'xyflow.paneClick' })
        onCanvasClick?.(e as any)
      })}
      onDoubleClick={useCallbackRef(e => {
        e.stopPropagation()
        e.preventDefault()
        diagram.send({ type: 'xyflow.paneDblClick' })
        onCanvasDblClick?.(e as any)
      })}
      onMoveEnd={useCallbackRef((event, viewport) => {
        // if event is present, the move was triggered by user
        diagram.send({ type: 'xyflow.viewportMoved', viewport, manually: !!event })
      })}
      onInit={useCallbackRef((instance) => {
        diagram.send({ type: 'xyflow.init', instance })
      })}
      onNodeContextMenu={useCallbackRef((event, node) => {
        const diagramNode = nonNullable(
          diagram.findDiagramNode(node.id as NodeId),
          `diagramNode ${node.id} not found`,
        )
        onNodeContextMenu?.(diagramNode, event)
      })}
      onEdgeContextMenu={useCallbackRef((event, edge) => {
        const diagramEdge = nonNullable(
          diagram.findDiagramEdge(edge.id as EdgeId),
          `diagramEdge ${edge.id} not found`,
        )
        onEdgeContextMenu?.(diagramEdge, event)
      })}
      onPaneContextMenu={useCallbackRef((event) => {
        onCanvasContextMenu?.(event as any)
      })}
      {...enableFitView && {
        onViewportResize,
      }}
      nodesDraggable={notReadOnly && nodesDraggable}
      nodesSelectable={nodesSelectable}
      {...(notReadOnly && nodesDraggable && layoutConstraints)}
      {...props}>
      <DiagramUI />
    </BaseXYFlow>
  )
}, shallowEqual)
