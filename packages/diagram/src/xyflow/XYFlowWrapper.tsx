import { useMantineColorScheme } from '@mantine/core'
import { Controls, ReactFlow } from '@xyflow/react'
import { type CSSProperties, memo, type PropsWithChildren } from 'react'
import type { SetNonNullable, Simplify } from 'type-fest'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import { type DiagramState, useDiagramState, useDiagramStoreApi } from '../state'
import { MinZoom } from './const'
import { RelationshipEdge } from './edges/RelationshipEdge'
import { useLayoutConstraints } from './hooks/useLayoutConstraints'
import { CompoundNode } from './nodes/compound'
import { ElementNode } from './nodes/element'
import { XYFlowEdge, XYFlowNode } from './types'
import { XYFlowBackground } from './XYFlowBackground'
import { useXYFlowEvents } from './XYFlowEvents'

const nodeTypes = {
  element: ElementNode,
  compound: CompoundNode
}
const edgeTypes = {
  relationship: RelationshipEdge
}

type OnlyExpectedProps = Required<
  Pick<
    LikeC4DiagramProperties,
    | 'className'
    | 'controls'
    | 'pannable'
    | 'zoomable'
    | 'background'
  >
>

type XYFlowWrapperProps = Simplify<
  PropsWithChildren<
    SetNonNullable<OnlyExpectedProps> & {
      defaultNodes: XYFlowNode[]
      defaultEdges: XYFlowEdge[]
      style?: CSSProperties | undefined
    }
  >
>

const selector = (s: DiagramState) => ({
  nodesSelectable: s.nodesSelectable,
  nodesDraggable: s.nodesDraggable,
  fitView: s.fitViewEnabled,
  fitViewPadding: s.fitViewPadding,
  hasOnNavigateTo: !!s.onNavigateTo,
  hasOnNodeClick: !!s.onNodeClick,
  hasOnNodeContextMenu: !!s.onNodeContextMenu,
  hasOnCanvasContextMenu: !!s.onCanvasContextMenu,
  hasOnEdgeContextMenu: !!s.onEdgeContextMenu,
  hasOnEdgeClick: !!s.onEdgeClick,
  hasOnCanvasClick: !!s.onCanvasClick || !!s.onCanvasDblClick
})

function XYFlowWrapper({
  className,
  children,
  defaultNodes,
  defaultEdges,
  pannable,
  zoomable,
  controls,
  background,
  style
}: XYFlowWrapperProps) {
  const diagramApi = useDiagramStoreApi()
  const {
    nodesSelectable,
    nodesDraggable,
    fitView,
    fitViewPadding,
    ...editor
  } = useDiagramState(selector)

  const layoutConstraints = useLayoutConstraints()

  const handlers = useXYFlowEvents()
  const isBgWithPattern = background !== 'transparent' && background !== 'solid'

  const { colorScheme } = useMantineColorScheme()
  const colorMode = colorScheme !== 'auto' ? colorScheme : undefined

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
      fitViewOptions={{
        minZoom: MinZoom,
        maxZoom: 1,
        padding: fitViewPadding,
        includeHiddenNodes: true
      }}
      preventScrolling={zoomable || pannable}
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll={pannable}
      panOnDrag={pannable}
      elementsSelectable={nodesSelectable}
      nodesFocusable={nodesDraggable || nodesSelectable || editor.hasOnNodeClick || editor.hasOnNavigateTo}
      edgesFocusable={editor.hasOnEdgeClick}
      {...(!nodesSelectable && {
        selectionKeyCode: null
      })}
      nodesDraggable={nodesDraggable}
      {...(nodesDraggable && layoutConstraints)}
      zoomOnDoubleClick={false}
      elevateNodesOnSelect={false} // or edges are not visible after select
      selectNodesOnDrag={false} // or weird camera movement
      onPaneClick={handlers.onPaneClick}
      {...(editor.hasOnNodeClick && {
        onNodeClick: handlers.onNodeClick
      })}
      {...(editor.hasOnEdgeClick && {
        onEdgeClick: handlers.onEdgeClick
      })}
      onMoveEnd={handlers.onMoveEnd}
      onInit={() => {
        diagramApi.setState({ initialized: true }, false, 'initialized')
      }}
      onNodeMouseEnter={(_event, node) => {
        diagramApi.getState().setHoveredNode(node.id)
      }}
      onNodeMouseLeave={() => {
        diagramApi.getState().setHoveredNode(null)
      }}
      onEdgeMouseEnter={(_event, edge) => {
        diagramApi.getState().setHoveredEdge(edge.id)
      }}
      onEdgeMouseLeave={() => {
        diagramApi.getState().setHoveredEdge(null)
      }}
      {...(editor.hasOnNodeContextMenu && {
        onNodeContextMenu: handlers.onNodeContextMenu
      })}
      {...(editor.hasOnEdgeContextMenu && {
        onEdgeContextMenu: handlers.onEdgeContextMenu
      })}
      {...(editor.hasOnCanvasContextMenu && {
        onPaneContextMenu: handlers.onPaneContextMenu
      })}>
      {isBgWithPattern && <XYFlowBackground background={background} />}
      {controls && <Controls />}
      {children}
    </ReactFlow>
  )
}

export const XYFlow = memo(XYFlowWrapper) as typeof XYFlowWrapper
