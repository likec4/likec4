import { useMantineColorScheme } from '@mantine/core'
import { ReactFlow } from '@xyflow/react'
import clsx from 'clsx'
import { type PropsWithChildren, useCallback, useRef } from 'react'
import useTilg from 'tilg'
import type { Simplify } from 'type-fest'
import { cssDisableBg, cssDisablePan, cssReactFlow } from '../index.css'
import type { LikeC4DiagramProps } from '../LikeC4Diagram.props'
import { useDiagramStateTracked } from '../state/DiagramState'
import { RelationshipEdge } from './edges/RelationshipEdge'
import { useLayoutConstraints } from './hooks/use-layout-сonstraints'
import { CompoundNode } from './nodes/compound'
import { ElementNode } from './nodes/element'
import { XYFlowEdge, type XYFlowInstance, XYFlowNode } from './types'
import { useXYFLowEventHandlers } from './XYFLowEventHandlers'

const nodeTypes = {
  element: ElementNode,
  compound: CompoundNode
}
const edgeTypes = {
  relationship: RelationshipEdge
}

type XYFlowWrapperProps = Simplify<
  PropsWithChildren<
    Required<Omit<LikeC4DiagramProps, 'view' | 'disableHovercards' | 'controls'>> & {
      defaultNodes: XYFlowNode[]
      defaultEdges: XYFlowEdge[]
    }
  >
>

export function XYFlowWrapper({
  children,
  defaultNodes,
  defaultEdges,
  fitView = true,
  colorMode: colorModeProp,
  readonly = false,
  pannable = true,
  zoomable = true,
  nodesSelectable = !readonly,
  nodesDraggable = !readonly,
  disableBackground = false,
  fitViewPadding = 0.05
}: XYFlowWrapperProps) {
  useTilg()

  const xyflowRef = useRef<XYFlowInstance>()
  const [editor, updateState] = useDiagramStateTracked()
  const layoutConstraints = useLayoutConstraints(xyflowRef)

  const handlers = useXYFLowEventHandlers()

  const { colorScheme } = useMantineColorScheme()
  let colorMode = colorModeProp ?? (colorScheme !== 'auto' ? colorScheme : undefined)

  return (
    // @ts-expect-error invalid typings ReactFlow
    <ReactFlow
      className={clsx(disableBackground ? cssDisableBg : cssReactFlow, !pannable && cssDisablePan)}
      {...colorMode && { colorMode }}
      defaultNodes={defaultNodes}
      defaultEdges={defaultEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes as any}
      zoomOnPinch={zoomable}
      zoomOnScroll={!pannable && zoomable}
      {...(!zoomable && {
        zoomActivationKeyCode: null
      })}
      maxZoom={zoomable ? 1.9 : 1}
      minZoom={zoomable ? 0.1 : 1}
      fitView={fitView}
      fitViewOptions={{
        minZoom: 0.1,
        maxZoom: 1,
        padding: fitViewPadding
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
      // edgesUpdatable={false}
      zoomOnDoubleClick={false}
      elevateNodesOnSelect={false} // or edges are not visible after select
      selectNodesOnDrag={false} // or weird camera movement
      onInit={useCallback((instance: XYFlowInstance) => {
        xyflowRef.current = instance
        updateState({ viewportInitialized: true })
      }, [])}
      onEdgeMouseEnter={useCallback((event: React.MouseEvent, edge: XYFlowEdge) => {
        updateState({ hoveredEdgeId: edge.id })
      }, [])}
      onEdgeMouseLeave={useCallback(() => {
        updateState({ hoveredEdgeId: null })
      }, [updateState])}
      onNodeMouseEnter={useCallback((event: React.MouseEvent, node: XYFlowNode) => {
        updateState({ hoveredNodeId: node.id })
      }, [updateState])}
      onNodeMouseLeave={useCallback(() => {
        updateState({ hoveredNodeId: null })
      }, [])}
      {...(editor.hasOnContextMenu && {
        onNodeContextMenu: handlers.onNodeContextMenu,
        onPaneContextMenu: handlers.onPaneContextMenu,
        onEdgeContextMenu: handlers.onEdgeContextMenu
      })}
      {...(editor.hasOnCanvasClick && {
        onPaneClick: handlers.onPanelClick
      })}
      {...(editor.hasOnNodeClick && {
        onNodeClick: handlers.onNodeClick
      })}
      {...(editor.hasOnEdgeClick && {
        onEdgeClick: handlers.onEdgeClick
      })}>
      {children}
    </ReactFlow>
  )
}
