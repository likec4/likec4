import { ReactFlow, useOnViewportChange } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { type CSSProperties, type PropsWithChildren, useMemo, useState } from 'react'
import { useDiagramState } from '../hooks/useDiagramState'
import { useXYStoreApi } from '../hooks/useXYFlow'
import type { DiagramState } from '../state/diagramStore'
import { MaxZoom, MinZoom } from './const'
import { RelationshipEdge } from './edges/RelationshipEdge'
import { CompoundNode } from './nodes/compound'
import { ElementNode } from './nodes/element'
import { XYFlowEdge, XYFlowNode } from './types'
import { useLayoutConstraints } from './useLayoutConstraints'
import { useXYFlowEvents } from './XYFlowEvents'

const nodeTypes = {
  element: ElementNode,
  compound: CompoundNode
}
const edgeTypes = {
  relationship: RelationshipEdge
}

type XYFlowWrapperProps = PropsWithChildren<{
  colorMode?: 'system' | 'light' | 'dark'
  className?: string | undefined
  style?: CSSProperties | undefined
}>

// const propsAreEqual = (
//   prev: XYFlowWrapperProps,
//   next: XYFlowWrapperProps
// ) => {
//   return shallowEqual(
//     omit(prev, ['children']),
//     omit(next, ['children'])
//   )
// }

const selector = (s: DiagramState) => ({
  nodes: s.xynodes,
  edges: s.xyedges,
  onInit: s.onInit,
  onNodesChange: s.onNodesChange,
  onEdgesChange: s.onEdgesChange,
  nodesSelectable: s.nodesSelectable || s.focusedNodeId !== null,
  nodesDraggable: s.nodesDraggable,
  fitView: s.fitViewEnabled,
  fitViewPadding: s.fitViewPadding,
  hasOnNavigateTo: !!s.onNavigateTo,
  hasOnNodeClick: !!s.onNodeClick,
  hasOnNodeContextMenu: !!s.onNodeContextMenu,
  hasOnCanvasContextMenu: !!s.onCanvasContextMenu,
  hasOnEdgeContextMenu: !!s.onEdgeContextMenu,
  hasOnEdgeClick: !!s.onEdgeClick,
  zoomable: s.zoomable,
  pannable: s.pannable,
  // If fitView is not enabled
  // And diagram starts with a negative x or y - we need to translate viewprot
  translateX: s.fitViewEnabled ? 0 : -Math.min(s.view.bounds.x, 0),
  translateY: s.fitViewEnabled ? 0 : -Math.min(s.view.bounds.y, 0)
})

export function XYFlow({
  colorMode = 'system',
  className,
  children,
  style
}: XYFlowWrapperProps) {
  const xyflowApi = useXYStoreApi()
  const {
    nodes,
    edges,
    onInit,
    onNodesChange,
    onEdgesChange,
    nodesSelectable,
    nodesDraggable,
    fitView,
    fitViewPadding,
    pannable,
    zoomable,
    hasOnNodeClick,
    hasOnNavigateTo,
    hasOnNodeContextMenu,
    hasOnCanvasContextMenu,
    hasOnEdgeContextMenu,
    translateX,
    translateY
  } = useDiagramState(selector, shallowEqual)
  const [zoomOnDoubleClick, setZoomOnDoubleClick] = useState(zoomable)

  // useLogger('XYFlow',[
  //   nodes,
  //   edges,
  // ])

  const layoutConstraints = useLayoutConstraints()

  const handlers = useXYFlowEvents()

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
      setZoomOnDoubleClick(zoomable && zoom < 1.1)
    }
  })

  return (
    <ReactFlow<XYFlowNode, XYFlowEdge>
      className={className}
      style={style}
      {...colorMode && { colorMode }}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      zoomOnPinch={zoomable}
      zoomOnScroll={!pannable && zoomable}
      {...(!zoomable && {
        zoomActivationKeyCode: null
      })}
      maxZoom={zoomable ? MaxZoom : 1}
      minZoom={zoomable ? MinZoom : 1}
      fitView={fitView}
      fitViewOptions={useMemo(() => ({
        minZoom: MinZoom,
        maxZoom: 1,
        padding: fitViewPadding,
        includeHiddenNodes: true
      }), [fitViewPadding])}
      {...(!fitView && {
        viewport: {
          x: translateX,
          y: translateY,
          zoom: 1
        }
      })}
      preventScrolling={zoomable || pannable}
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll={pannable}
      panOnDrag={pannable}
      {...(!pannable && {
        selectionKeyCode: null
      })}
      elementsSelectable={nodesSelectable}
      nodesFocusable={nodesDraggable || nodesSelectable || hasOnNodeClick || hasOnNavigateTo}
      edgesFocusable={false}
      nodesDraggable={nodesDraggable}
      {...nodesDraggable && {
        onNodeDragStart: layoutConstraints.onNodeDragStart,
        onNodeDrag: layoutConstraints.onNodeDrag,
        onNodeDragStop: layoutConstraints.onNodeDragStop
      }}
      nodeDragThreshold={3}
      zoomOnDoubleClick={zoomOnDoubleClick}
      elevateNodesOnSelect={false} // or edges are not visible after select\
      selectNodesOnDrag={false}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onDoubleClick={handlers.onDoubleClick}
      onPaneClick={handlers.onPaneClick}
      onMoveEnd={handlers.onMoveEnd}
      onNodeMouseEnter={handlers.onNodeMouseEnter}
      onNodeMouseLeave={handlers.onNodeMouseLeave}
      onEdgeMouseEnter={handlers.onEdgeMouseEnter}
      onEdgeMouseLeave={handlers.onEdgeMouseLeave}
      onNodeClick={handlers.onNodeClick}
      onNodeDoubleClick={handlers.onNodeDoubleClick}
      onEdgeClick={handlers.onEdgeClick}
      onEdgeDoubleClick={handlers.onEdgeDoubleClick}
      onInit={onInit}
      {...(hasOnNodeContextMenu && {
        onNodeContextMenu: handlers.onNodeContextMenu
      })}
      {...(hasOnEdgeContextMenu && {
        onEdgeContextMenu: handlers.onEdgeContextMenu
      })}
      {...(hasOnCanvasContextMenu && {
        onPaneContextMenu: handlers.onPaneContextMenu
      })}>
      {children}
    </ReactFlow>
  )
}
XYFlow.displayName = 'XYFlow'

// export const XYFlow = memo(XYFlowWrapper) as typeof XYFlowWrapper
