import { useMantineColorScheme } from '@mantine/core'
import { isEqualReact } from '@react-hookz/deep-equal'
import { ReactFlow } from '@xyflow/react'
import clsx from 'clsx'
import { forwardRef, memo, type PropsWithChildren, type RefObject, useRef } from 'react'
import useTilg from 'tilg'
import type { Simplify } from 'type-fest'
import { cssDisableBg, cssDisablePan, cssReactFlow } from '../index.css'
import type { LikeC4DiagramEventHandlers, LikeC4DiagramProps } from '../LikeC4Diagram.props'
import { useDiagramStateTracked, useUpdateDiagramState } from '../state/DiagramState'
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

// export const LikeC4XYFlow = memo<DefaultData>(function XYFlow({
//   defaultNodes = [],
//   defaultEdges = [],
//   ...propsxx
// }) {
//   return null
//   // useTilg()
//   // const xyflowRef = useRef<XYFlowInstance>()
//   // const editor = useDiagramStateTracked()
//   // const colorMode = editor.colorMode === 'auto' ? 'system' : editor.colorMode

//   // const nodeDragHandlers = useNodeDragConstraints(xyflowRef)

//   // return (
//   //   <ReactFlow
//   //     colorMode={colorMode}
//   //     defaultNodes={defaultNodes}
//   //     defaultEdges={defaultEdges}
//   //     nodeTypes={nodeTypes}
//   //     edgeTypes={edgeTypes as any}
//   //     zoomOnPinch={editor.zoomable}
//   //     zoomOnScroll={!editor.pannable && editor.zoomable}
//   //     {...(!editor.zoomable && {
//   //       zoomActivationKeyCode: null
//   //     })}
//   //     maxZoom={editor.zoomable ? 1.9 : 1}
//   //     minZoom={editor.zoomable ? 0.1 : 1}
//   //     fitView
//   //     fitViewOptions={{
//   //       minZoom: 0.1,
//   //       maxZoom: 1,
//   //       padding: editor.fitViewPadding
//   //     }}
//   //     defaultMarkerColor="var(--xy-edge-stroke)"
//   //     noDragClassName="nodrag"
//   //     noPanClassName="nopan"
//   //     panOnScroll={editor.pannable}
//   //     panOnDrag={editor.pannable}
//   //     elementsSelectable={editor.nodesSelectable}
//   //     {...(!editor.nodesSelectable && {
//   //       selectionKeyCode: null
//   //     })}
//   //     nodesDraggable={editor.nodesDraggable}
//   //     // edgesUpdatable={false}
//   //     zoomOnDoubleClick={false}
//   //     elevateNodesOnSelect={false} // or edges are not visible after select
//   //     selectNodesOnDrag={false} // or weird camera movements
//   //     {...props}
//   //     onInit={useCallback((instance: XYFlowInstance) => {
//   //       xyflowRef.current = instance
//   //       editor.onInit(instance)
//   //     }, [])}
//   //     {...(editor.hasOnContextMenu && {
//   //       onNodeContextMenu: editor.onNodeContextMenu,
//   //       onPaneContextMenu: editor.onCanvasContextMenu,
//   //       onEdgeContextMenu: editor.onEdgeContextMenu
//   //     })}
//   //     {...(editor.hasOnCanvasClick && {
//   //       onPaneClick: editor.onCanvasClick
//   //     })}
//   //     {...(editor.hasOnNodeClick && {
//   //       onNodeClick: editor.onNodeClick
//   //     })}
//   //     {...(editor.hasOnEdgeClick && {
//   //       onEdgeClick: editor.onEdgeClick
//   //     })}
//   //     onNodeMouseEnter={editor.onNodeMouseEnter}
//   //     onNodeMouseLeave={editor.onNodeMouseLeave}
//   //     onEdgeMouseEnter={editor.onEdgeMouseEnter}
//   //     onEdgeMouseLeave={editor.onEdgeMouseLeave}
//   //     {...(editor.nodesDraggable && nodeDragHandlers)}
//   //     {...(!editor.pannable && { [`data-likec4-no-pan`]: '' })}
//   //     {...(editor.disableBackground && { [`data-likec4-no-bg`]: '' })}
//   //   >
//   //     {!editor.disableBackground && <Background />}
//   //     {editor.controls && <Controls />}
//   //     <Camera />
//   //     {!editor.readonly && <OptionsPanel />}
//   //   </ReactFlow>
//   // )
// }, isEqualReact)

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
      onInit={(instance: XYFlowInstance) => {
        xyflowRef.current = instance
        updateState({ viewportInitialized: true })
      }}
      onEdgeMouseEnter={(event, edge) => {
        updateState({ hoveredEdgeId: edge.id })
      }}
      onEdgeMouseLeave={() => {
        updateState({ hoveredEdgeId: null })
      }}
      onNodeMouseEnter={(event, node) => {
        updateState({ hoveredNodeId: node.id })
      }}
      onNodeMouseLeave={() => {
        updateState({ hoveredNodeId: null })
      }}
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
      })}
    >
      {children}
    </ReactFlow>
  )
}
