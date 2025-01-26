import { type EdgeId, type NodeId, nonNullable } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import clsx from 'clsx'
import type { EnforceOptional } from 'type-fest/source/enforce-optional'
import { BaseXYFlow } from '../base'
import { useDiagramEventHandlers, useEnabledFeature } from '../context'
import { useDiagram } from '../hooks/useDiagram'
import { useDiagramContext } from '../hooks/useDiagramContext'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import { edgeTypes, nodeTypes } from './custom'
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
})

type Picked = EnforceOptional<
  Pick<
    LikeC4DiagramProperties,
    | 'background'
    | 'nodesDraggable'
    | 'nodesSelectable'
  >
>
export type LikeC4DiagramXYFlowProps = Required<Picked>

export const LikeC4DiagramXYFlow = ({ background, ...rest }: LikeC4DiagramXYFlowProps) => {
  const diagram = useDiagram()
  const {
    initialized,
    nodes,
    edges,
    ...props
  } = useDiagramContext(selectXYProps)

  const {
    onNodeContextMenu,
    onCanvasContextMenu,
    onEdgeContextMenu,
    onNodeClick,
    onEdgeClick,
    onCanvasClick,
    onCanvasDblClick,
  } = useDiagramEventHandlers()

  const {
    enableFitView,
    enableReadOnly,
  } = useEnabledFeature('ReadOnly', 'FitView')

  const notReadOnly = !enableReadOnly

  const layoutConstraints = useLayoutConstraints()

  return (
    <BaseXYFlow<Types.Node, Types.Edge>
      nodes={nodes}
      edges={edges}
      className={clsx(initialized ? 'initialized' : 'not-initialized')}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={useCallbackRef((changes) => {
        diagram.send({ type: 'xyflow.applyNodeChages', changes })
      })}
      onEdgesChange={useCallbackRef((changes) => {
        diagram.send({ type: 'xyflow.applyEdgeChages', changes })
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
      {...onNodeContextMenu && {
        onNodeContextMenu: useCallbackRef((event, node) => {
          const diagramNode = nonNullable(
            diagram.findDiagramNode(node.id as NodeId),
            `diagramNode ${node.id} not found`,
          )
          onNodeContextMenu(diagramNode, event)
        }),
      }}
      {...onEdgeContextMenu && {
        onEdgeContextMenu: useCallbackRef((event, edge) => {
          const diagramEdge = nonNullable(
            diagram.findDiagramEdge(edge.id as EdgeId),
            `diagramEdge ${edge.id} not found`,
          )
          onEdgeContextMenu(diagramEdge, event)
        }),
      }}
      {...onCanvasContextMenu && {
        onPaneContextMenu: useCallbackRef((event) => {
          onCanvasContextMenu(event as any)
        }),
      }}
      {...enableFitView && {
        onViewportResize: () => {
          diagram.send({ type: 'xyflow.resized' })
        },
      }}
      {...(notReadOnly && rest.nodesDraggable && layoutConstraints)}
      {...props}
      {...rest} />
  )
}
