import { ReactFlow, useOnViewportChange } from '@xyflow/react'
import { deepEqual as eq, shallowEqual } from 'fast-equals'
import { type CSSProperties, type PropsWithChildren, useCallback, useMemo } from 'react'
import type { DiagramState } from '../state/diagramStore'
import { useDiagramState, useDiagramStoreApi } from '../state/useDiagramStore'
import { MinZoom } from './const'
import { RelationshipEdge } from './edges/RelationshipEdge'
import { useLayoutConstraints } from './hooks/useLayoutConstraints'
import { useXYStoreApi } from './hooks/useXYFlow'
import { CompoundNode } from './nodes/compound'
import { ElementNode } from './nodes/element'
import { XYFlowEdge, XYFlowNode } from './types'
import { useXYFlowEvents } from './XYFlowEvents'
// import { useLogger } from '@mantine/hooks'

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
  pannable: s.pannable
})

export function XYFlow({
  colorMode = 'system',
  className,
  children,
  style
}: XYFlowWrapperProps) {
  const xyflowApi = useXYStoreApi()
  const diagramApi = useDiagramStoreApi()
  const {
    nodes,
    edges,
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
    hasOnEdgeContextMenu
  } = useDiagramState(selector, shallowEqual)

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
      maxZoom={zoomable ? 1.9 : 1}
      minZoom={zoomable ? MinZoom : 1}
      fitView={fitView}
      fitViewOptions={useMemo(() => ({
        minZoom: MinZoom,
        maxZoom: 1,
        padding: fitViewPadding,
        includeHiddenNodes: true
      }), [fitViewPadding])}
      preventScrolling={zoomable || pannable}
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll={pannable}
      panOnDrag={pannable}
      elementsSelectable={nodesSelectable}
      nodesFocusable={nodesDraggable || nodesSelectable || hasOnNodeClick || hasOnNavigateTo}
      edgesFocusable={false}
      nodesDraggable={nodesDraggable}
      {...nodesDraggable && {
        onNodeDragStart: layoutConstraints.onNodeDragStart,
        onNodeDrag: layoutConstraints.onNodeDrag,
        onNodeDragStop: layoutConstraints.onNodeDragStop
      }}
      nodeDragThreshold={2}
      zoomOnDoubleClick={false}
      elevateNodesOnSelect={false} // or edges are not visible after select\
      selectNodesOnDrag={false} // or weird camera movement
      selectionKeyCode={null}
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
      onInit={useCallback(() => {
        diagramApi.setState({ initialized: true }, false, 'initialized')
      }, [diagramApi])}
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

// export const XYFlow = memo(XYFlowWrapper) as typeof XYFlowWrapper
