import { useMantineColorScheme } from '@mantine/core'
import { Controls, ReactFlow as GenericReactFlow, type ReactFlowProps } from '@xyflow/react'
import { type CSSProperties, memo, type PropsWithChildren, type RefAttributes } from 'react'
import type { SetNonNullable, Simplify } from 'type-fest'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import { useDiagramStoreApi, useHasEventHandlers } from '../store'
import { MinZoom } from './const'
import { RelationshipEdge } from './edges/RelationshipEdge'
import { useLayoutConstraints } from './hooks/useLayoutConstraints'
import { CompoundNode } from './nodes/compound'
import { ElementNode } from './nodes/element'
import { XYFlowEdge, XYFlowNode } from './types'
import { XYFlowBackground } from './XYFlowBackground'
import { useXYFlowEvents } from './XYFlowEvents'

// @ts-expect-error - typing in @xyflow/react
const ReactFlow: (props: ReactFlowProps<XYFlowNode, XYFlowEdge> & RefAttributes<HTMLDivElement>) => JSX.Element =
  GenericReactFlow

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
    | 'fitView'
    | 'controls'
    | 'pannable'
    | 'zoomable'
    | 'nodesSelectable'
    | 'nodesDraggable'
    | 'fitViewPadding'
    | 'background'
  >
>

type XYFlowWrapperProps = Simplify<
  PropsWithChildren<
    SetNonNullable<OnlyExpectedProps> & {
      colorScheme: LikeC4DiagramProperties['colorScheme']
      defaultNodes: XYFlowNode[]
      defaultEdges: XYFlowEdge[]
      style?: CSSProperties | undefined
    }
  >
>

function XYFlowWrapper({
  className,
  children,
  defaultNodes,
  defaultEdges,
  fitView,
  colorScheme: colorMode,
  pannable,
  zoomable,
  nodesSelectable,
  nodesDraggable,
  fitViewPadding,
  controls,
  background,
  style
}: XYFlowWrapperProps) {
  const diagramApi = useDiagramStoreApi()
  const { isNodeInteractive } = diagramApi.getState()

  const editor = useHasEventHandlers()
  console.log('XYFlowWrapper')
  const layoutConstraints = useLayoutConstraints()

  const handlers = useXYFlowEvents()
  const isBgWithPattern = background !== 'transparent' && background !== 'solid'
  // const { colorScheme } = useMantineColorScheme()
  // let colorMode = colorModeProp ?? (colorScheme !== 'auto' ? colorScheme : undefined)

  return (
    <ReactFlow
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
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll={pannable}
      panOnDrag={pannable}
      elementsSelectable={nodesSelectable}
      {...(!nodesSelectable && {
        selectionKeyCode: null
      })}
      nodesDraggable={nodesDraggable}
      {...(nodesDraggable && layoutConstraints)}
      zoomOnDoubleClick={false}
      elevateNodesOnSelect={false} // or edges are not visible after select
      selectNodesOnDrag={false} // or weird camera movement
      onInit={(xyflow) => {
        diagramApi.setState({
          xyflow,
          xyflowInitialized: true
        })
      }}
      onPaneClick={handlers.onPaneClick}
      onMoveStart={handlers.onMoveStart}
      onMoveEnd={handlers.onMoveEnd}
      {...(isNodeInteractive && {
        onEdgeMouseEnter: (_event, edge) => {
          diagramApi.setState({ hoveredEdgeId: edge.id })
        },
        onEdgeMouseLeave: () => {
          diagramApi.setState({ hoveredEdgeId: null })
        },
        onNodeMouseEnter: (_event, node) => {
          diagramApi.setState({ hoveredNodeId: node.id })
        },
        onNodeMouseLeave: () => {
          diagramApi.setState({ hoveredNodeId: null })
        }
      })}
      {...(editor.hasOnContextMenu && {
        onNodeContextMenu: handlers.onNodeContextMenu,
        onPaneContextMenu: handlers.onPaneContextMenu,
        onEdgeContextMenu: handlers.onEdgeContextMenu
      })}
      {...(editor.hasOnNodeClick && {
        onNodeClick: handlers.onNodeClick
      })}
      {...(editor.hasOnEdgeClick && {
        onEdgeClick: handlers.onEdgeClick
      })}>
      {isBgWithPattern && <XYFlowBackground background={background} />}
      {controls && <Controls />}
      {children}
    </ReactFlow>
  )
}

export const XYFlow = memo(XYFlowWrapper) as typeof XYFlowWrapper
