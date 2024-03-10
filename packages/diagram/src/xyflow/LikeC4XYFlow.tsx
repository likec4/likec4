import { isEqualReact } from '@react-hookz/deep-equal'
import { memo } from 'react'
import { RelationshipEdge } from './edges/RelationshipEdge'
import { CompoundNode } from './nodes/compound'
import { ElementNode } from './nodes/element'
import { XYFlowEdge, XYFlowNode } from './types'

type DefaultData = {
  defaultNodes?: XYFlowNode[] | undefined
  defaultEdges?: XYFlowEdge[] | undefined
}

const nodeTypes = {
  element: ElementNode,
  compound: CompoundNode
}
const edgeTypes = {
  relationship: RelationshipEdge
}

export const LikeC4XYFlow = memo<DefaultData>(function XYFlow({
  defaultNodes = [],
  defaultEdges = [],
  ...propsxx
}) {
  return null
  // useTilg()
  // const xyflowRef = useRef<XYFlowInstance>()
  // const editor = useDiagramStateTracked()
  // const colorMode = editor.colorMode === 'auto' ? 'system' : editor.colorMode

  // const nodeDragHandlers = useNodeDragConstraints(xyflowRef)

  // return (
  //   <ReactFlow
  //     colorMode={colorMode}
  //     defaultNodes={defaultNodes}
  //     defaultEdges={defaultEdges}
  //     nodeTypes={nodeTypes}
  //     edgeTypes={edgeTypes as any}
  //     zoomOnPinch={editor.zoomable}
  //     zoomOnScroll={!editor.pannable && editor.zoomable}
  //     {...(!editor.zoomable && {
  //       zoomActivationKeyCode: null
  //     })}
  //     maxZoom={editor.zoomable ? 1.9 : 1}
  //     minZoom={editor.zoomable ? 0.1 : 1}
  //     fitView
  //     fitViewOptions={{
  //       minZoom: 0.1,
  //       maxZoom: 1,
  //       padding: editor.fitViewPadding
  //     }}
  //     defaultMarkerColor="var(--xy-edge-stroke)"
  //     noDragClassName="nodrag"
  //     noPanClassName="nopan"
  //     panOnScroll={editor.pannable}
  //     panOnDrag={editor.pannable}
  //     elementsSelectable={editor.nodesSelectable}
  //     {...(!editor.nodesSelectable && {
  //       selectionKeyCode: null
  //     })}
  //     nodesDraggable={editor.nodesDraggable}
  //     // edgesUpdatable={false}
  //     zoomOnDoubleClick={false}
  //     elevateNodesOnSelect={false} // or edges are not visible after select
  //     selectNodesOnDrag={false} // or weird camera movements
  //     {...props}
  //     onInit={useCallback((instance: XYFlowInstance) => {
  //       xyflowRef.current = instance
  //       editor.onInit(instance)
  //     }, [])}
  //     {...(editor.hasOnContextMenu && {
  //       onNodeContextMenu: editor.onNodeContextMenu,
  //       onPaneContextMenu: editor.onCanvasContextMenu,
  //       onEdgeContextMenu: editor.onEdgeContextMenu
  //     })}
  //     {...(editor.hasOnCanvasClick && {
  //       onPaneClick: editor.onCanvasClick
  //     })}
  //     {...(editor.hasOnNodeClick && {
  //       onNodeClick: editor.onNodeClick
  //     })}
  //     {...(editor.hasOnEdgeClick && {
  //       onEdgeClick: editor.onEdgeClick
  //     })}
  //     onNodeMouseEnter={editor.onNodeMouseEnter}
  //     onNodeMouseLeave={editor.onNodeMouseLeave}
  //     onEdgeMouseEnter={editor.onEdgeMouseEnter}
  //     onEdgeMouseLeave={editor.onEdgeMouseLeave}
  //     {...(editor.nodesDraggable && nodeDragHandlers)}
  //     {...(!editor.pannable && { [`data-likec4-no-pan`]: '' })}
  //     {...(editor.disableBackground && { [`data-likec4-no-bg`]: '' })}
  //   >
  //     {!editor.disableBackground && <Background />}
  //     {editor.controls && <Controls />}
  //     <Camera />
  //     {!editor.readonly && <OptionsPanel />}
  //   </ReactFlow>
  // )
}, isEqualReact)
