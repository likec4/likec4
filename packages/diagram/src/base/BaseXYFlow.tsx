import { cx } from '@likec4/styles/css'
import { useMantineColorScheme } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import {
  type ReactFlowProps,
  type ReactFlowState,
  ReactFlow,
  useStore,
} from '@xyflow/react'
import { useRef } from 'react'
import type { SetRequired, Simplify } from 'type-fest'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import { useIsZoomTooSmall, useXYStoreApi } from '../hooks/useXYFlow'
import type { ViewPadding } from '../LikeC4Diagram.props'
import { roundDpr } from '../utils/roundDpr'
import { stopPropagation } from '../utils/xyflow'
import { type XYBackground, Background } from './Background'
import { MaxZoom, MinZoom } from './const'
import type { BaseEdge, BaseNode } from './types'
import { Base } from './types'

export type BaseXYFlowProps<NodeType extends BaseNode, EdgeType extends BaseEdge> = Simplify<
  & {
    pannable?: boolean
    zoomable?: boolean
    nodesSelectable?: boolean
    nodesDraggable?: boolean
    background?: 'transparent' | 'solid' | XYBackground
    fitViewPadding?: ViewPadding | undefined
    onViewportResize?: undefined | (() => void)
  }
  & SetRequired<
    Omit<
      ReactFlowProps<NodeType, EdgeType>,
      // Omited props
      | 'defaultNodes'
      | 'defaultEdges'
      | 'onNodeDoubleClick'
      | 'onEdgeDoubleClick'
      | 'fitViewOptions'
    >,
    // Required props
    | 'nodes'
    | 'edges'
    | 'onNodesChange'
    | 'onEdgesChange'
  >
>

export function BaseXYFlow<
  NodeType extends BaseNode,
  EdgeType extends BaseEdge,
>(
  {
    nodes,
    edges,
    onEdgesChange,
    onNodesChange,
    className,
    pannable = true,
    zoomable = true,
    nodesSelectable = true,
    nodesDraggable = false,
    background = 'dots',
    children,
    colorMode,
    fitViewPadding = 0,
    fitView = true,
    zoomOnDoubleClick = false,
    onViewportResize,
    onMoveEnd,
    onNodeMouseEnter,
    onNodeMouseLeave,
    onEdgeMouseEnter,
    onEdgeMouseLeave,
    ...props
  }: BaseXYFlowProps<NodeType, EdgeType>,
) {
  const fitViewOptions = useRef<ReactFlowProps['fitViewOptions']>(null)
  if (!fitViewOptions.current || fitViewOptions.current.padding !== fitViewPadding) {
    fitViewOptions.current = {
      minZoom: MinZoom,
      maxZoom: 1,
      padding: fitViewPadding,
      includeHiddenNodes: false,
    }
  }

  const isBgWithPattern = background !== 'transparent' && background !== 'solid'
  const isZoomTooSmall = useIsZoomTooSmall()
  const xystore = useXYStoreApi()
  const { colorScheme } = useMantineColorScheme()
  if (!colorMode) {
    colorMode = colorScheme === 'auto' ? 'system' : colorScheme
  }

  return (
    <ReactFlow<NodeType, EdgeType>
      colorMode={colorMode}
      nodes={nodes}
      edges={edges}
      className={cx(
        background === 'transparent' && 'bg-transparent',
        className,
      )}
      {...isZoomTooSmall && {
        ['data-likec4-zoom-small']: true,
      }}
      zoomOnPinch={zoomable}
      zoomOnScroll={!pannable && zoomable}
      {...(!zoomable && {
        zoomActivationKeyCode: null,
      })}
      zoomOnDoubleClick={zoomOnDoubleClick}
      maxZoom={zoomable ? MaxZoom : 1}
      minZoom={zoomable ? MinZoom : 1}
      fitView={fitView}
      fitViewOptions={fitViewOptions.current}
      preventScrolling={zoomable || pannable}
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
      noWheelClassName="nowheel"
      panOnScroll={pannable}
      panOnDrag={pannable}
      {...(!pannable && {
        panActivationKeyCode: null,
        selectionKeyCode: null,
      })}
      elementsSelectable={nodesSelectable}
      nodesFocusable={nodesDraggable || nodesSelectable}
      edgesFocusable={false}
      nodesDraggable={nodesDraggable}
      nodeDragThreshold={4}
      nodeClickDistance={3}
      paneClickDistance={3}
      elevateNodesOnSelect={false} // or edges are not visible after select\
      selectNodesOnDrag={false}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onMoveEnd={useCallbackRef((event, { x, y, zoom }) => {
        /**
         * WORKAROUND
         * Viewport transform is not rounded to integers which results in blurry nodes on some resolution
         * https://github.com/xyflow/xyflow/issues/3282
         * https://github.com/likec4/likec4/issues/734
         */
        const roundedX = roundDpr(x), roundedY = roundDpr(y)
        if (x !== roundedX || y !== roundedY) {
          xystore.setState({ transform: [roundedX, roundedY, zoom] })
        }
        onMoveEnd?.(event, { x: roundedX, y: roundedY, zoom })
      })}
      onNodeMouseEnter={useCallbackRef((_event, node) => {
        if (onNodeMouseEnter) {
          onNodeMouseEnter(_event, node)
          return
        }
        if (!node.data.hovered) {
          onNodesChange([{
            id: node.id,
            type: 'replace',
            item: Base.setHovered(node, true),
          }])
        }
      })}
      onNodeMouseLeave={useCallbackRef((_event, node) => {
        if (onNodeMouseLeave) {
          onNodeMouseLeave(_event, node)
          return
        }
        if (node.data.hovered) {
          onNodesChange([{
            id: node.id,
            type: 'replace',
            item: Base.setHovered(node, false),
          }])
        }
      })}
      onEdgeMouseEnter={useCallbackRef((_event, edge) => {
        if (onEdgeMouseEnter) {
          onEdgeMouseEnter(_event, edge)
          return
        }
        if (!edge.data.hovered) {
          onEdgesChange([{
            id: edge.id,
            type: 'replace',
            item: Base.setHovered(edge, true),
          }])
        }
      })}
      onEdgeMouseLeave={useCallbackRef((_event, edge) => {
        if (onEdgeMouseLeave) {
          onEdgeMouseLeave(_event, edge)
          return
        }
        if (edge.data.hovered) {
          onEdgesChange([{
            id: edge.id,
            type: 'replace',
            item: Base.setHovered(edge, false),
          }])
        }
      })}
      onNodeDoubleClick={stopPropagation}
      onEdgeDoubleClick={stopPropagation}
      {...props}
    >
      {isBgWithPattern && <Background background={background} />}
      {onViewportResize && <ViewportResizeHanlder onViewportResize={onViewportResize} />}
      {children}
    </ReactFlow>
  )
}

const selectDimensions = ({ width, height }: ReactFlowState) => (width || 1) * (height || 1)

const ViewportResizeHanlder = ({
  onViewportResize,
}: {
  onViewportResize: () => void
}) => {
  const square = useStore(selectDimensions)
  useUpdateEffect(onViewportResize, [square])

  return null
}
