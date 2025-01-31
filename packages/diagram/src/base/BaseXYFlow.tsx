import { useCallbackRef, useMounted } from '@mantine/hooks'
import { useIsMounted } from '@react-hookz/web'
import {
  type ReactFlowProps,
  ReactFlow,
  useOnViewportChange,
  useStoreApi,
} from '@xyflow/react'
import clsx from 'clsx'
import { useEffect, useMemo } from 'react'
import type { SetRequired, Simplify } from 'type-fest'
import * as css from '../LikeC4Diagram.css'
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
      | 'panOnScroll'
      | 'panOnDrag'
      | 'preventScrolling'
      | 'zoomOnPinch'
      | 'zoomActivationKeyCode'
      | 'zoomOnScroll'
      | 'elementsSelectable'
      | 'onNodeMouseEnter'
      | 'onNodeMouseLeave'
      | 'onEdgeMouseEnter'
      | 'onEdgeMouseLeave'
      | 'fitViewOptions'
    >,
    // Required props
    | 'nodes'
    | 'edges'
    | 'onNodesChange'
    | 'onEdgesChange'
  >
>

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
  ...props
}: BaseXYFlowProps<NodeType, EdgeType>) => {
  const isBgWithPattern = background !== 'transparent' && background !== 'solid'

  return (
    <ReactFlow<NodeType, EdgeType>
      colorMode={colorMode}
      nodes={nodes}
      edges={edges}
      className={clsx(
        'likec4-diagram',
        css.cssReactFlow,
        pannable !== true && css.cssDisablePan,
        background === 'transparent' && css.cssTransparentBg,
        className,
      )}
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
      <BaseXYFlowInner onViewportResize={onViewportResize} />
      {children}
    </ReactFlow>
  )
}

const BaseXYFlowInner = ({
  onViewportResize,
}: Pick<BaseXYFlowProps<any, any>, 'onViewportResize'>) => {
  const xyflowApi = useStoreApi()

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
        xyflowApi.setState({ transform: [roundedX, roundedY, zoom] })
      }
    },
  })

  const isMounted = useIsMounted()
  const listenToViewportResize = !!onViewportResize
  const onViewportResizeCb = useCallbackRef(onViewportResize)

  useEffect(() => {
    if (!listenToViewportResize) {
      return
    }
    return xyflowApi.subscribe((state, prevState) => {
      if (!isMounted()) {
        return
      }
      if (state.width !== prevState.width || state.height !== prevState.height) {
        onViewportResizeCb()
      }
    })
  }, [listenToViewportResize])

  return <></>
}
