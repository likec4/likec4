import { type EdgeId, type NodeId, nonNullable } from '@likec4/core'
import { cx } from '@likec4/styles/css'
import { useCallbackRef, useTimeout } from '@mantine/hooks'
import type { OnMove, OnMoveEnd } from '@xyflow/system'
import { deepEqual, shallowEqual } from 'fast-equals'
import { type PropsWithChildren, memo } from 'react'
import { BaseXYFlow } from '../base/BaseXYFlow'
import { useDiagramEventHandlers } from '../context'
import { usePanningAtom } from '../context/ReduceGraphics'
import { useDiagram, useDiagramContext } from '../hooks/useDiagram'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import type { DiagramContext } from '../state/types'
import { edgeTypes, nodeTypes } from './custom'
import { DiagramUI } from './DiagramUI'
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
  shallowEqual(a.viewport ?? null, b.viewport ?? null)

export type LikeC4DiagramXYFlowProps = PropsWithChildren<
  Pick<
    LikeC4DiagramProperties,
    | 'background'
    | 'nodesDraggable'
    | 'nodesSelectable'
    | 'reactFlowProps'
  >
>

const compareProps = <T extends LikeC4DiagramXYFlowProps>(a: T, b: T): boolean =>
  a.nodesDraggable === b.nodesDraggable &&
  a.nodesSelectable === b.nodesSelectable &&
  deepEqual(a.background, b.background) &&
  deepEqual(a.reactFlowProps ?? {}, b.reactFlowProps ?? {})

export const LikeC4DiagramXYFlow = memo<LikeC4DiagramXYFlowProps>(({
  background = 'dots',
  nodesDraggable = false,
  nodesSelectable = false,
  reactFlowProps = {},
  children,
}) => {
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

  const notReadOnly = !enableReadOnly,
    layoutConstraints = useLayoutConstraints(),
    $isPanning = usePanningAtom(),
    isPanning = useTimeout(() => {
      $isPanning.set(true)
    }, 160),
    notPanning = useTimeout(() => {
      isPanning.clear()
      if ($isPanning.get()) {
        $isPanning.set(false)
      }
    }, 120),
    onMove: OnMove = useCallbackRef((event) => {
      if (!event) {
        return
      }
      if (!$isPanning.get()) {
        isPanning.start()
      }
      notPanning.clear()
      notPanning.start()
    }),
    onMoveEnd: OnMoveEnd = useCallbackRef((event, viewport) => {
      notPanning.start()
      diagram.send({ type: 'xyflow.viewportMoved', viewport, manually: !!event })
    }),
    onViewportResize = useCallbackRef(() => {
      diagram.send({ type: 'xyflow.resized' })
    })

  return (
    <BaseXYFlow<Types.Node, Types.Edge>
      nodes={nodes}
      edges={edges}
      className={cx(initialized ? 'initialized' : 'not-initialized')}
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
      onNodeMouseEnter={useCallbackRef((_event, node) => {
        _event.stopPropagation()
        if (!node.data.hovered) {
          diagram.send({ type: 'xyflow.nodeMouseEnter', node })
        }
      })}
      onNodeMouseLeave={useCallbackRef((_event, node) => {
        _event.stopPropagation()
        if (node.data.hovered) {
          diagram.send({ type: 'xyflow.nodeMouseLeave', node })
        }
      })}
      onEdgeMouseEnter={useCallbackRef((_event, edge) => {
        _event.stopPropagation()
        if (!edge.data.hovered) {
          diagram.send({ type: 'xyflow.edgeMouseEnter', edge })
        }
      })}
      onEdgeMouseLeave={useCallbackRef((_event, edge) => {
        _event.stopPropagation()
        if (edge.data.hovered) {
          diagram.send({ type: 'xyflow.edgeMouseLeave', edge })
        }
      })}
      {...props.pannable && {
        onMove,
      }}
      onMoveEnd={onMoveEnd}
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
      {...props}
      {...reactFlowProps}>
      <DiagramUI key={'DiagramUI'} />
      {children}
    </BaseXYFlow>
  )
}, compareProps)
LikeC4DiagramXYFlow.displayName = 'LikeC4DiagramXYFlow'
