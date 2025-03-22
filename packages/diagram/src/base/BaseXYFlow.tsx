import { css, cx } from '@likec4/styles/css'
import { useCallbackRef } from '@mantine/hooks'
import {
  type ReactFlowProps,
  type ReactFlowState,
  ReactFlow,
  useStore,
} from '@xyflow/react'
import { useMemo } from 'react'
import type { SetRequired, Simplify } from 'type-fest'
import { useIsReducedGraphics } from '../hooks/useReducedGraphics'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import { useIsZoomTooSmall, useXYStoreApi } from '../hooks/useXYFlow'
import { stopPropagation } from '../utils/xyflow'
import { type XYBackground, Background } from './Background'
import { MaxZoom, MinZoom } from './const'
import { Base } from './types'

export type BaseXYFlowProps<NodeType extends Base.Node, EdgeType extends Base.Edge> = Simplify<
  & {
    pannable?: boolean
    zoomable?: boolean
    nodesSelectable?: boolean
    nodesDraggable?: boolean
    background?: 'transparent' | 'solid' | XYBackground
    fitViewPadding?: number
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

const cssTransparentBg = css({
  background: 'transparent !important',
  ['--xy-background-color']: 'transparent !important',
})

const cssReactFlow = css({
  // '@supports': {
  //   // https://wojtek.im/journal/targeting-safari-with-css-media-query
  //   '(hanging-punctuation: first) and (font: -apple-system-body) and (-webkit-appearance: none)': {
  //     // TODO: this workaround disables animations in Safari (to improve performance)
  //     vars: {
  //       [vars.safariAnimationHook]: '',
  //     },
  //   },
  // },
  ['--xy-background-color']: '{colors.likec4.background}',
  ['--xy-background-pattern-color']: '{colors.likec4.background.pattern}',
  '& .react-flow__pane': {
    WebkitUserSelect: 'none',
  },
  '& .react-flow__attribution': {
    display: 'none',
  },
})

export const BaseXYFlow = <
  NodeType extends Base.Node,
  EdgeType extends Base.Edge,
>({
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
  colorMode = 'system',
  fitViewPadding = 0,
  fitView = true,
  zoomOnDoubleClick = false,
  onViewportResize,
  onMoveEnd,
  ...props
}: BaseXYFlowProps<NodeType, EdgeType>) => {
  const isBgWithPattern = background !== 'transparent' && background !== 'solid'
  const isZoomTooSmall = useIsZoomTooSmall()
  const reduceGraphics = useIsReducedGraphics()

  const xystore = useXYStoreApi()

  return (
    <ReactFlow<NodeType, EdgeType>
      colorMode={colorMode}
      nodes={nodes}
      edges={edges}
      className={cx(
        cssReactFlow,
        background === 'transparent' && cssTransparentBg,
        cssTransparentBg,
        className,
      )}
      {...isZoomTooSmall && {
        ['data-likec4-zoom-small']: true,
      }}
      {...reduceGraphics && {
        ['data-likec4-reduced-graphics']: true,
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
      fitViewOptions={useMemo(() => ({
        minZoom: MinZoom,
        maxZoom: 1,
        padding: fitViewPadding,
        includeHiddenNodes: false,
      }), [fitViewPadding])}
      preventScrolling={zoomable || pannable}
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
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
      nodeClickDistance={1.9}
      paneClickDistance={1.9}
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
        const roundedX = Math.round(x),
          roundedY = Math.round(y)
        if (x !== roundedX || y !== roundedY) {
          xystore.setState({ transform: [roundedX, roundedY, zoom] })
        }
        onMoveEnd?.(event, { x: roundedX, y: roundedY, zoom })
      })}
      onNodeMouseEnter={useCallbackRef((_event, node) => {
        onNodesChange([{
          id: node.id,
          type: 'replace',
          item: Base.setHovered(node, true),
        }])
      })}
      onNodeMouseLeave={useCallbackRef((_event, node) => {
        onNodesChange([{
          id: node.id,
          type: 'replace',
          item: Base.setHovered(node, false),
        }])
      })}
      onEdgeMouseEnter={useCallbackRef((_event, edge) => {
        onEdgesChange([{
          id: edge.id,
          type: 'replace',
          item: Base.setHovered(edge, true),
        }])
      })}
      onEdgeMouseLeave={useCallbackRef((_event, edge) => {
        onEdgesChange([{
          id: edge.id,
          type: 'replace',
          item: Base.setHovered(edge, false),
        }])
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
