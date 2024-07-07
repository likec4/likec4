import { ReactFlow, useOnViewportChange } from '@xyflow/react'
import { DEV } from 'esm-env'
import { deepEqual as eq } from 'fast-equals'
import { type CSSProperties, type PropsWithChildren, useCallback } from 'react'
import useTilg from 'tilg'
import { type DiagramState, useDiagramState, useDiagramStoreApi } from '../state/hooks'
import { MinZoom } from './const'
import { RelationshipEdge } from './edges/RelationshipEdge'
import { useLayoutConstraints } from './hooks/useLayoutConstraints'
import { useXYStoreApi } from './hooks/useXYFlow'
import { CompoundNode } from './nodes/compound'
import { ElementNode } from './nodes/element'
import { XYFlowEdge, XYFlowNode } from './types'
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
  defaultNodes: XYFlowNode[]
  defaultEdges: XYFlowEdge[]
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
  nodesSelectable: s.nodesSelectable || s.focusedNodeId !== null,
  nodesDraggable: s.nodesDraggable,
  fitView: s.fitViewEnabled,
  fitViewOptions: {
    minZoom: MinZoom,
    maxZoom: 1,
    padding: s.fitViewPadding,
    includeHiddenNodes: true
  },
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
  defaultNodes,
  defaultEdges,
  style
}: XYFlowWrapperProps) {
  DEV && useTilg()
  const xyflowApi = useXYStoreApi()
  const diagramApi = useDiagramStoreApi()
  const {
    nodesSelectable,
    nodesDraggable,
    fitView,
    fitViewOptions,
    pannable,
    zoomable,
    hasOnNodeClick,
    hasOnNavigateTo,
    hasOnNodeContextMenu,
    hasOnCanvasContextMenu,
    hasOnEdgeContextMenu,
    hasOnEdgeClick
  } = useDiagramState(selector, eq)

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
      const rounded = {
        x: Math.round(x),
        y: Math.round(y)
      }
      if (x !== rounded.x || y !== rounded.y) {
        xyflowApi.setState({ transform: [rounded.x, rounded.y, zoom] })
      }
    }
  })

  return (
    <ReactFlow<XYFlowNode, XYFlowEdge>
      className={className}
      style={style}
      {...colorMode && { colorMode }}
      defaultNodes={defaultNodes}
      defaultEdges={defaultEdges}
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
      fitViewOptions={fitViewOptions}
      preventScrolling={zoomable || pannable}
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll={pannable}
      panOnDrag={pannable}
      elementsSelectable={nodesSelectable}
      nodesFocusable={nodesDraggable || nodesSelectable || hasOnNodeClick || hasOnNavigateTo}
      edgesFocusable={hasOnEdgeClick}
      nodesDraggable={nodesDraggable}
      {...nodesDraggable && {
        onNodeDragStart: layoutConstraints.onNodeDragStart,
        onNodeDrag: layoutConstraints.onNodeDrag,
        onNodeDragStop: layoutConstraints.onNodeDragStop
      }}
      zoomOnDoubleClick={false}
      elevateNodesOnSelect={false} // or edges are not visible after select
      selectNodesOnDrag={false} // or weird camera movement
      selectionKeyCode={null}
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
