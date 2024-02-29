import { isEqualReact } from '@react-hookz/deep-equal'
import { Background, Controls, ReactFlow, type ReactFlowProps } from '@xyflow/react'
import { memo, useCallback } from 'react'
import useTilg from 'tilg'
import { useDiagramStateTracked, useSelectDiagramState, useUpdateDiagramState } from '../state'
import { Camera, OptionsPanel } from '../ui'
import { edgeTypes } from './edges'
import { nodeTypes } from './nodes'
import { XYFlowEdge, XYFlowNode } from './types'

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
  const editor = useDiagramStateTracked()
  const update = useUpdateDiagramState()
  const colorMode = editor.colorMode === 'auto' ? 'system' : editor.colorMode
  return (
    <ReactFlow
      colorMode={colorMode}
      defaultNodes={defaultNodes}
      defaultEdges={defaultEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
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
      selectNodesOnDrag={false} // or camera does not work
      {...props}
      onInit={editor.onInit}
      onEdgeMouseEnter={editor.onEdgeMouseEnter}
      onEdgeMouseLeave={editor.onEdgeMouseLeave}
      {...(!editor.pannable && { [`data-likec4-nopan`]: '' })}
      {...(editor.disableBackground && { [`data-likec4-nobg`]: '' })}
    >
      {!editor.disableBackground && <Background />}
      {editor.controls && <Controls />}
      <Camera />
      {!editor.readonly && <OptionsPanel />}
    </ReactFlow>
  )
}, isEqualReact)
