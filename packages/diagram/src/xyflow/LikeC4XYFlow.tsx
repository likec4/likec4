import { isEqualReact } from '@react-hookz/deep-equal'
import { Background, Controls, ReactFlow, type ReactFlowProps } from '@xyflow/react'
import { memo, useCallback, useRef } from 'react'
import useTilg from 'tilg'
import { useDiagramStateTracked, useSelectDiagramState, useUpdateDiagramState } from '../state'
import { Camera, OptionsPanel } from '../ui'
import { edgeTypes } from './edges'
import { nodeTypes } from './nodes'
import { XYFlowEdge, type XYFlowInstance, XYFlowNode } from './types'
import { useNodeDragConstraints } from './useNodeDragConstraints'

export type LikeC4XYFlowProps = Pick<
  ReactFlowProps,
  'fitView' | 'fitViewOptions' | 'colorMode' | 'maxZoom' | 'minZoom' | 'className' | 'width' | 'height'
>

type DefaultData = {
  defaultNodes?: XYFlowNode[] | undefined
  defaultEdges?: XYFlowEdge[] | undefined
}

export const LikeC4XYFlow = memo<DefaultData & LikeC4XYFlowProps>(function XYFlow({
  defaultNodes = [],
  defaultEdges = [],
  ...props
}) {
  useTilg()
  const xyflowRef = useRef<XYFlowInstance>()
  const editor = useDiagramStateTracked()
  const colorMode = editor.colorMode === 'auto' ? 'system' : editor.colorMode

  const dragHandglers = useNodeDragConstraints(xyflowRef)

  return (
    <ReactFlow
      colorMode={colorMode}
      defaultNodes={defaultNodes}
      defaultEdges={defaultEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes as any}
      zoomOnPinch={editor.zoomable}
      zoomOnScroll={!editor.pannable && editor.zoomable}
      {...(!editor.zoomable && {
        zoomActivationKeyCode: null
      })}
      maxZoom={editor.zoomable ? 1.9 : 1}
      minZoom={editor.zoomable ? 0.1 : 1}
      fitView
      fitViewOptions={{
        minZoom: 0.1,
        maxZoom: 1,
        padding: editor.fitViewPadding
      }}
      defaultMarkerColor="var(--xy-edge-stroke)"
      noDragClassName="nodrag"
      noPanClassName="nopan"
      panOnScroll={editor.pannable}
      panOnDrag={editor.pannable}
      elementsSelectable={editor.nodesSelectable}
      {...(!editor.nodesSelectable && {
        selectionKeyCode: null
      })}
      nodesDraggable={editor.nodesDraggable}
      // edgesUpdatable={false}
      zoomOnDoubleClick={false}
      elevateNodesOnSelect={false} // or edges are not visible after select
      selectNodesOnDrag={false} // or weird camera movements
      {...props}
      onInit={useCallback((instance: XYFlowInstance) => {
        xyflowRef.current = instance
        editor.onInit(instance)
      }, [])}
      onEdgeMouseEnter={editor.onEdgeMouseEnter}
      onEdgeMouseLeave={editor.onEdgeMouseLeave}
      {...(editor.nodesDraggable && dragHandglers)}
      {...(!editor.pannable && { [`data-likec4-no-pan`]: '' })}
      {...(editor.disableBackground && { [`data-likec4-no-bg`]: '' })}
    >
      {!editor.disableBackground && <Background />}
      {editor.controls && <Controls />}
      <Camera />
      {!editor.readonly && <OptionsPanel />}
    </ReactFlow>
  )
}, isEqualReact)
